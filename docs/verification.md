# Verification record

No test files were written. Verification uses the real browser, TypeScript, production build, static UI checks, and downloaded artifacts.

## Checks and outcomes

- `npm install`: passed, zero audit vulnerabilities at install time. npm reported the esbuild postinstall script was blocked by local policy; Vite and the subsequent production builds still ran successfully. No policy was changed.
- Initial `npm run check`: failed on discriminant widening in node construction and duplication. Constructors gained explicit variant overloads. Duplication now preserves the narrowed node variant. A follow-up typecheck passed. The duplication correction is its own local commit, not hidden by rewriting history.
- `npm run check` and `npm run build`: passed after implementation. Production output includes HTML, CSS, and JavaScript. Rollup reports two harmless annotation-placement warnings in Zod dependency comments; no application build errors.
- Active LSP diagnostics for all 16 TypeScript/TSX source files: zero errors, no unsupported or inconclusive files.
- `git diff --check`: passed.
- Production preview on a separately checked free port returned HTTP 200. A separate real-browser session loaded the built bundle, created an empty document, drew an artboard, and drew an ellipse parented to that artboard. No browser errors were reported. The temporary preview was stopped after verification.
- No existing CI workflows or test suite were present in the initially empty application repository.
- `curl --fail http://localmachine:5178/`: returned the application entry point on the home server. The same request over SSH from the Mac also succeeded.
- Impeccable detector on application UI targets: no findings.
- Hallmark static check after fixes: zero floor failures. Pure black/white theme warnings are explicitly waived for the user's pinned theme. One disabled-control contrast warning remains; disabled controls are exempt from WCAG text contrast requirements. The render tier did not run because puppeteer-core was unavailable. Real agent-browser captures were used instead; no render-tier pass is claimed.

## Real browser workflows

The app was opened through `http://localmachine:5178`, not loopback. A dedicated browser session was used.

- Selected a text layer and changed its X coordinate through Properties. Undo restored the original coordinate.
- Duplicated and deleted layers. Drew a rectangle by pointer drag.
- Resized a rectangle through its bottom-right handle. Properties reflected the new width and height. Dragging updated its world coordinates.
- Changed width to 240, locked the layer, and confirmed disabled property controls. Reloaded and confirmed width and lock state persisted.
- Repositioned an artboard from X 100 to X 120. Its text child's X moved from 132 to 152.
- Imported a real PNG using the image input and observed its selected layer.
- Downloaded a JSON backup and parsed it with Python's JSON parser. It held version 1, the document name, 12 layers, and one embedded image at that point in the walkthrough.
- Downloaded whole-document SVG and parsed it as XML. Exported a selected artboard and confirmed its 640 by 500 viewport and title.
- Reopened the downloaded JSON. Submitted an unsupported version 999 document and confirmed rejection while the current 12-layer document remained unchanged.
- Opened and dismissed keyboard help.
- Found that pointer capture retargeted double-click events to the SVG root. Fixed artwork hit-testing, then double-clicked text, edited it on canvas, committed with Ctrl+Enter, and read the updated value in Properties.
- Final source LSP scan again reported zero errors across all 16 source files.
- Inspected desktop at 1440 by 1000 and mobile at 390 by 844. Mobile document width matched 390, toolbar fit inside the viewport, and Layers opened as an overlay.

## Scope not verified

No independent review, full automated suite, touch-device run, or Safari/Firefox run. Rotated resizing uses local-axis geometry but only an unrotated pointer resize was exercised manually. Storage-quota failure is handled in code but was not forced during this session. No deployment, authentication, third-party editable design document compatibility, multiplayer, or cloud sync is claimed.


## MCP branch verification

Implementation branch: `feat/mcp-server`, in its own T3 worktree, based on `de8046e`. The original main checkout was checked and remained clean. No external documents, global MCP configuration, SSH configuration, or existing main application service was changed.

### Build and source checks

- Installed official `@modelcontextprotocol/sdk`, `ws`, and `tsx`, plus Node/WebSocket types. npm reported zero audit vulnerabilities. Local policy blocked esbuild install scripts; subsequent TypeScript checks and production builds succeeded without changing that policy.
- `npm run check`: passed after resolving schema-inference and literal-return typing errors during implementation.
- `npm run build`: passed repeatedly, including the final source/configuration state. Existing Zod annotation warnings remain dependency comments, not build failures.
- `git diff --check`: passed.
- Active LSP scan covered 26 source/config files and returned no findings, but all 26 were inconclusive because the server could not confirm silent clean rechecks. This is not an LSP clean result. Successful `tsc --noEmit` is the type-verification evidence.
- UI detector on the pairing component and stylesheet returned no findings. Desktop at 1440 by 1000 and mobile at 390 by 844 were captured and inspected. Mobile document width was 390; the 300 px pairing disclosure stayed inside the viewport.
- No automated test files or disguised regression suites were added. Verification used manual SDK client calls, real browser actions, artifact parsing, and temporary loopback tooling that was removed from service afterward.

### Real MCP protocol and editor flow

An official SDK client launched the actual stdio server and drove tools/call through an authenticated paired browser. Tool listing returned 27 tools. This was not direct invocation of an internal mutation function.

- Initial browser hello exposed an invalid duplicate discriminator in the message schema. Corrected it to a validated union before continuing; the restarted server paired successfully.
- Created `MCP Integration` artboard and text/rectangle children, then read their stable IDs and tree back.
- Initial HTML import hit browser CSS-shorthand expansion. Corrected raw-declaration validation and normalized RGB color handling. Reloaded and re-paired to avoid an old hot-reloaded WebSocket callback, then created editable HTML background/text layers and read them back.
- Changed text and geometry, rotated a rectangle, moved an artboard with its children, duplicated/deleted a layer, and exercised undo/redo. Child geometry moved by the same artboard delta.
- Read selection and styles, changed selection/order/name, created/read/applied design tokens, and created an embedded PNG image through MCP.
- Exported SVG, HTML, SVG JSX, and complete JSON. Python's XML parser accepted the SVG. TypeScript's JSX transpiler returned zero syntax diagnostics for exported JSX. JSON was reopened through MCP after creating a blank document, restoring the prior document.
- Received a 640 by 480 PNG as actual MCP image content, saved it temporarily, and inspected it. Artboard text clipping reflected the explicit non-wrapping text model, not missing capture content.
- Edited text manually in the real browser and read the new content through MCP with an advanced revision.
- A stale-revision delete returned a revision conflict without deleting its target. Script-bearing HTML returned an error. A focused manual inspector edit blocked an agent mutation.
- Production bundle was then served on the configured app port. Re-pairing, document/token read-back, rename, and a 640 by 480 artwork screenshot all succeeded against that built bundle. The document name visible in the browser matched the MCP mutation.
- Both development and production app entry points were reached through `localmachine`, and HTTP access from the Mac over SSH was verified.

### Security and lifecycle checks

- Wrong code, wrong Origin, and missing Origin each returned HTTP 403 before WebSocket connection.
- Pairing directory mode was 0700; code-file mode was 0600. The code was never printed into the verification record or committed.
- Vite's default filesystem deny list does not cover application-specific private directories. Added an explicit `.cavas/**` deny while preserving its default secret-file rules. A non-secret private probe returned HTTP 403 through ordinary, `/@fs`, `?raw`, and `?url` requests. Probe content was not served. The probe file and temporary dev server were removed.
- Closed a temporary paired socket during an outstanding SDK request. The call returned an explicit disconnected/unknown-outcome error, not a success receipt or automatic retry.
- Used the real Disconnect agent control and confirmed `list_canvases` became empty. Closed the verification browser and manual SDK client. The private broker/helper ports closed, and normal shutdown removed `.cavas/pairing.json`.
- `npm run --silent mcp:config` produced parseable JSON with this checkout's absolute paths. `npm run --silent mcp:pair` produced the expected pairing instructions while a server was running, with the private code redacted from captured output.

### Remaining limits

Timeout and cancellation error paths exist but were not deliberately forced end-to-end. Eight-session saturation, all malformed-message combinations, storage-quota failure, and cross-browser rendering were not exhaustively exercised. No independent security review is claimed. Multi-page management, arbitrary HTML/CSS layout, dynamic token bindings, semantic web-code reconstruction, headless documents, and hosted HTTP MCP remain unsupported. See `mcp-capabilities.md`.

The production app remains available on the worktree's port 5182. The temporary MCP driver is stopped; a real agent must launch the configured stdio process, then the user pairs its browser through the documented flow.
