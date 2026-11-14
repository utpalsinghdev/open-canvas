# Projects, files, and pages

## Hierarchy

A workspace contains projects. Each project contains files. Each file contains pages, and each page contains artboards and layers. File-wide design tokens are shared across its pages. Projects and files are independent; copying a file does not create linked artwork or shared history.

Open Projects from the project-name button in the header. It supports project creation/rename/deletion, file search/open/create/rename/duplicate/deletion, and backups. Duplicate names are allowed; IDs distinguish items. New projects begin with one Untitled file and Page 1. New files begin with one empty Page 1.

Pages above Layers support creation, switching, rename, duplicate, and delete. Switching file/page clears selection, discards transient pointer state, resets drawing to Select, and fits the page. The file remembers its most recently opened page. Camera and selection are not persisted per page.

## History and deletion

History is capped at 80 immutable file snapshots per file and lasts only for the current tab session. It includes all pages and file tokens. Switch between files without losing their individual histories. Undo/redo can restore page creation, rename, deletion, and content edits. Restoring a snapshot restores its active page too.

Project/file creation, duplication, and import add library entries, not undo steps. Project/file deletion is permanent, removes their histories, and requires confirmation in the UI. MCP deletion calls are explicit destructive operations without a separate UI confirmation. Download backups first. At least one project, one file per project, and one page per file must remain.

## Persistence and migration

The workspace saves to IndexedDB database `open-cavas`, store `workspace`, key `current`. The record contains the workspace, current project/file/page location, and monotonically increasing disk revision. Debounced saves serialize through one queue and compare disk revision atomically in the write transaction.

When IndexedDB has no saved record, a valid `open-cavas.document.v1` local-storage document migrates into Personal → one named file → Page 1. Layers, IDs, geometry, images, and tokens survive conversion. The original local-storage value is preserved. Subsequent loads prefer IndexedDB and do not repeat migration.

Corrupt or unavailable saved data does not trigger automatic replacement. The editor exposes fallback work in memory, reports the problem, and blocks saving. Existing source data remains intact. A failed write displays Not saved; backups are required to preserve in-memory work. IndexedDB uses browser quota and is not guaranteed permanent storage.

Different browser profiles and origins, including different ports, have separate workspaces. To move data from an older running editor on another port, download its JSON and import it in the new editor. There is no silent cross-origin migration.

## Concurrent tabs

Tabs do not collaborate. If one saves after another tab loaded, a later stale-tab save aborts instead of overwriting. That tab displays a conflict and blocks further saves. Its unsaved state remains in memory for workspace backup. Download a backup and reload, then import needed work as new items. Manual merges are outside this increment.

Visibility/pagehide flushes request pending saves but cannot guarantee an asynchronous transaction finishes before the browser terminates. Wait for Saved locally and keep downloaded backups.

## Backups and limits

File backup is a version-2 file containing all pages/tokens. Project backup includes all files in a project. Workspace backup includes every project. Import appends files/projects and regenerates project/file IDs, preserving existing work. Legacy version-1 documents are accepted as new one-page files. All import formats validate before mutation.

- 50 projects; 50 files per project; 200 files across the workspace.
- 100 pages per file; 1,000 layers per page; 10,000 layers per file.
- 200 tokens per file; 80 undo snapshots per file in memory.
- UI JSON imports up to 40 MB; MCP transport remains 12 MB; newly added raster images up to 2 MB each.

The complete workspace is currently saved as one record. Large image-heavy workspaces and file histories consume memory; this is not a cloud asset library or a large-document database. SVG/HTML/JSX/PNG output applies to the current page, while JSON file output includes every page.

## MCP context

An automatically connected browser identifies the active project, file, and page in every response and `list_canvases`. Page/content mutations require this `context` together with the current revision. Library tools accept explicit project/file/page target IDs. Opening a different file invalidates old page context even when copied layer IDs match.

The current MCP server has 44 tools. See [mcp.md](mcp.md) for exact lifecycle tools and reconnect instructions. Global registration and cross-session tool visibility still use the agent's normal configuration/reload. Shared-broker lifecycle and its legacy-owner restart requirement are documented separately in mcp-multi-session.md.

## Direct links

The address bar uses `?project=<projectId>&file=<fileId>&page=<pageId>`.
Copy the complete URL to bookmark a file/page. These IDs come from the workspace
model, not display names, so renaming does not change the destination. Opening a
link waits for local storage to load, then selects that exact page. A bare app URL
uses the last saved location and replaces its history entry with a complete link.
File/page changes add history entries; Back and Forward select existing destinations
without adding another entry. Refresh preserves the referenced destination.

Invalid, incomplete, duplicate, missing, or deleted destination IDs show a persistent
unavailable screen rather than displaying a different file. **Open last workspace**
explicitly returns to the current local workspace, where Projects can select another
file or import a backup. Back/Forward can also leave this screen. The unavailable
screen does not mount editor keyboard shortcuts or the browser MCP connection.

Links identify local data, not shared contents. Another browser, machine, profile,
hostname, or port may not have that workspace. Import regenerates project/file IDs,
so old links do not automatically refer to imported copies. Pending edits still need
to finish saving before refresh.

For agent references, URL `project`, `file`, and `page` map directly to MCP context
`projectId`, `fileId`, and `pageId`. They do not encode `canvasId`: that ID identifies
a live browser session and changes after a reload. Discover the live canvas with
`list_canvases`, match its context, and use its explicit `canvasId`, context, and
current expected revision for applicable mutations. A URL grants no authorization
and does not bypass targeting, revision checks, or local browser availability.
