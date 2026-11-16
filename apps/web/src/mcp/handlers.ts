import { useEditor } from '../editor/store';
import { createMutations } from '@open-cavas/mcp/mutations';
import { createReads } from '@open-cavas/mcp/reads';
import { createWorkspaceHandlers } from '@open-cavas/mcp/workspace-commands';
import { createReviewHandlers } from '@open-cavas/mcp/review-commands';
import { parseBrowserHtml } from './html-parser';
import { browserRendering } from './rendering';

export const mutations = createMutations(useEditor, parseBrowserHtml);
export const reads = createReads(useEditor, browserRendering);
export const workspaceHandlers = createWorkspaceHandlers(useEditor);
export const reviewHandlers = createReviewHandlers(useEditor);
