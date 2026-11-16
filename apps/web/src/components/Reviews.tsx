import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { useEditor } from '../editor/store';
import type { CameraControls } from '../editor/useCamera';
import { currentFile } from '@open-cavas/document/workspace';
import { type ReviewAnchor } from '@open-cavas/document/review';
import { anchorPoint } from '@open-cavas/engine/review/anchors';
import { usePageReview } from '../review/drafts';
import { IconButton } from './Button';
import { ReviewSurface } from './ReviewSurface';

export type ReviewControls = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

type Props = {
  controls: CameraControls;
  review: ReviewControls;
  draftAnchor: ReviewAnchor | null;
  setDraftAnchor: (anchor: ReviewAnchor | null) => void;
  placing: boolean;
  setPlacing: (placing: boolean) => void;
};

export function Reviews({ controls, review, draftAnchor, setDraftAnchor, placing, setPlacing }: Props) {
  const state = useEditor();
  const file = currentFile(state.workspace, state.location);
  const page = file.document.pages.find((page) => page.id === state.location.pageId);
  const { page: reviewPage, update, updateAt } = usePageReview(state.location);
  const threadId = reviewPage.threadId;
  const thread = page?.threads.find((thread) => thread.id === threadId);
  const bodyKey = thread ? `thread:${thread.id}` : 'draft';
  const body = Object.hasOwn(reviewPage.bodies, bodyKey) ? reviewPage.bodies[bodyKey] : '';
  const setBody = (body: string) => update({ bodies: { ...reviewPage.bodies, [bodyKey]: body } });
  const selectThread = (threadId: string | null) => update({ threadId });
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const selectedLayer = state.selectedIds.length === 1
    ? state.document.nodes.find((node) => node.id === state.selectedIds[0]) : undefined;
  const missing = thread && !anchorPoint(thread.anchor, state.document.nodes);
  const compact = Boolean(draftAnchor || thread);
  const composing = Boolean(draftAnchor && !thread);
  const activeAnchor = thread?.anchor ?? draftAnchor;
  const point = activeAnchor ? anchorPoint(activeAnchor, state.document.nodes) : null;
  function close() { setPlacing(false); review.setOpen(false); }
  const entries = file.document.pages.flatMap((page) => page.threads
    .filter((thread) => filter === 'all' || thread.status === filter)
    .map((thread) => ({ page, thread })));

  // Page navigation fits artwork first; a chosen review target takes final camera focus.
  useEffect(() => {
    if (!review.open || !thread) return;
    const point = anchorPoint(thread.anchor, state.document.nodes);
    if (!point) return;
    let secondFrame = 0;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        const viewport = controls.viewport.current;
        if (!viewport) return;
        const camera = controls.camera;
        const x = point.x * camera.zoom + camera.x;
        const y = point.y * camera.zoom + camera.y;
        if (x >= 32 && x <= viewport.clientWidth - 32 && y >= 32 && y <= viewport.clientHeight - 80) return;
        controls.setCamera((camera) => ({
          ...camera,
          x: (viewport.clientWidth <= 600 ? viewport.clientWidth / 2 : Math.max(40, (viewport.clientWidth - 344) / 2)) - point.x * camera.zoom,
          y: (viewport.clientWidth <= 600 ? viewport.clientHeight * 0.2 : viewport.clientHeight / 2) - point.y * camera.zoom,
        }));
      });
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(secondFrame); };
    // Geometry changes should move pins without continuously recentering the camera.
  }, [review.open, thread?.id, controls.setCamera, controls.viewport]);

  function run(action: () => void) {
    try { action(); }
    catch (error) { state.notify(error instanceof Error ? error.message : 'Review action failed.'); }
  }
  function choose(pageId: string, id: string) {
    setPlacing(false);
    updateAt({ ...state.location, pageId }, { threadId: id });
    review.setOpen(true);
    if (pageId !== state.location.pageId) state.openFile(state.location.projectId, file.id, pageId);
    const target = file.document.pages.find((page) => page.id === pageId)?.threads.find((thread) => thread.id === id);
    state.select(target?.anchor.kind === 'layer' && anchorPoint(target.anchor, file.document.pages.find((page) => page.id === pageId)?.nodes ?? []) ? [target.anchor.nodeId] : []);
  }
  function cancelDraft() {
    setBody('');
    setDraftAnchor(null);
    setPlacing(false);
    review.setOpen(false);
  }

  return <>
    <div className="review-pins" aria-label="Review anchors">
      {page?.threads.filter((thread) => thread.status === 'open').map((thread, index) => {
        const point = anchorPoint(thread.anchor, state.document.nodes);
        if (!point) return null;
        const x = point.x * controls.camera.zoom + controls.camera.x;
        const y = point.y * controls.camera.zoom + controls.camera.y;
        return <button key={thread.id} className={`review-pin ${threadId === thread.id ? 'selected' : ''}`}
          style={{ left: x, top: y }} aria-label={`Open review thread ${index + 1}: ${thread.comments[0].body.slice(0, 60)}`}
          onClick={() => choose(state.location.pageId, thread.id)}>{index + 1}</button>;
      })}
      {draftAnchor && (() => {
        const point = anchorPoint(draftAnchor, state.document.nodes);
        return point && <span className="review-pin draft" style={{ left: point.x * controls.camera.zoom + controls.camera.x, top: point.y * controls.camera.zoom + controls.camera.y }}><MapPin size={14} /></span>;
      })()}
    </div>
    {review.open && <ReviewSurface key={thread?.id ?? (draftAnchor ? 'draft' : 'list')} controls={controls} point={point} compact={compact} composing={composing} onClose={close}>
      {!composing && <div className="review-heading"><h2>{thread ? 'Comment' : 'Review threads'}</h2><IconButton label="Close comments" onClick={close}><X size={16} /></IconButton></div>}
      {!compact && <div className="review-create">
        <button className="text-button" disabled={!selectedLayer} onClick={() => { if (Object.values(reviewPage.bodies).some((body) => body.trim())) { state.notify('Post or cancel the existing draft before starting another comment.'); return; } selectThread(null); setDraftAnchor(selectedLayer ? { kind: 'layer', nodeId: selectedLayer.id } : null); setPlacing(false); }}>Comment on selection</button>
        <button className="text-button" aria-pressed={placing} onClick={() => { if (Object.values(reviewPage.bodies).some((body) => body.trim())) { state.notify('Post or cancel the existing draft before starting another comment.'); return; } selectThread(null); setDraftAnchor(null); setPlacing(true); review.setOpen(false); }}>Place pin</button>
      </div>}
      {placing && <p className="review-hint" role="status">Click a layer or canvas position. Escape cancels.</p>}
      {draftAnchor && !thread ? <form className="review-composer" onSubmit={(event) => {
        event.preventDefault();
        run(() => {
          const id = state.createThread(state.location, draftAnchor, body);
          update({ anchor: null, threadId: id, bodies: { ...reviewPage.bodies, draft: '' } });
          setPlacing(false);
        });
      }}>
        <label className="sr-only" id="new-comment-target" htmlFor="new-comment">{draftAnchor.kind === 'layer' ? `Comment on ${state.document.nodes.find((node) => node.id === draftAnchor.nodeId)?.name ?? 'missing layer'}` : 'Comment at canvas position'}</label>
        <textarea id="new-comment" aria-label="New comment" aria-describedby="new-comment-target" placeholder="Add a comment…" rows={3} maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} />
        <div className="review-actions"><button type="button" className="secondary-button" onClick={cancelDraft}>Cancel</button><button className="export-button" aria-label="Save comment" disabled={!body.trim()}>Save</button></div>
      </form> : thread ? <section className="review-thread" aria-label="Selected thread">
        <div className="review-heading"><strong>{thread.status === 'resolved' ? 'Resolved' : 'Open thread'}</strong><button className="text-button" onClick={() => { selectThread(null); }}>All threads</button></div>
        {missing ? <p className="review-warning" role="status">Missing layer. Feedback retained; restore the layer with undo to navigate or change status.</p> : <button className="text-button" onClick={() => {
          const point = anchorPoint(thread.anchor, state.document.nodes);
          const viewport = controls.viewport.current;
          if (point && viewport) controls.setCamera((camera) => ({ ...camera,
            x: viewport.clientWidth / 2 - point.x * camera.zoom,
            y: viewport.clientHeight / 3 - point.y * camera.zoom,
          }));
        }}>Go to anchor</button>}
        <ol className="review-messages">{thread.comments.map((comment) => <li key={comment.id}>
          <p>{comment.body}</p><time dateTime={new Date(comment.createdAt).toISOString()}>{new Date(comment.createdAt).toLocaleString()}</time>
        </li>)}</ol>
        <button className="text-button" disabled={Boolean(missing) || Boolean(body.trim())} onClick={() => run(() => state.setThreadStatus(state.location, thread.id, thread.status === 'open' ? 'resolved' : 'open'))}>{thread.status === 'open' ? 'Resolve thread' : 'Reopen thread'}</button>
        {thread.status === 'open' && !missing && <form className="review-composer" onSubmit={(event) => {
          event.preventDefault();
          run(() => { state.replyToThread(state.location, thread.id, body); setBody(''); });
        }}>
          <label htmlFor="review-reply">Reply</label><textarea id="review-reply" aria-label="Reply to thread" maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} />
          <div className="review-actions"><button className="export-button" disabled={!body.trim()}>Post reply</button><button type="button" className="text-button" onClick={() => setBody('')}>Cancel reply</button></div>
        </form>}
      </section> : <>
        <label className="review-filter">Show <select aria-label="Thread status filter" value={filter} onChange={(event) => {
          const value = event.target.value;
          if (value === 'all' || value === 'open' || value === 'resolved') setFilter(value);
        }}><option value="all">All threads</option><option value="open">Open</option><option value="resolved">Resolved</option></select></label>
        <div className="review-list">{entries.length ? entries.map(({ page, thread }) => <button key={thread.id} className="review-row" onClick={() => run(() => choose(page.id, thread.id))}>
          <span>{page.name} / {thread.status === 'resolved' ? 'Resolved' : 'Open'}{!anchorPoint(thread.anchor, page.nodes) ? ' / Missing layer' : ''}</span>
          <p>{thread.comments[0].body}</p><span>{thread.comments.length} {thread.comments.length === 1 ? 'comment' : 'comments'}</span>
        </button>) : <p className="review-hint">No {filter === 'all' ? '' : `${filter} `}threads in this file. Select a layer or place a pin to leave feedback.</p>}</div>
      </>}
    </ReviewSurface>}
  </>;
}
