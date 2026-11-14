import { z } from 'zod';
import { useEditor } from './store';
import { agentActivity } from '../mcp/activity';
import { hasReviewDrafts } from '../review/drafts';

const manifestSchema = z.object({
  profile: z.literal('main'),
  release: z.string().regex(/^[a-f0-9]{40}$/),
});
const POLL_MS = 30_000;
const IDLE_MS = 5_000;

/** Detect main rollouts without discarding pending saves, UI drafts, or agent calls. */
export function watchMainRelease() {
  const profile = document.querySelector<HTMLMetaElement>(
    'meta[name="cavas-profile"]'
  )?.content;
  const release = document.querySelector<HTMLMetaElement>(
    'meta[name="cavas-release"]'
  )?.content;
  const initial = manifestSchema.safeParse({ profile, release });
  if (!initial.success) return () => {};
  const currentRelease = initial.data.release;
  let stopped = false;
  let checking = false;
  let pendingRelease: string | null = null;
  let lastActivity = Date.now();
  let lastVerified = 0;
  let lastAttempt = 0;
  let request: AbortController | undefined;
  const unsubscribe = useEditor.subscribe((state, previous) => {
    if (
      state.workspace !== previous.workspace ||
      state.location !== previous.location ||
      state.selectedIds !== previous.selectedIds ||
      state.interactionActive !== previous.interactionActive ||
      state.saveState !== previous.saveState
    )
      lastActivity = Date.now();
  });
  function reloadWhenSafe() {
    if (stopped || !pendingRelease) return;
    const state = useEditor.getState();
    const focus = document.activeElement;
    const editing =
      focus instanceof Element &&
      focus.closest('input,textarea,select,[contenteditable="true"]');
    if (
      !state.ready ||
      state.saveState !== 'saved' ||
      state.persistenceBlocked ||
      state.interactionActive || hasReviewDrafts() ||
      agentActivity.active ||
      editing ||
      document.querySelector('dialog[open]') ||
      Date.now() - Math.max(lastActivity, agentActivity.lastUsed) < IDLE_MS
    )
      return;
    if (Date.now() - lastVerified > 3000) {
      if (Date.now() - lastAttempt > 5000) void check();
      return;
    }
    stopped = true;
    location.reload();
  }
  async function check() {
    if (stopped || checking) return;
    checking = true;
    lastAttempt = Date.now();
    lastVerified = 0;
    request = new AbortController();
    const timeout = setTimeout(() => request?.abort(), 5000);
    try {
      const response = await fetch('/runtime.json', {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: request.signal,
      });
      if (!response.ok) return;
      const parsed = manifestSchema.safeParse(await response.json());
      if (stopped || !parsed.success) {
        pendingRelease = null;
        return;
      }
      lastVerified = Date.now();
      if (parsed.data.release === currentRelease) {
        pendingRelease = null;
        return;
      }
      if (pendingRelease !== parsed.data.release) {
        pendingRelease = parsed.data.release;
        useEditor
          .getState()
          .notify(
            'Update ready. It will load automatically when saved work is idle.'
          );
      }
      reloadWhenSafe();
    } catch {
      /* A restart or offline server is not a reason to discard local work. */
    } finally {
      clearTimeout(timeout);
      checking = false;
    }
  }
  const poll = setInterval(() => {
    void check();
  }, POLL_MS);
  const idle = setInterval(reloadWhenSafe, 1000);
  const focus = () => {
    void check();
  };
  window.addEventListener('focus', focus);
  document.addEventListener('visibilitychange', focus);
  void check();
  return () => {
    stopped = true;
    request?.abort();
    unsubscribe();
    clearInterval(poll);
    clearInterval(idle);
    window.removeEventListener('focus', focus);
    document.removeEventListener('visibilitychange', focus);
  };
}
