import { create } from 'zustand';
import type { Location, Page, Workspace } from '../workspace/model';
import type { ReviewAnchor } from './model';

type PageReview = {
  anchor: ReviewAnchor | null;
  threadId: string | null;
  bodies: Record<string, string>;
};
const emptyPage: PageReview = { anchor: null, threadId: null, bodies: {} };
const keyFor = (location: Location) => `${location.fileId}:${location.pageId}`;

/** Session-only drafts survive page/file navigation, but never enter file backups. */
const useReviewDrafts = create<{
  pages: Record<string, PageReview>;
  update: (location: Location, patch: Partial<PageReview>) => void;
}>((set) => ({
  pages: {},
  update: (location, patch) => set((state) => {
    const key = keyFor(location);
    const previous = Object.hasOwn(state.pages, key) ? state.pages[key] : emptyPage;
    return { pages: { ...state.pages, [key]: { ...previous, ...patch } } };
  }),
}));

export function usePageReview(location: Location) {
  const state = useReviewDrafts();
  const key = keyFor(location);
  const page = Object.hasOwn(state.pages, key) ? state.pages[key] : emptyPage;
  return { page, update: (patch: Partial<PageReview>) => state.update(location, patch), updateAt: state.update };
}

export function pruneReviewDrafts(workspace: Workspace) {
  const existing = new Map<string, Page>(workspace.projects.flatMap((project) => project.files.flatMap((file) =>
    file.document.pages.map((page) => [`${file.id}:${page.id}`, page] as const))));
  const pages = Object.fromEntries(Object.entries(useReviewDrafts.getState().pages).flatMap(([key, review]) => {
    const page = existing.get(key);
    if (!page) return [];
    const threads = new Set(page.threads.map((thread) => thread.id));
    return [[key, {
      ...review,
      threadId: review.threadId && threads.has(review.threadId) ? review.threadId : null,
      bodies: Object.fromEntries(Object.entries(review.bodies).filter(([key]) => key === 'draft' || threads.has(key.slice('thread:'.length)))),
    }]];
  }));
  useReviewDrafts.setState({ pages });
}

export function hasReviewDrafts() {
  return Object.values(useReviewDrafts.getState().pages)
    .some((page) => Object.values(page.bodies).some((body) => body.trim().length > 0));
}
