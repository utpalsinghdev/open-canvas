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

## Multi-project/files/pages increment

Branch `feat/multi-projects` begins at the locally merged MCP commit `57fc1c8`. Existing main checkout remains unchanged. This increment implements project → files → pages → artboards/layers, with version-2 file backups and a versioned IndexedDB workspace. No test files were added.

### Actual browser and storage checks

- Prepared a synthetic legacy local-storage document named Legacy board with a rectangle and a color token in a dedicated browser origin. Removed only that session's synthetic IndexedDB record, then reloaded. Migration produced Personal → Legacy board → Page 1. Layer identity/content and token metadata survived; original local-storage value remained intact.
- Created Page 2, drew a rectangle, undid/redid it, and switched pages. Each page retained its own layers; file history remained usable across page switches.
- Created Client work project and Website file through Projects. Opened Legacy board again and confirmed its history remained available while Website had a fresh history. Reloaded and inspected the IndexedDB record: both projects, all files/pages/layer counts, and active page were restored.
- Downloaded a version-2 file through the UI and parsed it as JSON. It included Desktop and Mobile pages. Imported it as another file without changing existing files.
- Imported a complete project archive and a workspace backup. After reload, a downloaded workspace contained seven synthetic projects and seventeen files with seventeen distinct file IDs. Original entries remained. Duplicate names were permitted; IDs differed.
- Opened two actual browser tabs on the same origin. After one saved, an edit in the stale tab displayed Workspace changed in another tab and Not saved. Direct IndexedDB read confirmed the newer stored value and disk revision had not been overwritten. The stale tab's edit remained in memory until reloaded. An initial tab-switch command used unsupported integer indices; corrected to stable tab IDs before exercising the actual conflict.
- Served the production bundle on port 5188 and confirmed HTTP 200 through localmachine and from the Mac over SSH. Existing origins and running main app were not modified.
- On the production bundle, renamed a page, duplicated it, confirmed page deletion, and restored it with Undo. Created and permanently deleted a disposable project through the explicit warning/confirmation flow.
- Inspected Projects at desktop 1440×1000 and mobile 390×844. Mobile document width was 390; dialog and file-list bounds stayed inside the viewport. Pages were accessible through Layers overlay. No browser errors were reported.

### Actual MCP checks

- Official SDK stdio tool listing returned 44 tools, including 17 project/file/page/library operations.
- Created/renamed/deleted synthetic projects/files, created Desktop/Mobile pages, created artboards/text on separate pages, listed pages, opened explicit files/pages, and read a complete inactive file.
- Duplicated a page, undid the duplication, deleted another page, and restored it through per-file Undo.
- Duplicated a complete file. Its history began empty. Changed original text, opened its copy and confirmed copied text stayed unchanged, returned to the original, then undid that original edit.
- A wrong file context was rejected even with a current revision and an otherwise valid copied node ID. Last-file and last-page deletion returned explicit errors.
- Exported a complete version-2 file with every page, a project archive, and a workspace archive. A page PNG screenshot returned its precise project/file/page context and expected 640×480 dimensions.
- Browser/client reloads were required after tool and connector changes. One pairing attempt found its file absent despite a live older broker; this exposed the separate multi-session ownership issue. The user requested a subagent for that issue; its implementation and limitations are documented in mcp-multi-session.md.

### Shared broker integration

The subagent's change preserves the parent's Location metadata and supports secondary authenticated stdio clients. Parent review found that list_canvases had to await an attached broker's asynchronous result; corrected this before verification. Added bounded identity/list requests, refused redirects on internal requests, and propagated closed HTTP responses to cancellation. Extracted metadata/attached-client code into `server/shared-broker.ts` to keep modules focused.

Two official SDK clients were then started in an isolated temporary source copy on a checked-unused port. Both listed the same synthetic paired WebSocket canvas and completed a broker request/response round trip. Closing the secondary preserved identical owner metadata. Owner shutdown completed, and the isolated copy was removed. This verifies shared transport with a synthetic socket, not a second independent real-browser artwork run. Earlier real-browser MCP checks verify domain behavior separately.

The running legacy owner on default port 4781 and its private metadata were left untouched. It cannot be safely adopted under the new ownership format; its owner must be deliberately restarted before using shared-broker behavior. Global agent settings and portfolio content were not changed. Multiple-session tool discovery may still require the agent's normal reload.

### Checks and limits

`npm run check`, `npm run build`, and `git diff --check` passed during implementation. Zod dependency comment annotations still produce harmless build warnings. The UI detector returned no findings for Projects, Pages, App, and stylesheet. No full automated suite or independent security audit is claimed.

Storage quota exhaustion, corrupted-database recovery UI, full 200-file saturation, all schema-invalid archives, and browser-termination timing were not deliberately forced. Conflict rejection is not multiplayer merging. Project/file deletion is permanent; page/content history is in-memory per file and clears on reload. Different ports/origins have different workspaces, requiring JSON transfer rather than automatic access to data at another origin.

## Stable-main/development runtime configuration

Added fixed profiles for main frontend/MCP 5182/4781 and development 5188/4785, separate pairing directories and agent config names, and a committed main snapshot publisher. Development runs only on a feature branch in a separate worktree. Main launchers use their selected release's frontend, server source, and installed dependencies; publishing does not restart services.

Checks performed before the configuration commit:

- `npm run check`, `npm run build`, and `git diff --check` passed. Existing dependency annotation warnings remain non-blocking.
- Settings resolution returned the documented port pairs, exact origins, and distinct private metadata paths. Development rejected reserved main ports; main rejected custom port overrides.
- Development launch from primary main was refused. The existing separate feature worktree passed the checkout guard. An explicit additional dev port pair resolved correctly.
- Missing main release failed with an instruction to run release:main. Publishing from dirty main was refused without changing any pointer or process.
- In an isolated temporary Git repository, release:main archived committed source, installed a separate locked dependency tree, built successfully, and wrote a valid release pointer. No app listener or broker was stopped by that operation.

The existing main MCP owner and global agent settings are not automatically migrated or killed. A deliberate reconnect/restart is required to switch legacy clients from their old direct-source paths to generated main-release config. This is an explicit first-migration limit, not a claim of live client migration.

### Live runtime isolation verification

- Prepared the first real main snapshot from clean committed main. Comparing the running frontend entry before/after publication showed no change until the deliberate frontend cutover.
- Replaced only the task-owned frontend process with `npm start`. Process arguments showed Vite and esbuild running from `.cavas/releases/<commit>/node_modules`, not root dist or the feature worktree. HTTP and browser metadata identified the main profile and exact release commit. Projects rendered, file inputs remained hidden, and no browser errors were reported.
- Re-ran the source `npm run build` while frozen main was running. The main HTTP entry remained byte-identical, proving source builds no longer replace the live frontend.
- A temporary source copy inside the existing feature worktree exercised supported dev launch and config generation on 5188/4785. Its first location under `.cavas` was correctly denied by Vite; moved the disposable copy outside that private path before verifying actual dev HTTP/browser behavior. No security guard was weakened.
- Actual official SDK clients started main and dev MCP concurrently. Capabilities reported main's commit and Origin 5182 versus development and Origin 5188. Pairing files were in separate directories with different codes. Closing the development client left main MCP responsive and its pairing metadata intact.
- Actual browser opened development on 5188 and read dev profile metadata without errors. The main frontend stayed byte-identical while that runtime ran. Temporary dev app, clients, browsers, and exact task-owned source copies were cleaned up afterward.
- The previously running legacy main MCP owner exited independently; it was not killed by this work. Updated only the existing global Pi open-cavas command/arguments/cwd/runtime environment to generated stable-main config, preserving other entries and making a private backup. Existing agent sessions still need their normal MCP reload/reconnect; this operation did not inject tools into an already-running session.
- Production main is served on the same 5182 browser origin, so no browser workspace migration between ports was introduced. Future feature work uses 5188/4785, and future rollouts follow docs/runtime.md.

No new test files or public Git actions were used. Automatic service restart after reboot, hot migration of paired sockets, and unannounced broker-owner termination are intentionally not implemented. Release preparation does not kill services. A coordinated restart remains the deployment boundary.

## Automatic MCP browser connection

The user explicitly requested removal of manual pairing, tested on a separate branch and then rolled out to main. This increment removes the Pair UI, code input, scripts/pair.mjs, and mcp:pair npm commands. Historical pairing checks above describe earlier releases, not current setup.

- Opened a dedicated synthetic dev browser at localmachine:5188 before starting the broker. It showed Waiting for agent. Starting an actual official SDK stdio client on the dev profile made that same tab automatically register, without entering a code or clicking Connect/Pair. The SDK listed its canvas and current context.
- Through that SDK connection, created an artboard/text layer, read the exact text back, and captured a 500×300 PNG as MCP image content. No user portfolio content was used.
- Paused agent access and confirmed list_canvases became empty. Resumed without a code and reconnected. Reloaded the browser and confirmed automatic registration and zero password/code inputs. Initial UI test selectors incorrectly expected aria-label attributes on native text buttons; corrected selectors and exercised the actual controls.
- Stopped the task-owned dev broker, restarted it, and confirmed the already-open browser reconnected with no manual action. No design mutation was replayed.
- Bootstrap is a same-origin POST with exact Origin/Host validation and a custom browser header. Wrong Origin, wrong Host, cross-site Fetch Metadata, missing custom header, and GET each returned 403. A valid request returned 200 with Cache-Control no-store; a WebSocket using a previously consumed ticket returned 403. Unauthenticated internal tool HTTP returned 403.
- An initial direct Node fetch tried overriding Host; the client did not produce the intended valid app request. Corrected positive checks to use the real frontend proxy Origin/Host. Negative Host checks still used the direct loopback listener. No protection was relaxed.
- Inspected connection disclosure at desktop/mobile widths. Mobile document width remained 390 and the 300 px disclosure stayed inside its viewport. No continuously repainting animation or password field remains.
- `npm ci`, `npm run check`, `npm run build`, and `git diff --check` passed. Existing esbuild install-script policy and dependency annotation warnings did not prevent the build. No test files were created.

Automatic access changes the trust model: opening an app tab implicitly exposes it to trusted local MCP clients. The app remains trusted-network-only. Browser tickets grant registration of that browser's canvas, not authority to list/control other sockets; internal broker credentials remain private. Tickets expire after 20 seconds and pending tickets are bounded at 32. Expiry/saturation were inspected in source, not waited out or load-tested. A real browser holding the user's workspace is still required. Old loaded pages need one reload to receive the new connector.

## Changesets setup

Installed @changesets/cli as a development dependency. Config includes private-package versioning, restricted access, main as base branch, no automatic commit, and no tagging. Added changeset, changeset:status, and version:apply scripts and documented the separation between semantic versioning and frozen main deployment.

`npm run changeset:status` reports the pending setup patch for open-cavas. In an isolated temporary package copy, `npm run version:apply` consumed the entry, generated CHANGELOG.md, and updated package.json, package-lock.json top-level version, and lockfile root-package version to0.1.1. The real repo remains private at0.1.0 with its pending entry intact. `npm run check` passed. No npm publish, tags, service restart, or actual repository version bump occurred.
