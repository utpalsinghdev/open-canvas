import { locationSchema, type Location, type Workspace } from './model';

const destinationKeys = ['project', 'file', 'page'];
const filePageSchema = locationSchema.pick({ fileId: true, pageId: true });
type Destination =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' }
  | { kind: 'destination'; location: Location };

/** File IDs are workspace-wide unique; page IDs are scoped to their file. */
export function readDestination(url: URL, workspace: Workspace): Destination {
  const hasQueryDestination = destinationKeys.some((key) =>
    url.searchParams.has(key)
  );
  if (url.pathname === '/') {
    if (!hasQueryDestination) return { kind: 'empty' };
    const parsed = locationSchema.safeParse({
      projectId: url.searchParams.get('project'),
      fileId: url.searchParams.get('file'),
      pageId: url.searchParams.get('page'),
    });
    if (
      !parsed.success ||
      destinationKeys.some((key) => url.searchParams.getAll(key).length !== 1)
    ) return { kind: 'invalid' };
    return { kind: 'destination', location: parsed.data };
  }

  // Never silently choose between path and query destinations.
  if (hasQueryDestination) return { kind: 'invalid' };
  const match = /^\/file\/([^/]+)\/([^/]+)\/?$/.exec(url.pathname);
  if (!match) return { kind: 'invalid' };
  const parsed = filePageSchema.safeParse({ fileId: match[1], pageId: match[2] });
  if (!parsed.success) return { kind: 'invalid' };
  const project = workspace.projects.find((project) =>
    project.files.some((file) => file.id === parsed.data.fileId)
  );
  if (!project) return { kind: 'unavailable' };
  return {
    kind: 'destination',
    location: { projectId: project.id, ...parsed.data },
  };
}

export function destinationUrl(url: URL, location: Location) {
  const next = new URL(url);
  next.pathname = `/file/${location.fileId}/${location.pageId}`;
  for (const key of destinationKeys) next.searchParams.delete(key);
  return next;
}
