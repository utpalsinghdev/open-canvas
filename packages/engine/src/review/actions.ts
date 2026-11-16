import { newId } from '@open-cavas/document/model';
import { currentFile, type Location, type Page } from '@open-cavas/document/workspace';
import type { WorkspaceState } from '../workspace/state';
import type { createWorkspaceActions } from '../workspace/actions';
import {
  anchorSchema, newComment, threadStatusSchema,
  type ReviewAnchor, type ReviewThread,
} from '@open-cavas/document/review';

import { requireAnchor } from './anchors';

type ReviewState = WorkspaceState & Pick<ReturnType<typeof createWorkspaceActions>, 'commitFile'>;

export function createReviewActions(get: () => ReviewState) {
  function updatePage(location: Location, update: (page: Page) => Page) {
    const state = get();
    const file = currentFile(state.workspace, location);
    const page = file.document.pages.find((page) => page.id === location.pageId);
    if (!page) throw new Error('Page does not exist in this file.');
    const next = update(page);
    if (next === page) return;
    state.commitFile(location.projectId, {
      ...file,
      document: {
        ...file.document,
        pages: file.document.pages.map((item) => item.id === page.id ? next : item),
      },
    });
  }
  function updateThread(location: Location, threadId: string, update: (thread: ReviewThread, page: Page) => ReviewThread) {
    updatePage(location, (page) => {
      const thread = page.threads.find((thread) => thread.id === threadId);
      if (!thread) throw new Error('Thread does not exist on this page.');
      const next = update(thread, page);
      return next === thread ? page : {
        ...page, threads: page.threads.map((item) => item.id === threadId ? next : item),
      };
    });
  }
  return {
    createThread(location: Location, anchor: ReviewAnchor, body: string) {
      const validAnchor = anchorSchema.parse(anchor);
      const thread: ReviewThread = { id: newId(), anchor: validAnchor, status: 'open', comments: [newComment(body)] };
      updatePage(location, (page) => {
        requireAnchor(validAnchor, page.nodes);
        return { ...page, threads: [...page.threads, thread] };
      });
      return thread.id;
    },
    replyToThread(location: Location, threadId: string, body: string) {
      const comment = newComment(body);
      updateThread(location, threadId, (thread, page) => {
        requireAnchor(thread.anchor, page.nodes);
        if (thread.status === 'resolved') throw new Error('Reopen this thread before replying.');
        return { ...thread, comments: [...thread.comments, comment] };
      });
    },
    setThreadStatus(location: Location, threadId: string, status: ReviewThread['status']) {
      const validStatus = threadStatusSchema.parse(status);
      updateThread(location, threadId, (thread, page) => {
        requireAnchor(thread.anchor, page.nodes);
        return thread.status === validStatus ? thread : { ...thread, status: validStatus };
      });
    },
  };
}
