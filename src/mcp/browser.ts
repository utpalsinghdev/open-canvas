import { useEditor } from '../editor/store';
import { newId } from '../editor/model';
import {
  browserRequestSchema,
  mutationTargetSchema,
  targetSchema,
  tools,
} from './tools';
import { mutations } from './mutations';
import { reads } from './reads';
import { workspaceHandlers } from './workspace-commands';
import { reviewHandlers } from './review-commands';
import { automaticConnection, type ConnectionStatus } from './connection';
import { agentActivity } from './activity';
import { hasReviewDrafts } from '../review/drafts';

const MAX_BYTES = 12_000_000;
const canvasId = newId();
let revision = 0;
useEditor.subscribe((state, previous) => {
  if (
    state.workspace !== previous.workspace ||
    state.location !== previous.location ||
    state.selectedIds !== previous.selectedIds
  )
    revision++;
});
export function connectBrowser(onStatus: (status: ConnectionStatus) => void) {
  return automaticConnection(onStatus, attachBrowser);
}
function attachBrowser(socket: WebSocket) {
  let connected = false;
  const send = (message: unknown) => {
    if (socket.readyState !== WebSocket.OPEN) return;
    const encoded = JSON.stringify(message);
    if (new TextEncoder().encode(encoded).length > MAX_BYTES)
      throw new Error(
        'Response exceeds 12 MB transport limit. Export a smaller artboard or use the browser download.'
      );
    socket.send(encoded);
  };
  const unsubscribe = useEditor.subscribe((state, previous) => {
    if (
      !connected ||
      (state.workspace === previous.workspace &&
        state.location === previous.location &&
        state.selectedIds === previous.selectedIds)
    )
      return;
    send({
      type: 'state',
      name: state.document.name,
      revision,
      context: state.location,
    });
  });
  socket.onopen = () => {
    connected = true;
    send({
      type: 'hello',
      canvasId,
      name: useEditor.getState().document.name,
      revision,
      context: useEditor.getState().location,
    });
  };
  socket.onmessage = (event: MessageEvent<unknown>) => {
    void (async () => {
      if (typeof event.data !== 'string') {
        socket.close(1008, 'Invalid response');
        return;
      }
      let value: unknown;
      try {
        value = JSON.parse(event.data);
      } catch {
        socket.close(1008, 'Invalid JSON');
        return;
      }
      const request = browserRequestSchema.safeParse(value);
      if (!request.success) {
        socket.close(1008, 'Invalid request');
        return;
      }
      const { id, method, args } = request.data;
      agentActivity.active++;
      try {
        const definition = Object.entries(tools).find(
          ([name]) => name === method
        )?.[1];
        if (!definition) throw new Error('Unsupported tool.');
        definition.schema.parse(args);
        if (targetSchema.parse(args).canvasId !== canvasId)
          throw new Error('Canvas target mismatch.');
        if (definition.mutation) {
          if (mutationTargetSchema.parse(args).expectedRevision !== revision)
            throw new Error(
              `Revision conflict. Current revision is ${revision}. Read state and decide whether to retry.`
            );
          const supplied = mutationTargetSchema.parse(args).context;
          const current = useEditor.getState().location;
          if (
            supplied &&
            (supplied.projectId !== current.projectId ||
              supplied.fileId !== current.fileId ||
              supplied.pageId !== current.pageId)
          )
            throw new Error(
              'Project/file/page context mismatch. Open the intended file/page, then read state again.'
            );
          const focused = document.activeElement;
          if (
            useEditor.getState().interactionActive || hasReviewDrafts() ||
            (focused instanceof Element &&
              focused.closest(
                '.properties-fields input,.properties-fields textarea,.selected-heading input,.document-name,.projects-dialog input,.page-name-form input,.review-panel textarea'
              ))
          )
            throw new Error(
              'Editor busy with a manual edit. Finish or cancel that edit, then read state before retrying.'
            );
        }
        const handler =
          reviewHandlers[method] ?? workspaceHandlers[method] ??
          (definition.mutation ? mutations[method] : reads[method]);
        if (!handler) throw new Error('Tool implementation unavailable.');
        const outcome = handler(args);
        const resultRevision = revision;
        const resultContext = useEditor.getState().location;
        const result = await outcome;
        send({
          type: 'result',
          id,
          ok: true,
          data: {
            revision: resultRevision,
            context: resultContext,
            result,
            persistence: useEditor.getState().saveState,
          },
        });
        if (definition.mutation)
          useEditor.getState().notify('Agent updated canvas.');
      } catch (error) {
        send({
          type: 'result',
          id,
          ok: false,
          error: (error instanceof Error
            ? error.message
            : 'Tool failed.'
          ).slice(0, 2000),
        });
      } finally {
        agentActivity.active--;
        agentActivity.lastUsed = Date.now();
      }
    })().catch(() => {
      socket.close(1011, 'Response failed');
    });
  };
  return () => {
    unsubscribe();
    socket.onopen = null;
    socket.onmessage = null;
  };
}
