import { useEditor } from '../editor/store';
import type { EditorStore } from '../editor/state';
import { currentFile, type Location, type Page } from '../workspace/model';
import { anchorPoint, type ReviewThread } from '../review/model';
import { reviewTools } from './review-tools';

export function createReviewHandlers(useEditor: Pick<EditorStore, 'getState'>) {
function pageAt(location: Location) {
  const file = currentFile(useEditor.getState().workspace, location);
  const page = file.document.pages.find((page) => page.id === location.pageId);
  if (!page) throw new Error('Page does not exist in this file.');
  return page;
}
function threadResult(thread: ReviewThread, page: Page) {
  return {
    ...thread,
    anchorStatus: anchorPoint(thread.anchor, page.nodes) ? 'available' : 'missing-layer',
    position: anchorPoint(thread.anchor, page.nodes),
  };
}
const reviewHandlers: Record<string, (value: unknown) => unknown> = {
  list_comment_threads(value) {
    const args = reviewTools.list_comment_threads.schema.parse(value);
    const page = pageAt(args);
    return {
      projectId: args.projectId, fileId: args.fileId, pageId: args.pageId,
      threads: page.threads.filter((thread) => !args.status || thread.status === args.status)
        .map((thread) => ({
          id: thread.id, anchor: thread.anchor, status: thread.status,
          commentCount: thread.comments.length,
          anchorStatus: anchorPoint(thread.anchor, page.nodes) ? 'available' : 'missing-layer',
        })),
    };
  },
  get_comment_thread(value) {
    const args = reviewTools.get_comment_thread.schema.parse(value);
    const page = pageAt(args);
    const thread = page.threads.find((thread) => thread.id === args.threadId);
    if (!thread) throw new Error('Thread does not exist on this page.');
    return { projectId: args.projectId, fileId: args.fileId, pageId: args.pageId, thread: threadResult(thread, page) };
  },
  set_comment_thread_status(value) {
    const args = reviewTools.set_comment_thread_status.schema.parse(value);
    useEditor.getState().setThreadStatus(args.context, args.threadId, args.status);
    const page = pageAt(args.context);
    const thread = page.threads.find((thread) => thread.id === args.threadId);
    if (!thread) throw new Error('Thread does not exist on this page.');
    return { ...args.context, thread: threadResult(thread, page) };
  },
};

return reviewHandlers;
}
export const reviewHandlers = createReviewHandlers(useEditor);
