import { useEffect, useState } from 'react';
import { useEditor } from '../editor/store';
import { locationSchema, type Location } from './model';

function destinationUrl(location: Location) {
  const url = new URL(window.location.href);
  url.searchParams.set('project', location.projectId);
  url.searchParams.set('file', location.fileId);
  url.searchParams.set('page', location.pageId);
  return url;
}

/** Resolve links only after local workspace hydration; history never contains artwork. */
export function useDestination() {
  const [error, setError] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let followingHistory = false;
    function followUrl() {
      const url = new URL(window.location.href);
      const keys = ['project', 'file', 'page'];
      if (!keys.some((key) => url.searchParams.has(key))) {
        history.replaceState(
          null,
          '',
          destinationUrl(useEditor.getState().location)
        );
        setError(null);
        return;
      }
      const parsed = locationSchema.safeParse({
        projectId: url.searchParams.get('project'),
        fileId: url.searchParams.get('file'),
        pageId: url.searchParams.get('page'),
      });
      if (
        !parsed.success ||
        keys.some((key) => url.searchParams.getAll(key).length !== 1)
      ) {
        setError(
          'This link has an invalid or incomplete project, file, or page reference.'
        );
        return;
      }
      followingHistory = true;
      try {
        const { projectId, fileId, pageId } = parsed.data;
        const state = useEditor.getState();
        if (
          state.location.projectId !== projectId ||
          state.location.fileId !== fileId ||
          state.location.pageId !== pageId
        ) state.openFile(projectId, fileId, pageId);
        setError(null);
      } catch {
        setError(
          'This destination is unavailable in this browser workspace. It may have been deleted or belong to another browser or app origin.'
        );
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
      history.pushState(null, '', destinationUrl(state.location));
      setError(null);
    });
    window.addEventListener('popstate', followUrl);
    return () => {
      unsubscribe();
      window.removeEventListener('popstate', followUrl);
    };
  }, []);
  function recover() {
    history.pushState(null, '', destinationUrl(useEditor.getState().location));
    setError(null);
  }
  return { error, recover };
}
