import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createBroker } from './broker';
import { coverage, targetSchema, tools } from '../src/mcp/tools';

const broker = await createBroker();
const server = new McpServer(
  { name: 'open-cavas', version: '0.2.0' },
  {
    instructions:
      'Controls a paired Open Cavas browser, not Paper. Start with get_capabilities and list_canvases. Get current state before edits, pass its revision to every mutation, and read back your result. A successful edit is in-memory, not proof of durable storage. Never retry a timed-out mutation without reading state. No browser paired means no document access.',
  }
);
function text(result: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}
server.registerTool(
  'get_capabilities',
  {
    description:
      'Read supported capabilities and explicit Paper parity gaps. No browser required.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  () =>
    text({
      ...coverage,
      transport: 'stdio with authenticated private WebSocket browser pairing',
      limits: {
        layers: 1000,
        history: 80,
        tokens: 200,
        messageBytes: 12_000_000,
      },
    })
);
server.registerTool(
  'list_canvases',
  {
    description:
      'List explicitly paired browser canvases and their latest state revisions.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  () => text({ canvases: broker.list() })
);
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
        const result = await broker.call(
          target.canvasId,
          name,
          args,
          extra.signal
        );
        if (name === 'get_screenshot') {
          const image = z
            .object({
              revision: z.number(),
              result: z.object({
                data: z.string().max(12_000_000),
                mimeType: z.literal('image/png'),
                width: z.number(),
                height: z.number(),
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
                  width: image.result.width,
                  height: image.result.height,
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
  `Open Cavas MCP ready. Browser pairing file: ${broker.pairingPath}\n`
);
