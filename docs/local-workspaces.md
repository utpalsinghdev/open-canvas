# Browser-independent local workspaces

All workspace-target MCP operations execute directly in the local workspace service, including restricted HTML import, visual exports and PNG artwork capture. A browser tab is not required. No cloud service, account, arbitrary filesystem tool, or hosted HTTP MCP endpoint is added.

## Start and select

`npm run dev` starts the development frontend and its private workspace broker. Use the assigned `CAVAS_APP_PORT` and `CAVAS_MCP_PORT` for additional worktrees. `npm start` starts the selected main release and its broker at the coordinated release boundary. Neither command publishes a release.

A standalone MCP stdio client can also own the broker without starting a frontend. Other clients attach through authenticated private metadata. If an existing MCP client owns the broker when the frontend starts, the frontend attaches rather than stealing ownership. Before dispatch, attached clients verify the authenticated owner identity. If it disappears, they may acquire the exclusive listener and reclaim metadata only for a dead owner, or attach to an authenticated replacement. Simultaneous starters wait up to five seconds for absent private metadata to be published; invalid metadata and unverified listeners still fail closed. The frontend checks ownership every two seconds and restarts its own failed service child with capped backoff. Live owners, invalid metadata and unverified listeners are never replaced. No design request is replayed; recovery is not a release upgrade.

Start MCP with `get_capabilities` and `list_workspaces`. Use `create_workspace` to create a blank workspace without a browser. Each workspace has a durable opaque ID, name, access status, revision, and agent context. Pass exactly one `workspaceId` or browser `canvasId` to existing tools. An unavailable ID fails; no other workspace is substituted.

For page edits, pass the explicit project/file/page `context` and current `expectedRevision`. Reads also accept an explicit context. `open_file` changes the agent context, not the user's browser page. Creation may change the agent context; inspect the returned context before the next edit.

## Existing browser data

On first load, choose a local service workspace, create an empty one, or explicitly **Copy browser workspace** into a new service workspace. Copy preserves project/file/page/layer IDs and validates the whole workspace. The original IndexedDB and legacy local-storage data stay untouched as recovery copies. Nothing merges automatically across origins or profiles. Download a browser backup before copying valuable work.

The selected service workspace ID is remembered in this browser origin's local storage. Other profiles choose explicitly. An uncertain create is not replayed: reload, refresh the workspace list, and inspect the remembered destination. Importing JSON from Projects retains its previous append-and-regenerate-ID behavior; it is not the identity-preserving copy operation.

If browser storage cannot be read safely, copying is disabled. Existing service workspaces and blank creation remain available. Corrupt service records prevent startup rather than silently replacing data.

## Persistence and concurrency

Service records live under the profile's private state directory in `workspaces/<workspaceId>.json`, separate from broker credentials. Directories are mode 0700; records are mode 0600. The Vite `.cavas` filesystem denial still applies. Main state remains outside frozen release directories, so preparing a release does not move documents.

One broker owns a serialization queue for all workspaces. Every save compares the durable revision before publication. Complete validated JSON snapshots are written to a private temporary file, fsynced, atomically published, and followed by a directory fsync. New IDs publish exclusively. Workspace-target mutations report `persistence: saved` only after this path completes. An uncertain post-publication error quarantines the service; coordinate recovery instead of replaying writes. Graceful shutdown rejects new workspace requests and drains accepted publication before releasing ownership. This does not promise recovery from disk corruption or power loss on every filesystem. Keep JSON backups.

Browser edits remain immediate in memory and save after a 350 ms debounce. Idle browsers poll every two seconds for revisions and preserve their displayed location and selection where possible. Focused inputs, review drafts, pointer edits, pending saves, and failed saves prevent incoming refreshes. If another writer wins, the stale save is rejected, unsaved browser state stays in memory, and further saves stop. Download a workspace backup, then reload and import needed work as new items. No automatic merging occurs.

Incoming changes clear browser undo history so undo cannot restore an obsolete remote snapshot. Browser saves clear backend session history. Backend undo/redo lasts for the broker process and is not persisted. Selection and agent context are separate from browser selection and navigation. Deleting the displayed page/file necessarily moves an idle browser to a remaining page with a message. Manual navigation currently also saves remembered file-page metadata and can conflict with another writer; it never authorizes silent overwrites.

Closing a tab during its pending save can still lose recent browser-only edits. A timeout, disconnect, or cancellation after dispatch has an uncertain outcome. Never retry mutations automatically. Read back saved state first.

## Access and security

Pause/Resume agent access is persistent per workspace, not per tab. It covers direct MCP workspace operations and associated browser canvas dispatch. Resume from an explicitly opened browser workspace. Pause does not revoke the human browser's own workspace reads/saves. Already-dispatched work can have an uncertain outcome; Pause is not rollback.

The broker remains loopback-only. Browser workspace requests require exact Origin/Host, same-origin Fetch Metadata when present, a custom header, and a fresh short-lived one-use ticket. Browser tickets never expose the internal broker secret and cannot invoke MCP command dispatch. Internal MCP clients use the separate private credential. The application origin is trusted to select local service workspaces: these checks are not user authentication or per-profile access control. Keep the frontend on a trusted network, without public ingress.

## Supported operations and limits

Backend targets support projects/files/pages, layer reads and edits, tokens, review-thread reads/status, JSON imports/exports, and session undo/redo. The same validated editor actions run in an isolated backend store, not a second implementation of document mutations.

`workspaceId` supports every document tool without a frontend or browser. Restricted HTML uses parse5 and CSSStyleDeclaration as inert data parsers, then the same validated layer conversion as browser imports. SVG/HTML/JSX exports use the shared artwork serializer. Native PNG rendering uses @napi-rs/canvas, not Chromium, an isolated browser profile or UI automation. Typography uses the same wrapping/geometry rules with native measurement and directly loaded bundled fonts. Missing system fonts resolve to Inter without changing document data; get_node/get_fonts and PNG fontResolution report substitutions. Native and browser rendering are not promised pixel-identical across platforms. Animated image capture uses the first decoded frame. Browser canvas responses retain their existing in-memory/session revision and separate persistence semantics; do not mix them with backend durable revisions.

Native PNG output retains the 4096 px side and eight-megapixel limits. Embedded render images must decode as PNG/JPEG/WebP/GIF, each at most 4096 px per side and eight megapixels, with at most 32 megapixels per capture. Captures allow at most 100,000 visible text characters. Raster signatures are checked before decoding. Sharp/libvips enforces the input-pixel limit, validates decoded dimensions and converts one frame to a trusted PNG with a five-second processing timeout. Truncated/corrupt data, SVG disguised as raster and oversized GIF frames are rejected. Normalized images are capped at 12 MB per capture. Only generated, escaped SVG with these normalized PNGs reaches the final native rasterizer. No document URI is fetched or read as a filesystem path. HTML parsing also limits tree depth and node count.

At most 50 service workspaces and 40 MB serialized data per workspace. Existing document limits remain. MCP responses remain capped at 12 MB; browser workspace backup supports larger workspaces. Whole-workspace JSON saves and two-second polling are a first local implementation, not multiplayer collaboration or large-asset storage. Workspaces have no deletion API in this increment.

## Workspace-bound links

Canonical browser links include `?workspace=<durableWorkspaceId>` in addition to the compact file/page path. Startup honors this explicit ID before origin-wide remembered selection. Missing or invalid targets show the chooser/error rather than substituting another workspace. Back/Forward into a different workspace cannot resolve against the current workspace silently. Legacy file/page links without a service ID require explicit workspace selection and then gain the selected ID. This matters because two deliberate browser copies can contain identical file/page IDs.
