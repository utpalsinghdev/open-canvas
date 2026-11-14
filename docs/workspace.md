# Projects, files, and pages

## Hierarchy

A workspace contains projects. Each project contains files. Each file contains pages, and each page contains artboards and layers. File-wide design tokens are shared across its pages. Projects and files are independent; copying a file does not create linked artwork or shared history.

Open Projects from the project-name button in the header. It supports project creation/rename/deletion, file search/open/create/rename/duplicate/deletion, and backups. Duplicate names are allowed; IDs distinguish items. New projects begin with one Untitled file and Page 1. New files begin with one empty Page 1.

Pages above Layers support creation, switching, rename, duplicate, and delete. Switching file/page clears selection, discards transient pointer state, resets drawing to Select, and fits the page. The file remembers its most recently opened page. Camera and selection are not persisted per page.

## History and deletion

History is capped at 80 immutable file snapshots per file and lasts only for the current tab session. It includes all pages and file tokens. Snapshots share unchanged validated pages, tokens, and layers rather than retaining fresh copies of the entire file. File/page navigation preserves unchanged artwork references. Full schema validation still runs before publishing content or library changes; sharing does not bypass import validation or change the history limit. Navigation checks that its target file and page exist, then updates only the active-page ID without reparsing unchanged artwork. Switch between files without losing their individual histories. Undo/redo can restore page creation, rename, deletion, and content edits. Restoring a snapshot restores its active page too.

Project/file creation, duplication, and import add library entries, not undo steps. Project/file deletion is permanent, removes their histories, and requires confirmation in the UI. MCP deletion calls are explicit destructive operations without a separate UI confirmation. Download backups first. At least one project, one file per project, and one page per file must remain.

## Persistence, migration, and concurrent editing

The local workspace service is authoritative for explicitly selected service workspaces. Browser IndexedDB is now a read-only source for explicit migration, not the live save destination. The chooser copies existing data into a new service workspace without changing its project/file/page IDs; original browser data stays untouched. JSON import still appends items with regenerated project/file IDs.

Service saves use a single-owner queue, durable revisions, and atomic fsynced snapshots. Stale browser or MCP saves fail rather than overwriting another writer. Idle browsers poll for changes while keeping displayed page independent of agent context. Pending edits and drafts block refresh. Incoming changes clear browser undo history; browser saves clear backend session history. Failed browser saves block further saves and show persistent recovery guidance and bounded error details, independent of routine notifications. Download a workspace backup before reloading.

See [local workspaces](local-workspaces.md) for exact storage location, workspace targeting, access controls, migration, shutdown, conflict recovery, and limits. It supersedes the former browser-only persistence contract.

## Backups and limits

File backup is a version-2 file containing all pages/tokens. Project backup includes all files in a project. Workspace backup includes every project. Import appends files/projects and regenerates project/file IDs, preserving existing work. Legacy version-1 documents are accepted as new one-page files. All import formats validate before mutation.

- 50 projects; 50 files per project; 200 files across the workspace.
- 100 pages per file; 1,000 layers per page; 10,000 layers per file.
- 200 tokens per file; 80 undo snapshots per file in memory.
- UI JSON imports up to 40 MB; MCP transport remains 12 MB; newly added raster images up to 2 MB each.

The complete workspace is currently saved as one record. Large image-heavy workspaces and file histories consume memory; this is not a cloud asset library or a large-document database. SVG/HTML/JSX/PNG output applies to the current page, while JSON file output includes every page.

## MCP context

An automatically connected browser identifies the active project, file, and page in every response and `list_canvases`. Page/content mutations require this `context` together with the current revision. Library tools accept explicit project/file/page target IDs. Opening a different file invalidates old page context even when copied layer IDs match.

The current MCP server has 50 tools. Use durable `workspaceId` targets for data operations without a browser; browser `canvasId` remains a separate rendering target. See [mcp.md](mcp.md) for exact lifecycle tools and reconnect instructions. Global registration and cross-session tool visibility still use the agent's normal configuration/reload. Shared-broker lifecycle and its legacy-owner restart requirement are documented separately in mcp-multi-session.md.

## Review feedback

Pages contain posted review threads in addition to layers. File/project/workspace backups preserve them. Page duplication remaps layer/thread/comment IDs; page deletion removes its threads with undo restoration. Deleted-layer feedback remains readable as a missing anchor. Unposted drafts are session-only and survive page/file navigation. See [review-threads.md](review-threads.md) for controls, limits, and MCP context requirements.

## Direct links

The address bar uses `/f/<fileToken>/<pageToken>`. Generated 32-character
hexadecimal IDs use lossless base64url tokens, each prefixed with `~` (23
characters). The path is 50 characters instead of 71. Stored IDs never change;
there is no prefix matching, collision-prone truncation, alias database, or
network lookup. Other valid workspace IDs remain literal tokens. Renames do not
affect tokens. File IDs remain unique across the workspace.

Existing `/file/<fileId>/<pageId>` links remain supported and canonicalize to
this compact format. Noncanonical or malformed encoded tokens are rejected.

Copy the complete URL to bookmark a file/page. Renaming a project, file, or page
does not change the destination. Opening a link waits for local storage to load,
then selects that exact page. A bare app URL uses the last saved location and
replaces its history entry with a complete link. File/page changes add history
entries; Back and Forward select existing destinations without adding another
entry. Refresh preserves the referenced destination. A trailing slash is accepted
and removed from valid destination paths.

Existing `/?project=<projectId>&file=<fileId>&page=<pageId>` bookmarks still open
the exact destination, including validation of the project ID. Successful opens
replace the current history entry with the shorter path. Invalid or unavailable
links remain unchanged until explicit recovery. Paths with incomplete or extra
segments, unknown routes, and links mixing path and query destination IDs are
invalid. Unrelated query parameters and fragments are preserved.

Invalid, incomplete, duplicate, missing, or deleted destination IDs show a persistent
unavailable screen rather than displaying a different file. **Open last workspace**
explicitly returns to the current local workspace, where Projects can select another
file or import a backup. Back/Forward can also leave this screen. The unavailable
screen does not mount editor keyboard shortcuts or the browser MCP connection.

Links identify data within the explicitly selected local service workspace, not shared contents. Another machine or runtime profile may not have that workspace; another browser must explicitly select it. Import regenerates project/file IDs,
so old links do not automatically refer to imported copies. Pending edits still need
to finish saving before refresh.

For agent references, decoded file and page tokens map to MCP context
`fileId` and `pageId`; the owning project supplies `projectId`. Legacy query
`project`, `file`, and `page` still map to those three context IDs. Links do not
encode `canvasId`: that ID identifies
a live browser session and changes after a reload. Discover the live canvas with
`list_canvases`, match its context, and use its explicit `canvasId`, context, and
current expected revision for applicable mutations. A URL grants no authorization
and does not bypass targeting, revision checks, or local browser availability.
