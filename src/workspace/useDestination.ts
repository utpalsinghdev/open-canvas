import { useEffect, useState } from 'react';
import { useWorkspaceService } from './persistence';
import { useEditor } from '../editor/store';
import { destinationUrl, readDestination } from './destination';

const unavailableMessage =
  'This destination is unavailable in this browser workspace. It may have been deleted or belong to another browser or app origin.';

/** Resolve links only after local workspace hydration; history never contains artwork. */
export function useDestination() {
  const [error, setError] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let followingHistory = false;
    function followUrl() {
      const url = new URL(window.location.href);
      const destination = readDestination(url, useEditor.getState().workspace, useWorkspaceService.getState().record?.id);
      if (destination.kind === 'empty') {
        history.replaceState(
          null,
          '',
          destinationUrl(url, useEditor.getState().location, useWorkspaceService.getState().record?.id)
        );
        setError(null);
        return;
      }
      if (destination.kind === 'invalid') {
        setError(
          'This link has an invalid or incomplete project, file, or page reference.'
        );
        return;
      }
      if (destination.kind === 'unavailable') {
        setError(unavailableMessage);
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
        history.replaceState(null, '', destinationUrl(url, destination.location, useWorkspaceService.getState().record?.id));
        setError(null);
      } catch {
        setError(unavailableMessage);
      } finally {
        followingHistory = false;
      }
    }
    followUrl();
    const unsubscribe = useEditor.subscribe((state, previous) => {
      if (
        followingHistory ||
        (state.location.projectId === previous.location.projectId &&
          state.location.fileId === previous.location.fileId &&
          state.location.pageId === previous.location.pageId)
      )
        return;
      history.pushState(
        null,
        '',
        destinationUrl(new URL(window.location.href), state.location, useWorkspaceService.getState().record?.id)
      );
      setError(null);
    });
    window.addEventListener('popstate', followUrl);
    return () => {
      unsubscribe();
      window.removeEventListener('popstate', followUrl);
    };
  }, []);
  function recover() {
    history.pushState(
      null,
      '',
      destinationUrl(new URL(window.location.href), useEditor.getState().location, useWorkspaceService.getState().record?.id)
    );
    setError(null);
  }
  return { error, recover };
}
