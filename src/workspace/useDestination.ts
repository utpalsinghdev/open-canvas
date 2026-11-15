import { useEffect, useState } from 'react';
import { useWorkspaceService } from './persistence';
import { useEditor } from '../editor/store';
import { destinationUrl, homeUrl, readDestination } from './destination';

type View =
  | { kind: 'loading' }
  | { kind: 'home' }
  | { kind: 'editor' }
  | { kind: 'error'; message: string };

const unavailableMessage =
  'This destination is unavailable in this browser workspace. It may have been deleted or belong to another browser or app origin.';

/** Commit blur-based editor drafts while their original file/node is still active. */
function finishFocusedEdit() {
  const focused = document.activeElement;
  if (focused instanceof HTMLElement && focused.matches('input,textarea,select,[contenteditable="true"]')) focused.blur();
}

/** Resolve links after workspace hydration. Home never changes the active document. */
export function useDestination() {
  const [view, setView] = useState<View>({ kind: 'loading' });
  useEffect(() => {
    let followingHistory = false;
    function followUrl() {
      finishFocusedEdit();
      const url = new URL(window.location.href);
      const serviceId = useWorkspaceService.getState().record?.id;
      const destination = readDestination(url, useEditor.getState().workspace, serviceId);
      if (destination.kind === 'empty') {
        history.replaceState(null, '', homeUrl(url, serviceId));
        setView({ kind: 'home' });
        return;
      }
      if (destination.kind === 'invalid') {
        setView({ kind: 'error', message: 'This link has an invalid or incomplete project, file, or page reference.' });
        return;
      }
      if (destination.kind === 'unavailable') {
        setView({ kind: 'error', message: unavailableMessage });
        return;
      }
      followingHistory = true;
      try {
        const { projectId, fileId, pageId } = destination.location;
        const state = useEditor.getState();
        if (
          state.location.projectId !== projectId ||
          state.location.fileId !== fileId ||
          state.location.pageId !== pageId
        ) state.openFile(projectId, fileId, pageId);
        history.replaceState(null, '', destinationUrl(url, destination.location, serviceId));
        setView({ kind: 'editor' });
      } catch {
        setView({ kind: 'error', message: unavailableMessage });
      } finally {
        followingHistory = false;
      }
    }
    followUrl();
    const unsubscribe = useEditor.subscribe((state, previous) => {
      if (
        followingHistory ||
        // Library actions on Home can update active file metadata without opening an editor.
        readDestination(new URL(window.location.href), state.workspace, useWorkspaceService.getState().record?.id).kind === 'empty' ||
        (state.location.projectId === previous.location.projectId &&
          state.location.fileId === previous.location.fileId &&
          state.location.pageId === previous.location.pageId)
      ) return;
      history.pushState(null, '', destinationUrl(new URL(window.location.href), state.location, useWorkspaceService.getState().record?.id));
      setView({ kind: 'editor' });
    });
    window.addEventListener('popstate', followUrl);
    return () => {
      unsubscribe();
      window.removeEventListener('popstate', followUrl);
    };
  }, []);

  function openHome() {
    finishFocusedEdit();
    const url = homeUrl(new URL(window.location.href), useWorkspaceService.getState().record?.id);
    if (url.href !== window.location.href) history.pushState(null, '', url);
    setView({ kind: 'home' });
  }
  function openEditor() {
    const url = destinationUrl(new URL(window.location.href), useEditor.getState().location, useWorkspaceService.getState().record?.id);
    if (url.href !== window.location.href) history.pushState(null, '', url);
    setView({ kind: 'editor' });
  }
  return { view, openHome, openEditor };
}
