/**
 * POSIX permission bits describe access for group and others. Windows reports
 * fixed bits that cannot express ACLs, so there private state relies on the
 * per-user profile directory that holds it.
 */
export const exposedToOthers = (mode: number) => process.platform !== 'win32' && (mode & 0o077) !== 0;
