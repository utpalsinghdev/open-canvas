import { createEditorStore, type EditorStore } from '../src/editor/state';
import { createMutations } from '../src/mcp/mutations';
import { createReads } from '../src/mcp/reads';
import { createWorkspaceHandlers } from '../src/mcp/workspace-commands';
import { createReviewHandlers } from '../src/mcp/review-commands';
import { mutationTargetSchema, targetSchema, tools } from '../src/mcp/tools';
import { currentFile, firstLocation, projectPage, type Location } from '../src/workspace/model';
import { viewPatch } from '../src/workspace/state';
import { serviceRequestSchema, type ServiceRecord } from '../src/workspace/service-schema';
import { workspaceStorage, WorkspacePublicationUncertain } from './workspace-storage';

/** One serialization queue covers CAS, engine execution and durable publication. */
export async function createWorkspaceService(root: string, accessChanged: (id: string, enabled: boolean) => void = () => {}) {
  const storage = await workspaceStorage(root);
  const records = await storage.load();
  for (const record of records.values()) projectPage(record.workspace, record.context);
  const engines = new Map<string, EditorStore>();
  let queue = Promise.resolve();
  let unavailable = false;
  let closing = false;
  function summary(record: ServiceRecord) {
    const { workspace: _workspace, ...result } = record;
    return result;
  }
  async function publish(record: ServiceRecord, creating = false) {
    try { await storage.write(record, creating); }
    catch (error) {
      // Storage errors may follow publication. Stop writes rather than replaying them.
      if (error instanceof WorkspacePublicationUncertain) unavailable = true;
      throw error;
    }
    records.set(record.id, record);
    return record;
  }
  function engine(record: ServiceRecord) {
    let store = engines.get(record.id);
    if (!store) {
      store = createEditorStore(record.workspace);
      engines.set(record.id, store);
    }
    store.setState({
      ...viewPatch(store.getState(), record.workspace, record.context),
      ready: true, saveState: 'saved', persistenceBlocked: false,
    });
    return store;
  }
  async function execute(value: unknown, source: 'browser' | 'agent') {
    if (unavailable) throw new Error('Workspace service stopped after a storage error. Keep browser backups and coordinate recovery. Do not retry writes.');
    const request = serviceRequestSchema.parse(value);
    if (request.method === 'list') return [...records.values()].map(summary);
    if (request.method === 'create') {
      if (records.has(request.id)) throw new Error('Workspace ID already exists. Read it before retrying.');
      if (records.size >= 50) throw new Error('Keep at most 50 local workspaces.');
      projectPage(request.workspace, request.context);
      return publish({ id: request.id, name: request.name, workspace: request.workspace, context: request.context, revision: 0, agentEnabled: true }, true);
    }
    const record = records.get(request.id);
    if (!record) throw new Error('Workspace unavailable. Select an explicit ID from list_workspaces; no other workspace was substituted.');
    if (request.method === 'read') return record;
    if (request.method === 'save' || request.method === 'access') {
      if (source !== 'browser') throw new Error('Only the browser workspace controls saves and access.');
      if (request.expectedRevision !== record.revision)
        throw new Error(`Workspace revision conflict. Current revision is ${record.revision}. Download your browser backup before reloading.`);
      const context = request.method === 'save'
        ? validLocation(request.workspace, record.context) : record.context;
      const next = request.method === 'save'
        ? { ...record, workspace: request.workspace, context, revision: record.revision + 1 }
        : { ...record, agentEnabled: request.enabled, revision: record.revision + 1 };
      const result = await publish(next);
      engines.delete(record.id);
      if (request.method === 'access') accessChanged(record.id, request.enabled);
      return result;
    }
    if (source !== 'agent') throw new Error('Browser workspace endpoint cannot execute MCP commands.');
    if (!record.agentEnabled) throw new Error('Agent access paused for this workspace. Resume it from the browser workspace.');
    const definition = Object.entries(tools).find(([name]) => name === request.tool)?.[1];
    if (!definition) throw new Error('Unsupported tool.');
    const args = definition.schema.parse(request.args);
    const target = targetSchema.parse(args);
    if (target.workspaceId !== record.id || target.canvasId)
      throw new Error('Explicit workspace target mismatch. Do not combine canvasId and workspaceId.');
    if (request.tool === 'get_screenshot' || request.tool === 'write_html' ||
      (request.tool === 'export_document' && 'format' in args && args.format !== 'json'))
      throw new Error('This operation requires browser rendering. Use an explicitly connected canvasId, or JSON export. Headless rendering is not implemented.');
    if (definition.mutation && mutationTargetSchema.parse(args).expectedRevision !== record.revision)
      throw new Error(`Revision conflict. Current revision is ${record.revision}. Read state before deciding whether to retry.`);
    const store = engine(record);
    if (target.context) {
      projectPage(record.workspace, target.context);
      const context = target.context;
      const workspace = { ...record.workspace, projects: record.workspace.projects.map((project) => ({
        ...project, files: project.files.map((file) => file.id === context.fileId ? { ...file, pageId: context.pageId } : file),
      })) };
      store.setState(viewPatch(store.getState(), workspace, context));
    }
    const handler = createReviewHandlers(store)[request.tool] ??
      createWorkspaceHandlers(store)[request.tool] ??
      (definition.mutation ? createMutations(store)[request.tool] : createReads(store)[request.tool]);
    if (!handler) throw new Error('Tool implementation unavailable.');
    try {
      const result = await handler(request.args);
      const state = store.getState();
      // Check response size before publishing a mutation, not after an uncertain send.
      const response = {
        workspaceId: record.id,
        revision: record.revision + (definition.mutation ? 1 : 0),
        context: state.location, result, persistence: 'saved',
      };
      if (Buffer.byteLength(JSON.stringify(response)) > 12_000_000)
        throw new Error('Response exceeds 12 MB. Use the browser workspace backup.');
      if (definition.mutation) await publish({
        ...record, revision: response.revision, workspace: state.workspace, context: state.location,
      });
      return response;
    } catch (error) {
      engines.delete(record.id);
      throw error;
    }
  }
  return {
    async close() { closing = true; await queue; },
    request(value: unknown, source: 'browser' | 'agent' = 'agent'): Promise<unknown> {
      if (closing) return Promise.reject(new Error('Workspace service shutting down. Read saved state after coordinated reconnect.'));
      const result = queue.then(() => execute(value, source));
      queue = result.then(() => {}, () => {});
      return result;
    },
  };
}
function validLocation(workspace: ServiceRecord['workspace'], location: Location) {
  try { projectPage(workspace, location); return location; }
  catch {
    try {
      const file = currentFile(workspace, location);
      return { ...location, pageId: file.pageId };
    } catch { return firstLocation(workspace); }
  }
}
