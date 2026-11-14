// State-only allocation profile, not browser or GPU memory accounting.
// Run with: node --expose-gc --import tsx scripts/profile-memory.mjs
import { createWorkspaceActions } from '../src/workspace/actions.ts';
import { workspaceSchema, firstLocation } from '../src/workspace/model.ts';
import { viewPatch } from '../src/workspace/state.ts';
import { createNode } from '../src/editor/model.ts';

const workspace = workspaceSchema.parse({
  kind: 'open-cavas-workspace',
  version: 1,
  projects: [{
    id: 'project',
    name: 'Memory profile',
    files: [{
      id: 'file',
      pageId: 'page-0',
      document: {
        version: 2,
        name: 'Memory profile',
        tokens: {},
        pages: Array.from({ length: 100 }, (_, page) => ({
          id: `page-${page}`,
          name: `Page ${page}`,
          nodes: Array.from({ length: 100 }, (_, index) => ({
            ...createNode('rectangle', index * 4, page * 4),
            id: `node-${page}-${index}`,
          })),
        })),
      },
    }],
  }],
});
const location = firstLocation(workspace);
let state = {
  workspace, location,
  document: { version: 1, name: '', tokens: {}, nodes: [] },
  histories: {}, past: [], future: [], selectedIds: [], tool: 'select',
  interactionActive: false, message: '', ready: true,
  saveState: 'saved', persistenceBlocked: false,
};
state = { ...state, ...viewPatch(state, workspace, location) };
const actions = createWorkspaceActions(
  () => state,
  (patch) => { state = { ...state, ...patch }; }
);
for (let edit = 0; edit < 100; edit++) {
  const file = state.workspace.projects[0].files[0];
  actions.commitFile('project', {
    ...file,
    document: {
      ...file.document,
      pages: file.document.pages.map((page, index) => index ? page : {
        ...page,
        nodes: page.nodes.map((node, index) => index ? node : {
          ...node, x: edit + 1,
        }),
      }),
    },
  });
}
const files = [...state.past, state.workspace.projects[0].files[0]];
const uniqueNodes = new Set(
  files.flatMap((file) => file.document.pages.flatMap((page) => page.nodes))
).size;
const beforeNavigation = state.workspace.projects[0].files[0].document;
for (let page = 0; page < 100; page++)
  actions.openFile('project', 'file', `page-${page}`);
const current = state.workspace.projects[0].files[0];
global.gc?.();
console.log(JSON.stringify({
  pages: current.document.pages.length,
  layers: current.document.pages.reduce((sum, page) => sum + page.nodes.length, 0),
  imageBytes: 0,
  edits: 100,
  history: state.past.length,
  uniqueNodes,
  navigationPreservedDocument: beforeNavigation === current.document,
  finalX: current.document.pages[0].nodes[0].x,
  finalPage: current.pageId,
  heapUsedBytes: process.memoryUsage().heapUsed,
  forcedGc: typeof global.gc === 'function',
}));
