# open-cavas

## 0.7.0

### Minor Changes

- c0092fc: Separate the web editor and local service into workspace applications with shared document, engine, and MCP packages. Preserve existing documents, local saves, tool contracts, and runtime commands.

### Patch Changes

- 4a55bb2: Pin Node.js 24.22.1 and pnpm 12.21.0 for reproducible installs, builds, and release snapshots. Use the pnpm lockfile and updated setup commands.

## 0.6.1

### Patch Changes

- b9393f4: Show the local workspace save destination and explain original-browser recovery. Enable browser copy and backup only for validated saved browser data, retaining the existing disk store and browser recovery copies.

  Block static filesystem aliases to private workspace data in development and preview, and reject private-state aliases during public asset builds. Preserve the attempted workspace target when a create response is lost.

## 0.6.0

### Minor Changes

- 3b69c7e: Run restricted HTML import, SVG-based exports, measured text reads and PNG artwork capture directly in the workspace backend without a browser. Recover broker ownership before dispatch without replaying design requests, and retain the frontend while its workspace child restarts.
- 595eef5: Add a Home destination for browsing projects and files, with labeled navigation from the editor and shared library actions. Keep committed edits, autosave, file history, and save-recovery feedback across Home navigation.
- d28f00a: Allow installed font family names in text layers, font tokens, JSON imports, and restricted HTML import. Add inspector family entry, explicit browser detection and fallback status, and optional family queries through get_fonts. Preserve case-insensitive bundled font loading and export embedding.

  MCP font availability now uses available, unavailable, loading, or unverified instead of system. Screenshot font metadata changes from a keyed object to an array of family/availability entries. System fonts are not embedded in exports. Browser font detection uses text metrics; backend availability reflects the native font registry. Reload browser tabs and reconnect MCP clients after upgrading.
- 3b27868: Add paginated PDF export for selected artboards and explicit active-page export in the editor and MCP. Group SVG and PDF in one Export dropdown with scope labels, keeping JSON backups in the File menu. Preserve browser-rendered artwork at 2× resolution with predictable page dimensions and explicit resource/size errors.
- b404fa1: Add an editable introductory canvas with two seeded artboards covering drawing, navigation, local saves, exports, and local MCP access. Start with the introduction from the workspace chooser without changing existing artwork or empty-workspace creation.

## 0.5.0

### Minor Changes

- c108676: Add explicit local service workspaces for browser-independent MCP data operations. Preserve browser data through opt-in, identity-preserving copying, reject stale writes, and keep browser navigation separate from agent page targets. Browser rendering still requires a connected tab.

### Patch Changes

- 21ceb18: Keep workspace save recovery guidance visible until persistence recovers, and report bounded storage failure details in the editor and MCP responses. This does not change conflict handling or fix the unconfirmed cause of concurrent-editing save failures.
- be065b9: Report actionable shared-broker transport and credential failures without retrying requests or changing ownership. Document coordinated recovery and clarify that local capabilities do not establish broker health.
- dd1d7ec: Unify canvas tool and resize cursors with outlined SVG artwork, native creation crosshairs, accurate hotspots, and native fallbacks. Preserve native inline text editing and panel cursors.

## 0.4.0

### Minor Changes

- 4144b4d: Add a keyboard-accessible Collapse all action to the Layers panel. It folds artboard branches on the current page without changing selection or artwork, and individual branches can still be reopened.
- 57b41ea: Add local page-aware review threads anchored to layers or canvas positions, with replies, resolve/reopen controls, complete JSON backups, and MCP thread reads and status changes.
- 083967e: Show page-specific MCP request activity above the canvas, with cleanup on completion, failure, timeout, cancellation, and disconnection.

### Patch Changes

- d948461: Share unchanged validated pages and layers across undo snapshots and workspace navigation to reduce retained memory in multi-page files.
- 4df2266: Shorten file and page URLs with lossless base64url ID tokens while preserving existing path and query bookmarks.
- 46904a5: Show tool-specific canvas cursors and preserve pan, resize, and text-edit cursor feedback.

## 0.3.0

### Minor Changes

- 7534217: Add independent desktop sidebar collapse controls, preserving panel content and expanding the canvas into the freed space.
- b6062af: Use shorter `/file/<fileId>/<pageId>` links while preserving existing query-parameter bookmarks, browser history, and unavailable-destination recovery.

### Patch Changes

- c057c31: Distinguish stored text frames from content bounds and size inline editing areas to the text without changing document dimensions.

## 0.2.0

### Minor Changes

- 34069e1: Add bundled variable fonts and measured, editable text layout across the editor, MCP, persistence, and SVG exports.
- dcf9d0a: Add stable project, file, and page URLs with refresh restoration, browser history navigation, and explicit recovery for unavailable local destinations.

### Patch Changes

- 7cbbd46: Publish private MCP broker credentials atomically so interrupted startup cannot leave an empty final metadata file.
- 5399708: Keep Ctrl/Cmd+scroll zoom and scroll panning working after switching files or pages.
- 5cccefa: Restore canvas keyboard undo and redo after editing property inputs by moving focus to the canvas when starting a pointer gesture.
- 90eda8f: Show a single editable text layer during inline editing, without overlapping canvas text or resize decorations. Preserve text bounds at different zoom levels and disable automatic wrapping to match canvas text.
- 525aa85: Add Changesets version planning and changelog generation for private app releases.
- 552b7bb: Keep the main frontend running independently of agent sessions with a restart-on-failure systemd user service.
- cfdad43: Automatically load new main frontend releases when the workspace is saved and idle, without interrupting active edits or agent requests.
