import { locationSchema, type Location, type Workspace } from './model';

const destinationKeys = ['project', 'file', 'page'];
const filePageSchema = locationSchema.pick({ fileId: true, pageId: true });
type Destination =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' }
  | { kind: 'destination'; location: Location };

// Encode generated 128-bit IDs without changing stored IDs or introducing aliases.
function compactId(id: string) {
  if (!/^[0-9a-f]{32}$/.test(id)) return id;
  const bytes = id.match(/../g);
  if (!bytes) return id;
  return '~' + btoa(String.fromCharCode(...bytes.map((byte) => parseInt(byte, 16))))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function expandId(token: string) {
  if (!token.startsWith('~')) return token;
  if (!/^~[A-Za-z0-9_-]{22}$/.test(token)) return '';
  const id = Array.from(atob(token.slice(1).replaceAll('-', '+').replaceAll('_', '/') + '=='),
    (byte) => byte.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  return compactId(id) === token ? id : '';
}

/** File IDs are workspace-wide unique; page IDs are scoped to their file. */
export function readDestination(url: URL, workspace: Workspace, serviceId?: string): Destination {
  const serviceIds = url.searchParams.getAll('workspace');
  if (serviceIds.length > 1) return { kind: 'invalid' };
  if (serviceIds.length && serviceIds[0] !== serviceId) return { kind: 'unavailable' };
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
  const match = /^\/(file|f)\/([^/]+)\/([^/]+)\/?$/.exec(url.pathname);
  if (!match) return { kind: 'invalid' };
  const parsed = filePageSchema.safeParse({
    fileId: match[1] === 'f' ? expandId(match[2]) : match[2],
    pageId: match[1] === 'f' ? expandId(match[3]) : match[3],
  });
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

/** Home retains explicit workspace identity, never a file/page destination. */
export function homeUrl(url: URL, serviceId?: string) {
  const next = new URL(url);
  next.pathname = '/';
  for (const key of destinationKeys) next.searchParams.delete(key);
  if (serviceId) next.searchParams.set('workspace', serviceId);
  return next;
}

export function destinationUrl(url: URL, location: Location, serviceId?: string) {
  const next = new URL(url);
  next.pathname = `/f/${compactId(location.fileId)}/${compactId(location.pageId)}`;
  for (const key of destinationKeys) next.searchParams.delete(key);
  if (serviceId) next.searchParams.set('workspace', serviceId);
  return next;
}
