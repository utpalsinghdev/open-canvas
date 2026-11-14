import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createBroker } from './broker';
import { runtimeSettings } from '../scripts/runtime-settings.mjs';
import { newId } from '../src/editor/model';
import { firstLocation, initialWorkspace, itemName } from '../src/workspace/model';
import { locationSchema } from '../src/workspace/model';
import { fonts } from '../src/editor/model';
import { coverage, targetSchema, tools } from '../src/mcp/tools';

const broker = await createBroker();
const server = new McpServer(
  { name: 'open-cavas', version: '0.4.0' },
  {
    instructions:
      'Controls local Open Cavas workspaces, not Paper. Start with get_capabilities and list_workspaces. Use an explicit workspaceId for browser-independent operations, or canvasId from list_canvases for browser rendering. Get current state before edits, pass its revision to every mutation and its exact context to page/content mutations, and read back your result. Workspace-target edits acknowledge durable storage; canvas-target edits are in-memory and report browser persistence separately. Never retry a timed-out mutation without reading state. No browser is needed for workspace data operations. Browser rendering still needs an open tab. Connections are automatic; no pairing code is needed.',
  }
);
function text(result: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}
server.registerTool(
  'get_capabilities',
  {
    description:
      'Read local supported capabilities and explicit Paper parity gaps, not broker health. Use list_canvases to check broker access, then read a canvas to check document access. No browser required.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  () =>
    text({
      ...coverage,
      runtime: {
        profile: runtimeSettings().profile,
        origin: runtimeSettings().origin,
        release: process.env.CAVAS_RELEASE_COMMIT ?? 'development',
      },
      transport:
        'stdio with authenticated private local workspace service; optional WebSocket browser rendering',
      limits: {
        layersPerPage: 1000,
        layersPerFile: 10_000,
        pagesPerFile: 100,
        projects: 50,
        filesPerProject: 50,
        totalFiles: 200,
        history: 80,
        tokens: 200,
        threadsPerPage: 100,
        threadsPerFile: 500,
        commentsPerThread: 100,
        commentsPerFile: 2000,
        commentCharacters: 4000,
        reviewCharactersPerFile: 1_000_000,
        messageBytes: 12_000_000,
      },
    })
);
server.registerTool(
  'list_canvases',
  {
    description:
      'List automatically connected browser canvases and their latest state revisions.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => text({ canvases: await broker.list() })
);
server.registerTool('list_workspaces', {
  description: 'List durable local workspaces, access status, revisions and agent context. Works with no browser. Select an explicit workspaceId.',
  inputSchema: {}, annotations: { readOnlyHint: true },
}, async () => text({ workspaces: await broker.workspace({ method: 'list' }) }));
server.registerTool('create_workspace', {
  description: 'Create an independent empty local workspace. No browser or migration required. Read list_workspaces before retrying an uncertain create.',
  inputSchema: { name: itemName }, annotations: { destructiveHint: false, idempotentHint: false },
}, async ({ name }) => {
  const workspace = initialWorkspace({ version: 1, name: 'Untitled', nodes: [], tokens: {} });
  const record = await broker.workspace({ method: 'create', id: newId(), name, workspace, context: firstLocation(workspace) });
  return text(record);
});
for (const [name, definition] of Object.entries(tools)) {
  server.registerTool(
    name,
    {
      description: definition.description,
      inputSchema: definition.schema.shape,
      annotations: {
        readOnlyHint: !definition.mutation,
        destructiveHint: definition.mutation,
        idempotentHint: !definition.mutation,
        openWorldHint: false,
      },
    },
    async (
      args: unknown,
      extra: { signal: AbortSignal }
    ): Promise<CallToolResult> => {
      try {
        const target = targetSchema.parse(args);
        if (Boolean(target.workspaceId) === Boolean(target.canvasId))
          throw new Error('Choose exactly one workspaceId or canvasId.');
        if (extra.signal.aborted) throw new Error('Request cancelled before dispatch.');
        const result = target.workspaceId
          ? await broker.workspace({ method: 'call', id: target.workspaceId, tool: name, args })
          : target.canvasId
            ? await broker.call(target.canvasId, name, args, extra.signal)
            : undefined;
        if (name === 'get_screenshot') {
          const image = z
            .object({
              revision: z.number(),
              context: locationSchema,
              result: z.object({
                data: z.string().max(12_000_000),
                mimeType: z.literal('image/png'),
                width: z.number(),
                height: z.number(),
                scale: z.number().positive(),
                bounds: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
                fonts: z.record(z.enum(fonts), z.enum(['loading', 'available', 'unavailable', 'system'])),
              }),
            })
            .parse(result);
          return {
            content: [
              { type: 'image', data: image.result.data, mimeType: 'image/png' },
              {
                type: 'text',
                text: JSON.stringify({
                  revision: image.revision,
                  context: image.context,
                  width: image.result.width,
                  height: image.result.height,
                  scale: image.result.scale,
                  bounds: image.result.bounds,
                  fonts: image.result.fonts,
                }),
              },
            ],
          };
        }
        return text(result);
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : 'Request failed.',
            },
          ],
        };
      }
    }
  );
}
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await broker.close();
  await server.close();
}
process.once('SIGINT', () => {
  void shutdown();
});
process.once('SIGTERM', () => {
  void shutdown();
});
const transport = new StdioServerTransport();
server.server.onclose = () => {
  void shutdown();
};
await server.connect(transport);
process.stderr.write(
  `Open Cavas MCP ready. Private broker metadata: ${broker.metadataPath}\n`
);
