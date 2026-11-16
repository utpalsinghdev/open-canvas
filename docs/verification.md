# Verification record

## Desktop workbench recomposition

The second desktop pass replaced the stacked command bars with one header and a vertical drawing-tool rail, introduced native active-page previews in Home, regrouped inspector fields, and split workspace setup into opening and creation columns. Verified in the same isolated feature worktree:

- `pnpm run check` and `pnpm run build` passed with the pinned Node/pnpm toolchain. No application build errors; existing dependency annotation warnings remain.
- At 1440 × 1000, the canvas starts at x=288 and y=52, immediately after the 240 px Layers panel and 48 px tool rail. With both panels collapsed, the rail moves to x=0 and canvas spans x=48 through 1440, preserving selection. Toolbar accessibility orientation is vertical on desktop and horizontal on narrow layouts.
- Drew a 200 × 150 rectangle from the vertical rail on an empty page; undo removed it and redo restored it. Restored the empty page afterward. Edited the introductory rectangle width to 240, undid to 230, verified lock disabling, and reloaded to confirm its saved 230 px width.
- Home previewed native artwork, then a duplicated file with independent clip IDs. Switching that copy to its empty second page produced an explicit Empty page preview while the original retained artwork. Renamed the copy and exercised search with no matches.
- Reimported a downloaded version-2 backup as a new file with two pages and 17 introductory layers, opened it, and observed its native Home preview. Deleted only that verification file through the confirmation UI. Existing files remained.
- Downloaded JSON, SVG, and PDF through the recomposed header. JSON retained two pages and 17 layers on the introductory page; SVG remained 1248 × 760; PDF retained its PDF 1.7 header.
- Captured the same 13 desktop surfaces/states as the initial pass. Updated examples include extra synthetic workspace/file entries and resolved feedback created during verification. Inspected 1024 × 768 and 1920 × 1080 desktop layouts, plus a 390 × 844 chooser/editor-overlay sanity check. Tested viewport and document widths matched. Camera position intentionally stays unchanged when only viewport size changes; Fit canvas reframes it.
- Impeccable reported no findings. Hallmark's final static scan had zero failures and one long introductory-action label warning, with explicit desktop nowrap and narrow wrapping. Its render tier remains unavailable; real Chromium captures supply visual evidence.

This remains single-reviewer verification. Lazy preview mounting, visibility, clipping, and opacity follow the existing native renderer, but there was no large-library performance benchmark or exhaustive visual-fidelity comparison. No new tests, schema migration, backend/MCP contract change, main release, or service restart were added.

## Initial desktop interface pass

Verified with Node.js 24.22.1 and pnpm 12.21.0 in an isolated development worktree:

- `pnpm run check` and `pnpm run build` passed. Build retained the existing dependency annotation warnings.
- Impeccable's detector reported no findings on the changed UI targets. Hallmark's static scan reported zero failures and one long-label warning. The introductory action has explicit desktop nowrap styling and wraps on narrow screens. Hallmark's render tier did not run because puppeteer-core was unavailable; real Chromium screenshots supplied visual evidence instead.
- Captured matching 1440 × 1000 Before/After states for workspace selection, Home, file creation, Projects, editor with no selection, empty page, shape inspector, typography, File menu, Export menu, Help, review list, and comment composition. The base and updated editor auto-fit the same artwork at different zoom levels because panel widths changed.
- Desktop checks at 1024 × 768 and 1920 × 1080 had no document-width overflow. At 1024 px, drawing tools stayed between the side regions. At 390 × 844, workspace setup fit without document-width overflow and the existing Properties overlay remained accessible. This was a narrow-layout sanity check, not a mobile redesign.
- Opened a saved workspace, created an introductory workspace with 17 native layers, and created an empty workspace. The latter retained its Home-first behavior and opened an empty Untitled file.
- Empty workspace-name input disabled both creation actions. Browser copy/backup remained disabled without recoverable browser data and were accessible through the recovery disclosure.
- Home search showed No matching files for an unmatched query. Created a file, opened it, and confirmed its presence through a saved MCP workspace read. Exercised file deletion with its explicit confirmation and observed the row disappear.
- Changed rectangle width from 230 to 240, verified undo to 230 and redo to 240 after reselecting the layer, then restored 230. Locking disabled the property fieldset. Both desktop sidebars collapsed and reopened; the canvas filled the freed columns.
- Added a page, returned to the original page, reloaded the file destination, and observed both pages plus the restored 230 px rectangle width.
- Posted a review comment, posted a reply, resolved the thread, and reopened it. Opened and dismissed Projects, Help, File, and Export surfaces.
- Downloaded and parsed a version-2 JSON backup with both pages and 17 layers on the original page. Downloaded a 1248 × 760 SVG and a one-page PDF 1.7 through the existing export menu. These checks verified the controls and generated artifacts, not a pixel comparison or native JSON reimport.
- An official MCP SDK client discovered the development workspace and connected canvas. `list_projects` returned the newly created file and page with persistence reported as saved. No MCP contract or document model changed.

No new test files were added. Verification did not include an independent review. Browser-copy recovery with real legacy data, forced service/save failures, Safari/Firefox, and touch devices were not verified. No main release or service restart was performed.

## Pinned Node and pnpm migration

Verified on Node.js 24.22.1 and pnpm 12.21.0 in the feature worktree:

- `corepack pnpm install --frozen-lockfile`, `corepack pnpm run check`, and `corepack pnpm run build` passed. Build retained the existing Zod annotation warnings.
- The imported pnpm lockfile preserves direct dependency versions except for aligning `@types/node` with Node 24. A frozen install with Node 22.23.4 was rejected by strict engine validation.
- `corepack pnpm run changeset:status` reported the migration's pending patch without applying a version change.
- The isolated development launcher returned HTTP 200 through localmachine. `corepack pnpm --silent run mcp:config:dev` produced parseable JSON, and an official SDK stdio client completed `list_workspaces` against its isolated broker.
- A clean disposable clone passed `corepack pnpm install --frozen-lockfile` with the explicit esbuild build policy. `corepack pnpm run release:main` prepared and built only that clone's archived snapshot. Vite, tsx, sharp, and canvas resolved inside the snapshot; native canvas and sharp produced PNG output.
- `corepack pnpm run version:apply` succeeded only in the disposable clone, consumed the pending patch, and refreshed the pnpm lockfile. The real feature branch's app version was not bumped.

Historical npm commands below describe checks actually run before this migration. They are not current setup instructions. No new test files or editor UI changes accompany the migration. No main service restart or global toolchain-default change was performed.

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


## Automatic main frontend release updates

Implemented on feat/automatic-release-updates in a separate feature worktree. Main-only browser monitoring detects served runtime.json commit changes and reloads only after saved/idle checks. MCP request entry/finally tracks active requests and recent agent activity. Normal dev/HMR remains excluded.

`npm run build` initially found an unsafe closure narrowing of a Zod result; captured the validated release value before installing callbacks, then TypeScript/build passed. Actual browser verification used the production bundle through a temporary static server on checked-free5194, with synthetic main HTML/manifest commits A/B/C/D. It did not change the running main service or user portfolio.

- While an uncommitted title input held a draft, advancing the served manifest left release A and the draft intact beyond the idle interval. Committing the field allowed automatic reload to B, restoring the saved title. An initial selector waited for a visible meta element and timed out; direct read-back confirmed reload had already succeeded. Later checks used DOM-expression waits.
- Injected a synthetic IndexedDB write failure in that dedicated browser. Header became Not saved. Advancing to C did not reload or discard the in-memory title. Removing the fault and committing a new edit saved the whole workspace, then automatic reload to C restored the recovered title.
- Held an actual pointer drag while advancing to D. Browser remained on C until pointer release, save completion, and idle grace, then reloaded to D with the workspace name preserved.
- No JavaScript page errors were reported. No test files were added. This fixture deliberately had no MCP broker, so the in-flight MCP guard was reviewed/typechecked but not forced with a delayed live tool call in this pass.

The current pre-updater main bundle cannot retroactively gain polling without loading this new frontend once. Future saved/idle main pages carrying the updater refresh automatically after rollouts. Background browser throttling, storage quota recovery on every browser engine, and full cross-version undo transfer are not claimed. Reload clears session-only history and requires agents to rediscover canvas/context.

## Atomic broker metadata publication

After the automatic-release rollout, a client reported startup refusal because its final broker.json was an empty mode-0600 file and no listener owned4781. The code wrote the final path directly; an interrupted writer could expose an empty credential file. Changed publication to write complete validated metadata into an exclusively created private sibling temporary file, then hard-link it atomically to the final path without overwriting an owner. Temporary cleanup is scoped to that publication.

Direct temporary-directory verification produced complete parseable mode-0600 metadata. A second publication returned EEXIST and left the original owner metadata byte-identical. TypeScript/build checks passed. This does not silently bypass validation or delete malformed live metadata. No new test files were added. Per the user's latest instruction, further coordination messages to the portfolio thread were stopped.


## Persistent main frontend runtime

A later live check found the main frontend absent on5182 while the private MCP broker remained on4781. This makes browser registration and release polling fail independently of code freshness. Added a named Linux systemd user service installer rather than another temporary agent-owned shell.

The installer generates a main-only unit, validates the prepared release, preserves unowned/occupied services, and enables restart-on-failure. It does not modify linger policy or own MCP clients. Unit generation initially quoted WorkingDirectory in a way systemd treated as a literal relative path; corrected the directive, and systemd-analyze --user verify then succeeded. A feature-worktree installation was correctly refused. Node syntax, TypeScript, and source build checks passed before commit. No test files were added.

Persistent-service live result: installation from primary main succeeded and enabled open-cavas-main.service. systemctl reported active/running, Restart=on-failure, and a dedicated systemd control group for the main launcher, Vite, and esbuild. HTTP startup was not instantaneous; an immediate curl raced startup, then the subsequent check returned the prepared 7cbbd46 runtime successfully. Existing host linger policy was already enabled and was not changed. The existing MCP broker process remained intact throughout.

Most importantly, a native list_canvases read before restoration returned an empty array; after the persistent frontend started, the actual existing browser workspace registered automatically. No browser reload, personal-profile control, substitute browser, pairing code, document mutation, or inter-thread message was used for that recovery. The service wraps the existing frozen application release; these service-only changes did not require changing the current broker's code version. Restart-on-failure is configured, but the live user service was not deliberately crashed while a real workspace was connected.

A repeat service:install invocation exceeded its foreground command budget while re-running systemd setup. Follow-up checks confirmed the service remained healthy with the same PID and there were no leftover installer processes. The installer now fast-returns for an identical already-active managed unit instead of unnecessarily reloading systemd.

## Typography fidelity milestone

Implementation branch `t3/mcp-typography-fidelity` in `/home/utpal/.t3/worktrees/open-canvas/t3-13ad3c7d-c61b564d61d5fedc`. Main frontend/MCP services were not changed. Used the isolated dev app at `http://localmachine:5191` and loopback-only private broker at 4791. No CI workflow or automated test files exist in this checkout.

- `npm run check`, `npm run build`, and `git diff --check` passed. Build retains two non-blocking annotation-placement warnings from Zod dependency comments.
- A legacy version-1 document parsed with missing typography fields and string weight `"500"`; it normalized to Arial, numeric weight 500, line height 1.2, zero tracking, left alignment, no wrapping, and fixed sizing. Bricolage weight 200 was rejected.
- An actual official MCP SDK stdio client connected to the isolated browser. `get_fonts` reported both bundled variable fonts available at Inter 100–900 and Bricolage 300–800. It created the editable typography and color/component artboards, then `get_node` read Bricolage Grotesque weight 620 and measured layout. A deliberately narrow fixed text layer reported overflow. Full JSON, SVG, and artboard PNG output came through MCP.
- Reloaded the browser and read back all 46 layers in the persisted version-2 file; persistence reported `saved`. SVG export is 840×620, contains embedded bundled font data, has text overflow attributes, and passes `xmllint --noout`. JSON export parses as a one-page version-2 document.
- Real browser inspection showed the font availability state, Bricolage weight bounds (300–800), line-height/tracking inputs, auto-height mode, and disabled height control. Reloaded screenshot and artboard captures are in `.audit/typography-editor-reloaded.png`, `.audit/typography-inspector.png`, `.audit/typography-specimen.png`, and `.audit/color-components.png`. Locally generated SVG/JSON export evidence is in `.audit/typography-specimen.svg` and `.audit/typography-file-export.json`.
- System fonts are intentionally marked `system`: browser APIs cannot prove whether a local system family resolved without substitution. The actual Arial/Georgia/Courier New substitution path, a failed bundled-font fetch, and Safari/Firefox were not verified.

### Parent review corrections

Review found three first-milestone gaps: HTML text import still discarded explicit height and rejected tracking/line-height, auto-size layers had no usable resize handles, and embedded font CSS was invalid when copied directly into JSX. These are corrected in the follow-up commit, with screenshot metadata carried through the server response instead of stripped.

- Re-ran `npm run check`, `npm run build`, `npm run changeset:status`, and `git diff --check`: passed. The two existing Zod dependency annotation warnings remain. Active LSP probes for typography, HTML import, MCP reads, and the server returned four clean files with no diagnostics.
- Official MCP SDK calls against a dedicated synthetic browser on the isolated development profile imported an Inter weight-620 heading with width 680, height 50, line-height 40px, and tracking 0.6px. Read-back retained height 50, line-height multiplier 1.25, tracking 0.6, and `fallback: null` when loaded. A quoted Bricolage Grotesque family at 620 imported successfully, wrapped into four lines, and reported measured auto-height 144. Reload preserved the values and line breaks with persistence `saved`.
- Dragged the auto-height text's east side handle in the actual editor. Width changed from 350 to 238 and measured height changed from 144 to 216; one MCP undo restored the original layout. Auto-width Inter at 650 reported measured width 147.769px while preserving fixed height 55.
- A padded 260×80 outer box produced a 240×60 text box at a 10px inset. Following flow text advanced by measured height. Unsupported tracking `2em` returned an explicit error without a document edit. A stale-revision text update returned a conflict and left the original heading unchanged.
- Temporarily withheld only this worktree's bundled Inter asset, then restored it immediately after the check. The editor opened; real MCP read-back reported requested Inter, resolved Arial, fallback Arial, `unavailable`, and fallback measurement. Screenshot metadata reported Inter unavailable. Reload after restoring the asset returned Inter available without rewriting the saved request.
- A real MCP screenshot at scale 0.75 returned 570×420 pixels, world bounds 0,0,760,560, and font availability. Inspected its PNG. SVG passed `xmllint --noout`; the JSX export with embedded fonts produced zero TypeScript TSX parse diagnostics. Canvas measurement and SVG rendering now explicitly use normal kerning; font measurement includes native tracking and glyph overhang/descenders.
- Parent inspected the original synthetic typography and component-board screenshots. They demonstrate editable font rendering and simple hierarchy, not a complete design system.

Remaining limits: the font registry is application-defined rather than per-document/custom-uploaded. System font substitution remains browser-defined. Full Unicode line breaking, hyphenation, rich text, text-box clipping, rotated auto-size resize behavior, cross-browser output, and the font network-timeout duration were not verified. Groups/auto-layout, native strokes/focus offsets, live token bindings, diagnostics/contrast, component instances, and parent/child reference batches are later milestones, not completed acceptance checks.

Synced current main (`514d638`) into the feature branch before publication preparation. Resolved startup by awaiting workspace/font initialization before starting the existing main-release watcher and mounting React; retained both verification histories. Post-sync build/Changeset checks passed. Reopened the same synthetic dev profile and verified HTTP 200 through localmachine, actual SDK connection, saved fixed-height and four-line auto-height read-back, and screenshot scale/bounds/font metadata. No main service installation, restart, release, or portfolio write was performed.

## Canvas wheel handling after navigation (#1)

Reproduced in Chromium 154 on Linux with a dedicated development browser. Initial canvas handled a cancelable Ctrl+wheel event, but creating a page replaced the viewport and the same event was no longer canceled or handled. App owns useCamera across the keyed Canvas remount, so the mount-only effect retained the detached viewport.

Wheel registration now uses a stable React callback ref with cleanup. After page creation, page switching, file creation, and switching back to the original file, injected Ctrl/Meta wheel events were canceled and updated canvas zoom. Detached viewport events were no longer canceled. Pointer anchor error was under 0.00003 world units; ordinary wheel panning changed camera translation by exactly the supplied deltas without changing zoom. Browser visualViewport scale remained 1. Screenshots captured the original file before and after zoom.

`npm run build` passed, including TypeScript checks, with dependency annotation warnings. `npm run changeset:status` and `git diff --check` passed. No repository CI workflows or new test files were present. Verification used injected DOM wheel events in a real browser; automation's native wheel/key commands did not establish modifier-wheel delivery. Physical mouse/trackpad and macOS Command behavior remain unverified. No main runtime or MCP metadata was used or changed.

## Issue #6: inline text overlap

- Reproduced simultaneous SVG text and textarea rendering in Chromium. Before the fix, entering an edit left one SVG text copy, one selection outline, and four resize handles beneath the textarea.
- The canvas now omits the edited node from its local artwork/selection rendering only. The document node remains unchanged until commit. Both artboard children and root text share this filter.
- The textarea uses the node's zoom-scaled bounds without minimum dimensions, preserving its rotation center and center/right alignment width. `wrap="off"` matches the document's explicit-line-break text model.
- Real browser interactions through the isolated development origin verified editing at fit zoom (60%), 100%, and 83%. During editing there was one textarea, no underlying SVG copy for that node, no selection outline, and no resize handles.
- Typing multiline text and Ctrl+Enter committed one SVG copy. Escape discarded a changed draft and restored the committed text. Clicking a property field committed on blur. The rendered node count returned to the original ten after commit/cancel, with no stale draft text.
- `npm run build` passed, including `tsc --noEmit`. Existing Zod dependency annotation warnings were nonfatal. `git diff --check` and `npm run changeset:status` passed. No CI workflow files exist in the checked base. No test files were added.
- Screenshots captured before editing fix, during editing at fit/100% zoom, and after commit. Screenshot attachments require a separate upload; local artifact paths are reported with the change rather than inventing public image URLs.
- Limitations: Chromium only. No Safari/Firefox, rotated-text interaction, or pixel-exact cross-font baseline comparison was performed. Native textarea font metrics may differ slightly from SVG. Main runtime and MCP metadata were not used or restarted.

## Issue #5: direct file/page links

- `npm run check` and `npm run build` passed. No CI workflows are configured.
- Real browser: bare URL gained complete IDs; adding a page and creating a file
  changed the URL. Back/Forward restored both page and file destinations.
- Opening a copied page URL selected that page instead of the last saved file;
  reloading preserved it.
- Deleted an active page with the existing confirmation, then navigated Back to its
  old entry. The unavailable screen appeared; Forward returned to the surviving page.
- Missing IDs and an incomplete URL displayed persistent errors. Explicit recovery
  restored a complete local destination URL and editor access.
- Screenshots captured for the page destination and unavailable destinations.
  GitHub image upload is not available through the CLI; captures remain local artifacts.
- No new test files, main release rebuild/restart, global agent settings, or main MCP
  metadata changes. Links remain browser-origin-local, not remote sharing.

## Issue #9: canvas keyboard history focus

Reproduced on app 0.1.0 at base `cfdad43`, using Chromium 154 on Linux in an isolated development browser. Focusing the X property field and then dragging Circle left that input focused because canvas pointerdown prevented the browser's default focus transfer. The drag recorded history, but Ctrl+Z reached the input and was intentionally skipped by document shortcuts.

The canvas SVG now accepts programmatic focus and takes focus before starting a pointer gesture. This also commits a pending property field through its existing blur handler. Shortcut mappings and input exclusion rules are unchanged.

- Repeated the input-focus/drag sequence. Focus moved to SVG; Circle X changed from 567 to 600, Ctrl+Z restored 567, and Ctrl+Shift+Z restored 600. Ctrl+Y also restored the undone move.
- Drew a rectangle, undid its creation, and restored it with Ctrl+Y. Deleted Circle, restored it with Ctrl+Z, and repeated the deletion with Ctrl+Shift+Z.
- Typed into the inline textarea. Ctrl+Z removed the final typed character and Ctrl+Shift+Z restored it without invoking document undo. Ctrl+Enter committed the text; document undo restored the original headline and redo restored the committed text.
- Changed X from 600 to 610 without committing first, then clicked the canvas. Blur committed 610 and SVG received focus. Undo restored 600 and Ctrl+Y restored 610.
- Meta+Z and Meta+Shift+Z advanced the undo/redo stacks in Chromium on Linux. Actual macOS keyboard delivery remains unverified, as do Firefox and Safari.
- `npm ci`, `npm run check`, `npm run build`, `npm run changeset:status`, and `git diff --check` passed. Active LSP probe of Canvas.tsx returned zero diagnostics. Browser reported no page errors. Existing Zod annotation warnings remain non-blocking. No CI workflow or test files were present or added.

Screenshots captured the selected Circle and its X property after undo and redo. Main runtime, broker metadata, and other feature worktrees were not changed. No MCP behavior changed or was exercised in this pass.

## Issue #7: text frames versus content bounds

- Reproduced in local Brave: starter text selection and editing used stored frames much wider than visible text. Zoom scaled those frames correctly; it was not the cause.
- Selection now distinguishes the dashed stored frame from the solid measured content area. The inline textarea grows with draft content, while frame dimensions remain unchanged. Whitespace measurement follows SVG collapsing for artwork and preserved whitespace/eight-space tab stops for editing.
- `npm run build` (including `npm run check`), `npm run changeset:status`, and `git diff --check` passed. Build emitted dependency annotation warnings from Zod, without failure. No CI workflow or existing test script was present.
- Real local Brave interactions checked short and long text, multiline/trailing newline, empty text, left/center/right alignment, 25-degree rotation, Escape cancellation, Meta+Enter/blur commit, undo/redo, and save/reload. Checks used 47%, 100%, and 207% zoom. Stored 500 by 36.4 frames survived all edits; long content remained unwrapped beyond its frame.
- Security/edge review identified the whitespace distinction above; corrected in measurement. No network, broker, Origin/Host, or runtime-profile changes. Main services were not restarted.
- Limitations: local Brave only, not macOS, Firefox, or Safari. Native textarea and SVG baselines can differ slightly. Whitespace/tab sizing correction was source-reviewed and built; no dedicated browser whitespace/tab case was recorded.
## Issue #2: independent desktop sidebar collapse

Reproduced the missing desktop controls in isolated local headless Brave 151.1.93.136. The existing mobile controls opened mutually exclusive overlays, not desktop sidebars.

- Verified all four desktop visibility combinations at 1440 by 1000. Layers and Properties used 224 and 248 px; collapsing each freed its column for the canvas. At 1000 and 901 px, panel widths were 192 and 224 px. No horizontal overflow was observed.
- At 390 by 844, Layers and Properties remained mutually exclusive overlays with a working Close panel control. Hidden panel descendants could not receive focus. Desktop visibility preferences survived the mobile round trip.
- Selected Headline, collapsed its artboard's layer group, and retained a text draft across responsive transitions. Restored the original text after verification. Panels remain mounted while hidden; visibility resets on reload.
- Source review found a fractional-width breakpoint gap. Changed the desktop condition to `width > 900px`. A 900.5 px iframe in local Brave matched desktop only; both panels collapsed and the rounded canvas width grew from 485 to 901 px.
- Keyboard verification exposed the existing canvas Space-to-pan handler preventing native button activation. It now leaves focused buttons, summaries, links, and button-role controls alone. Follow-up local Brave interactions confirmed Space collapses and reopens Layers, Space collapses Properties, and Enter reopens Properties, with focus retained and matching `aria-expanded` values.
- `npm run build` passed, including TypeScript checking. `npm run changeset:status` and `git diff --check` passed. Active diagnostics for the sidebar source/CSS files returned zero findings; the design detector returned no findings before the final keyboard-handler adjustment. Non-blocking Zod annotation warnings remain in the production build. No CI workflow or existing automated test command was present; no new test files were added.
- One independent source review covered security and responsive edge cases. No network, broker, authentication, Tailscale configuration, main runtime, or persistence behavior changed. Local Brave was headless because no display server was available; actual macOS rendering and screen-reader behavior were not verified.

The first browser verification attempt was blocked by a stopped development listener and captured no behavior. After restoring the task-owned server, the full browser pass above succeeded. Screenshots remain local verification artifacts.
## Issue #21: shorter file/page links

- Reproduced the long query-parameter URL on base `d85b975` in an isolated local
  Brave profile. The new `/file/<fileId>/<pageId>` path keeps full IDs and resolves
  the owning project from the validated workspace.
- `npm run check`, `npm run build`, `npm run changeset:status`, and
  `git diff --check` passed. Active LSP checks of both changed TypeScript modules
  returned no diagnostics. No CI workflows or automated test suite are configured.
- Real local Brave 151.1.93.136, headless: created multiple projects, files, and
  pages through the UI. Copied links opened exact destinations, including when
  another page was last saved. Refresh and project/file/page renames preserved
  the target. Back/Forward restored page/file destinations without extra entries.
- Valid legacy query links opened and canonicalized to the shorter path while
  preserving unrelated query parameters and fragments. A trailing slash opened
  the destination and normalized away, as documented.
- Wrong projects, missing pages, incomplete/duplicate query parameters, mixed
  path/query references, unknown IDs/routes, and a deleted page produced the
  persistent unavailable screen. Explicit recovery restored editor access.
  A separate empty browser profile also showed unavailable instead of opening
  another destination. Unavailable screens had no editor canvas or MCP session
  request. No browser errors were observed.
- Source security/edge review found no functional or security defects. Corrected
  one documentation length count. Transport, exact-Origin/Host checks, tickets,
  revision checks, and Tailscale configuration are unchanged.
- Limitations: no headed browser, Mac, Safari, Firefox, or distinct-origin storage
  test. No live MCP mutation test was performed. Main release and services were
  not rebuilt or restarted. Screenshots remain local verification artifacts.

## Issue #11: tool-specific canvas cursors

- Reproduced shared creation-tool crosshair and descendant cursor conflicts at
  base `13ed972`. The SVG now derives its cursor from the selected tool and
  active pan gesture. Artboard, rectangle, and ellipse use local static 32 px
  SVG icons with black strokes, white outlines, and crosshair hotspots at 8,8.
- `npm ci`, `npm run check`, `npm run build`, `npm run changeset:status`, and
  `git diff --check` passed. Active LSP check of Canvas.tsx returned no
  diagnostics; the UI detector returned no findings. Existing Zod build
  annotation warnings remain non-blocking. No CI workflow or automated test
  suite is configured; no test files were added.
- Independent local Brave verification covered toolbar and V/H/A/R/O/T changes,
  distinct creation cursor URLs, directional selection handles, drawing/hand
  overrides on handles, middle-button drag outside the canvas, inline textarea
  text cursor, Escape cancellation, and unaffected panels. No page errors.
- Local Brave ran headless because no display server was available. A separate
  dedicated headed Mac Brave profile loaded the development app over Tailscale.
  Rectangle and ellipse cursor styles resolved, and a new empty page retained
  the selected placement cursor. Space key events with explicit `code: Space`
  plus real pointer drags produced grab, grabbing, and restored tool states.
  Local verification also confirmed releasing Space before pointer-up keeps
  grabbing until the pan finishes. Space events were dispatched through the DOM,
  not delivered by a physical keyboard.
- Native cursor pixels are absent from browser screenshots, so OS-rendered
  hotspot alignment and light/dark cursor legibility remain visually unverified.
  Firefox and Safari were not tested. Inline editing was checked for its text
  cursor, not a change to its existing cancel/commit semantics.
- Independent security/edge review found no introduced security defects or
  blocking regressions. Existing limitation: pressing Space during an already
  active non-pan gesture changes cursor feedback but does not convert that
  gesture to a pan. This behavior is unchanged.
- Main runtime, broker authentication, exact-Origin/Host checks, tickets,
  revision checks, and Tailscale configuration were unchanged. Task-owned browser
  sessions, Mac profile, and loopback CDP tunnel were closed after verification.
## Issue #7: typography integration after main merge

The conflict resolution uses the current typography layout for content bounds and preserves sizing-mode resize handles. Local Chromium verification checked fixed-frame and content outlines, inline editing and Escape, centered Inter text with wrapping, and a long unbroken word overflowing horizontally rather than wrapping at character boundaries. An auto-width vertical resize followed by switching to fixed retained the stored width (570) while changing height. Production build and Changeset status passed. Firefox, Safari, macOS, and the full typography combination matrix were not checked in this pass.

## Issue #29: cursor refinement

Unified tool and directional resize cursors as static 32×32 SVGs with dark ink,
white contrast rims, explicit hotspots, and matching native fallbacks. Artboard,
Rectangle, and Ellipse share a plain crosshair with no tool badges. Canvas gesture logic, pointer
geometry, inline textarea cursors, and panel/control styling are unchanged.

- `npm ci`, `npm run build` including TypeScript checking,
  `npm run changeset:status`, and `git diff --check` passed. Existing Zod
  dependency annotation warnings remain non-blocking. No CI workflows or
  automated test script are configured; no new test files were added.
- UI detector returned no findings. Independent source review found no
  blockers or actionable security findings in CSS or all 11 static SVG assets.
- Dedicated headed local Brave on an isolated development origin verified
  toolbar and V/H/A/R/O/T switching; artboard/rectangle/ellipse/text creation;
  expected drawing positions and drag dimensions; Hand and middle-button pan;
  and Space release during an active pan. Space used DOM keyboard events,
  not physical key delivery.
- All rectangle corners and text east/north resize handles updated geometry
  with the correct computed directional cursor. Hand on a handle panned without
  resizing, and Rectangle retained its creation cursor on a handle.
- Inline textarea retained native text cursor and Escape cancellation. Toolbar
  and panel buttons retained pointer cursors. All 11 SVG requests returned 200;
  light/dark artwork regions resolved the expected styles. No page errors.
- Browser reported DPR 1. Browser screenshots omit pointer pixels. Window-scoped
  X11 capture also omitted the cursor, and a desktop capture attempt was black.
  These captures do not prove OS-rendered cursor appearance, hotspot alignment,
  light/dark legibility, or 2× scaling. Actual cursor-pixel acceptance remains
  pending. No macOS, Safari, or Firefox rendering result is claimed.

Network configuration, Tailscale, broker authentication, Origin/Host checks,
main release, and main services were unchanged. CDP stayed loopback-only;
verification used only task-owned temporary browser profiles.

### Creation cursor simplification

After the browser pass above, Artboard, Rectangle, and Ellipse were simplified
first to plain crosshairs, then to the native CSS `crosshair` cursor. Their three
SVG assets were removed. The prior 11-asset browser result describes the earlier
revision; eight custom SVGs remain. No browser pass is claimed for this follow-up.
## Issue #4: collapse all artboard branches

- Reproduced the missing bulk action in local Brave. Existing individual collapse controls preserved selection and canvas artwork.
- Added a labeled native Collapse all button to the Layers heading. It updates only session-local tree state for current-page artboards, retains individual toggles, and disables when no artboards remain expanded. Other pages retain their collapse state.
- `npm run check`, `npm run build`, `npm run changeset:status`, and `git diff --check` passed. The UI detector returned no findings. Active LSP checking found no TSX errors; CSS warnings concerned the existing reduced-motion rule. Existing Zod annotation warnings did not block the build. No automated test suite or CI workflow is configured; no test files were added.
- Independent local Brave verification passed click, Enter, and Space activation, individual reopening, empty-page disabled state, page switching, and root-level layer visibility. With a root rectangle selected, canvas SVG markup matched before and after collapse; selection and Properties stayed unchanged. Undo remained enabled, but complete history equivalence was not measured.
- Checked 1440 by 1000, 1000 by 800, and 390 by 844 layouts. The action remained within the viewport, mobile Layers remained accessible, and no document-width overflow or page errors appeared. Desktop/mobile screenshots were inspected.
- Brave ran headless after a headed launch found no display server. macOS, Firefox, and Safari were not tested. Hidden/locked artboards and undo safety received static review rather than browser coverage.
- Independent security/edge-case review found no actionable findings. Main runtime, MCP, authentication, Origin/Host checks, and Tailscale settings were unchanged. The isolated browser sessions were closed after verification.
## Issue #21 reopened: compact destination tokens

- `npm run build` passed, including `npm run check`; `npm run changeset:status`
  passed. No repository CI workflows or automated test script were present.
- Real local Brave verified 50-character compact paths (previously 71), exact
  destination reload, both legacy link formats, unrelated query/hash retention,
  persisted file rename, page switching, and Back/Forward destinations.
- Malformed/noncanonical tokens and unavailable IDs retained the recovery screen;
  explicit recovery reopened the saved workspace. No browser errors were observed.
- Independent security review and direct module probes found no introduced defects.
  Probes covered custom IDs, canonical encoding, mixed/duplicate destinations,
  extra segments, legacy links, and unavailable files.
- Browser ran headless in an isolated local Brave profile. macOS, Firefox, Safari,
  and live MCP transport were not tested. Active LSP probe was inconclusive;
  TypeScript compilation passed. Tailscale reported Running and self online;
  the dev endpoint returned HTTP 200 through localmachine. Network settings,
  authentication boundaries, and the running main release were unchanged.
## Issue #17: local review threads

- `npm ci`, `npm run check`, `npm run build`, `npm run changeset:status`, and `git diff --check` passed. No CI workflow directory or automated test script is configured; no test files or dependencies were added. Vite reported the existing non-blocking Zod annotation warnings.
- The UI detector returned no findings. An active LSP probe of eight changed/new review, Canvas, App, and MCP files returned zero diagnostics with complete probe coverage.
- Local isolated Brave created a layer-anchored thread through the UI. Literal script text displayed without execution. A reply survived selecting the same pin after focus left the textarea. With an unposted reply, an official SDK undo request was rejected as a manual edit. Saved locally was observed before closing that browser.
- Live official-SDK stdio calls exposed 48 tools and verified thread listing, full reads, resolve/reopen, stale-revision rejection, wrong/missing context rejection, missing-page errors, retained missing-layer feedback with status-write rejection, undo restoration, page-copy identity/anchor remapping, and complete-file JSON export/import. The checks passed again after the review corrections. Responses reported pending persistence separately from completed writes.
- Security/edge review found and prompted fixes for wheel events moving the camera from inside Comments, draft loss on navigation/reselection, and stale stored dimensions for auto-sized text anchors. The camera now leaves panel scrolling native, session drafts survive navigation, and anchor coordinates use measured text bounds. Unposted drafts also block MCP mutations and automatic release reloads.
- Exact-Origin/Host registration still returned a no-store browser ticket. Wrong Origin, wrong Host, cross-site metadata, and a missing browser header each returned HTTP 403 in a live broker probe. Transport/authentication code, Tailscale configuration, and main runtime were not changed or restarted.
- Independent Brave verification covered layer and position threads, replies, resolve/reopen, cross-page navigation, reload persistence, browser JSON download/import, page duplicate/delete/undo, missing-layer feedback and restoration, measured auto-width/auto-height anchors, and reply-draft retention across page/file navigation. Local Brave ran headless; a dedicated headed Mac Brave profile passed a bounded layer-comment smoke test through the documented loopback SSH tunnel. Task-owned browsers, tunnel, and Mac profile were cleaned up. No Safari or Firefox verification was performed.
- After adding the dedicated Comment tool, local Brave verified selecting it before any layer selection, clicking a component, posting the resulting layer-anchored comment, and returning to Select. At 390px the drawing controls fit without overlap; Comment then clicked empty canvas opened a position-anchored composer. A cancelable DOM wheel event over Comments was not prevented and left the camera unchanged. Physical mouse-wheel panel scrolling remains unverified; programmatic panel scrolling worked in the independent browser pass.
## Issue #10: page-specific MCP request activity

- `npm run check`, `npm run build`, `npm run changeset:status`, and `git diff --check` passed. Production build retains non-blocking Zod annotation warnings. No CI workflow or automated test command is configured; no new test files were added. Active LSP checks returned no diagnostics; the UI detector returned no findings.
- Luna 6 reproduced the missing page indicator using live MCP reads and a page mutation in an isolated local Brave profile. Final verification reloaded the connector and used SDK stdio calls against the development broker.
- Local Brave verified idle absence, pending screenshot presence, successful completion cleanup, failed-node-read cleanup, concurrent request independence, hiding on another page and showing again on return, Pause cleanup and Resume reconnection. The deferred navigation screenshot reached the documented 30-second timeout; separate calls verified successful screenshot output. Controlled image-decoding delays made pending requests observable and were removed afterward.
- A 375 by 700 viewport kept status in bounds. Reduced motion disabled the entrance animation. The overlay had pointer-events none. MCP PNG output contained artwork only. No page or console errors were observed after logs were cleared; original page was restored with persistence saved and no pending label.
- Sol 6.1 high source review found no actionable security or edge-case defects. Broker/CDP listeners remained loopback-only, Tailscale was online, and existing Origin/Host, ticket, revision, and manual-edit protections were preserved. Main services and network configuration were not changed.
- Limits: local Brave was headless because no display server was available. No Mac, Firefox, Safari, cross-file activity-isolation, or explicit cancellation runtime check was performed. Before and after images are local verification artifacts, not document artwork.

### Issue #10 visual follow-up

Replaced the text badge with six blue dots following the page artwork's leading corner, with viewport clamping. Each dot has one staggered 600 ms rise/fade entrance, then remains still. Routine save and connection header badges were removed; Pause/Resume moved to the File menu and failed-save warnings remain visible on mobile.

Local Brave with a real pending MCP screenshot verified six dots, finished non-looping animations at full opacity, header badge absence, artwork-relative positioning, and a 375 by 700 layout without document overflow. The File menu toggled Pause to Resume and back. A temporary failed-save state showed “Not saved” at mobile width without overflow and was restored afterward. Pending screenshot capture used a temporary image-decoding delay; no artwork was changed. Desktop and mobile screenshots were captured. Main and network configuration remain unchanged.

### Issue #10 motion revision

Replaced the waving ribbon with a fixed 3 by 3 lattice and diagonal light sequence. The final mark uses 5 px squares and wider horizontal spacing for a 37 by 25 px footprint. Only highlight opacity animates; the sequence completes within 2.04 seconds and never loops. Reduced-motion handling leaves the static blue mark visible.

Recorded the real development app in isolated local Brave using live MCP screenshots with a temporary image-decode delay. The recorded request completed successfully and presence cleared. An original-speed detail crop shows the light sequence, static pending, and clearing. A 375 by 700 browser check found nine dots, no document overflow, and animation-name none on all nine highlights under reduced motion. Additional calls to restored task tabs included one timeout, which is not counted as a passing screenshot check. Production build and diff checks passed; UI detector returned no findings. Browser verification covered the earlier 25 px circular-point layout; final square shape, wider spacing, and corresponding viewport clamp adjustments were source-checked, not browser-retested.
## Issue #38: multi-page retained memory and navigation stalls

- Five alternating state-profile pairs retained 10,080 distinct node objects instead of 810,000 with 100 pages, 10,000 layers, 100 edits and 80 undo entries. `node --expose-gc --import tsx scripts/profile-memory.mjs` records the workload and final invariants. These are Node.js allocation measurements, not equivalent browser-memory savings.
- Real local Brave checked the synthetic 12-page image-bearing file, page lifecycle/undo, separate file histories, image presence and save/reload. Five-run post-GC heap data and limitations are in [memory-profile.md](memory-profile.md). Browser-store identity probes were inconclusive and are not used as proof.
- Headed Mac Brave accessed the app directly over Tailscale. The sharing-only pilot reproduced navigation stalls. Five alternating navigation comparisons reduced median long-task count from 120 to 6 per 120 clicks after removing redundant whole-workspace parsing from navigation. Editing still produced long tasks; the private original project and production-build browser behavior remain unverified.
- Independent security/edge-case review found no blocking defect in sharing. Focused temporary verification passed 235 checks, including malformed commits, differential action sequences and frozen histories. The checks were rerun after the navigation-only change. That final navigation fast path was checked by the primary implementer, not a second independent review.
- `npm run build`, `npm run changeset:status`, `git diff --check`, and active TypeScript diagnostics passed. No repository CI workflow or test suite is configured. A reusable state profiler was added, not a new test suite.
- Dedicated local/Mac browsers and Mac tunnels were closed. Main runtime and network/authentication configuration were not changed. No claim of a confirmed unbounded leak or complete resolution of issue #38 is made.

## Issue 34: local service workspaces

Verified in the isolated development worktree, app 5206/private broker 4806, with synthetic documents only:

- `npm ci --ignore-scripts`, `npm run check`, `npm run build`, `npm run changeset:status`, and `git diff --check` passed. No CI workflow files were present. Build emitted dependency annotation warnings, not application errors.
- Official MCP SDK stdio client listed/created durable workspaces, read documents, created artwork, and renamed a file with `list_canvases` empty. Mutation returned `persistence: saved`. After stopping the owned frontend/broker, a standalone MCP owner read the same saved data from disk with no frontend or browser running. Session history correctly reset.
- Local Brave copied browser starter data explicitly, preserving IDs. Manual file rename survived reload. Independent MCP page rename appeared in an idle browser without changing its displayed Page 1 or URL. Stale MCP revision rejected without changing saved content.
- Real browser conflict: focused local rename draft, intervening successful MCP rename, then blur. Browser showed Not saved, retained its unsaved name, and blocked persistence. MCP retained the newer backend name. Unsaved synthetic workspace was backed up before reload.
- Persistent Pause survived reload, rejected workspace-target MCP reads, and removed associated canvases. Resume restored access. A real access request with an intentionally delayed browser response did not strand an intervening edit: subsequent save completed and MCP read it back.
- Explicit workspace URL overrode a different remembered workspace selection. An unavailable workspace URL showed chooser/error rather than editor fallback. Service IDs are included in canonical file/page links; legacy links require explicit selection.
- Exact-origin ticket request succeeded; reused ticket, cross-site Fetch Metadata, wrong Host, wrong Origin, missing browser credentials, and unauthenticated internal workspace requests returned 403.
- Security review found and fixed exclusive-creation, persistent-pause, autosave scheduling, shutdown-drain, page-context, and workspace-link issues. Handler page-context checks were also exercised independently in memory.
- Before/after, migration and conflict screenshots used temporary files, not repository assets. Verification used dedicated local Brave sessions with synthetic data.

Integration with issue 32 recovery guidance was checked in isolated local Brave: a synthetic service revision-conflict response during a rename showed Not saved and persistent conflict-specific backup guidance. This did not exercise an actual concurrent service save. The integrated build and changeset status passed.

Limits: the original baseline connection-timing sequence was inconclusive, not a reproduced connection bug. No performance claim or benchmark was made. No Mac-specific behavior was required or verified. Power-loss recovery, disk-failure injection and an abrupt multi-process shutdown race were not exercised. Headless screenshots/HTML import/visual exports are intentionally unsupported. Existing-owner attachment still requires coordinated restart when that owner exits; there is no automatic ownership transfer. This increment does not claim complete resolution of every operation requested by issue 34.
## Issue #37 broker-loss diagnostics

Controlled reproduction on the unchanged `70868bf` base intentionally sent SIGTERM to an isolated development broker owner while a second official SDK stdio client stayed attached. The broker listener disappeared, attached listing returned `fetch failed`, and the frontend stayed available. Restarting the owner restored browser registration, but old attached clients retained stale credentials. This establishes the diagnostic gaps after controlled owner exit, not the cause of the original reported shutdown.

After the diagnostic change, local Brave Headless 151 used a dedicated synthetic profile at `http://localmachine:5208`, with private broker port 4808. Supported launchers used `CAVAS_APP_PORT=5208 CAVAS_MCP_PORT=4808 npm run dev` and the corresponding development MCP launcher. Official SDK probes exercised the actual stdio tools.

- A synthetic file, artboard, and text reached `persistence: saved` and survived browser reload.
- After controlled owner SIGTERM, attached `get_capabilities` still returned local information. `list_canvases` reported transport unavailability with coordinated recovery instructions. A document read included the unknown-outcome warning.
- After restoring the isolated owner, old attached list/read calls reported rejected credentials rather than JSON parsing errors. Fresh clients discovered the automatically reconnected browser and read its saved document.
- Invalid canvas and stale-revision errors remained specific. No mutation was retried.
- Missing browser bootstrap header, wrong Origin, and unauthenticated internal access each returned HTTP 403.
- Sol security/edge-case review found no blocking security defects. Its cancellation-guidance finding was corrected: pre-aborted calls fail before dispatch, and caller cancellation does not prescribe owner recovery. The SDK pre-abort probe rejected locally, so the server-side cancellation branches were not dynamically verified.
- `npm run build` passed, including `tsc --noEmit`. Existing Zod annotation warnings remained. `git diff --check` passed. No CI workflow or new test file was added.

No automatic retry, ownership takeover, metadata recovery, or browser-storage change was introduced. Verification did not establish an in-flight mutation's outcome, force the response deadline/body-interruption paths, or reproduce every crash scenario. Mac Brave was not needed for this server-side diagnostic change. No editor UI changed.

Final verification stopped only its identified development app, broker, and dedicated Brave session; ports 5208, 4808, and 9228 were free afterward.
## Issue #32: persistent save recovery and diagnostics

The original concurrent-editing storage failure remains unconfirmed. This change addresses independently reproduced notification and diagnostic gaps, not that unknown cause.

- Injected a synthetic `QuotaExceededError` into the real IndexedDB write path in isolated local Brave. Before the change, its name/message were discarded and a later notification replaced recovery guidance. After the change, recovery guidance remained after an 8.5-second wait and a successful MCP mutation notification, with bounded error details available separately.
- Independent Brave/official-SDK verification confirmed additive `persistenceDetails` with write failure and `blocked: false`. Restoring the native transaction method and making a new edit saved successfully; reload retained the recovered name and cleared the failure.
- Two tabs on the isolated origin exercised a real stale-save conflict: the stale tab kept its unsaved state with `blocked: true` and backup/reload guidance. Direct IndexedDB read retained the other tab's saved value and revision, without overwrite.
- Invalid JSON import errors remained visible and dismissible alongside persistent recovery guidance. Dismissing the action message did not clear the storage failure. The recovery action opened Projects, and a downloaded complete workspace backup parsed as version-1 `open-cavas-workspace` JSON.
- At 390 by 844, document/body widths matched the 390px viewport. Desktop and mobile screenshots use synthetic data. No Firefox, Safari, physical-device, or Mac-specific run was performed.
- `npm run build` (including TypeScript), `npm run changeset:status`, and `git diff --check` passed. Active diagnostics returned no findings for five changed TypeScript/TSX modules. UI detector returned no findings. Existing Zod dependency annotation warnings remain non-blocking; no CI workflows or new test files were present.
- Security/edge review found notification suppression of unrelated action errors in the first patch; this was corrected with an independent dismissible row inside the persistent notice, then verified by actual invalid-JSON upload. Transaction, save queue, conflict, broker, Origin/Host, ticket, and mutation retry behavior remain unchanged.

## Issues #32, #34 and #37: backend-native operations and broker recovery

- After integrating installed fonts, Home, and PDF export, `npm ci --ignore-scripts`, `npm run check`, `npm run build`, `npm run changeset:status`, and `npm audit --omit=dev --audit-level=moderate` passed. Official SDK calls verified browser and native PNG screenshot metadata, native font substitution, browser-free artboard creation and HTML import, stale-revision rejection, and durable read-back after restarting the task-owned broker. Missing browser header and wrong Origin returned HTTP 403. PDF workspace targets reject explicitly; browser PDF remains separate. No full broker-recovery or concurrency campaign was repeated on the integrated tree.

Verified in an isolated feature worktree with synthetic workspaces:

- `npm ci --ignore-scripts`, `npm run check`, `npm run build`, `npm run changeset:status`, and `git diff --check` passed. `npm audit --omit=dev` reported zero vulnerabilities. No repository CI workflow or test suite is configured; no new test files were added. Existing Zod bundle annotation warnings remain.
- Official SDK workspace-target calls imported restricted HTML, exported JSON/SVG/HTML/JSX, measured text, and captured PNG with no connected canvas. Navigation to `about:blank` and closing all task application tabs did not prevent saved mutations or subsequent read-back. Reopening/reloading showed saved artwork.
- Two SDK clients writing the same durable revision produced one saved mutation and one conflict. Two live canvas writers retained the losing edit in memory with failed/blocked persistence and backup guidance. A separate local Brave pending text edit versus backend page mutation retained the unsaved text in a downloaded workspace backup. No silent overwrite was observed. These controlled conflicts do not establish the original issue #32 storage-failure trigger.
- Local Brave backend edits to another page preserved browser page and selection across idle refresh. Paused agent access rejected MCP mutation and persisted after reload; manual browser editing still saved and survived reload. Access was resumed after verification.
- Local Brave artwork content/layout matched the native capture. Dedicated Mac Brave opened the same synthetic workspace over the direct Tailscale route, preserved selection during backend edits and idle refresh, and loaded artwork. Mac control used a task-owned profile and loopback CDP tunnel; profile, tunnel and task directory were cleaned up. Mac-specific save-race and paused-access checks were not run. Native/browser pixel identity is not claimed; unavailable backend system fonts explicitly resolve to bundled Inter.
- Controlled graceful owner shutdown allowed an attached SDK client to recover on its next request. Two simultaneous official SDK starters both connected after bounded metadata-publication waiting. Killing only the identified development workspace daemon left the frontend at HTTP 200 and recovered a fresh authenticated broker. Browser reconnection and workspace read-back succeeded without replaying a design request. Main runtime and network policy were untouched.
- Independent security/edge review found dropped embedded images and a concurrent startup race. The corrected native pipeline preserved PNG/JPEG/WebP/GIF artwork, checked by decoded center pixels. Truncated PNG, forged GIF frame dimensions, excessive decoded GIF pixels, and SVG disguised as raster were rejected. Raster normalization now uses bounded Sharp/libvips decoding before native SVG capture.
- Wrong Origin/Host, missing browser header, cross-site Fetch Metadata, reused ticket and unauthenticated internal workspace requests returned HTTP 403. Valid exact-origin ticket issuance and its first workspace use succeeded. Scripts, event handlers, remote image sources and file-URL CSS were rejected by HTML import.

Remaining limits: no power-loss or disk-failure campaign, no original production shutdown/storage cause established, and no forced cancellation during an active native rasterization. Recovery never replaces invalid metadata, a live owner or an unverified listener, and never replays dispatched design requests. Native rendering is bounded but not a process-isolated hostile-file sandbox. Browser conflicts intentionally require backup/reload instead of automatic merging.

## Issue #16: installed font families

- After integration with PDF export and Home, local browser verification entered an unavailable system font, confirmed the fallback message, exported a PDF successfully, and verified the requested family persisted after reload. PDF continues to reject unavailable bundled fonts rather than mislabeling missing system fonts as bundled.
- Reproduced the closed five-family picker in isolated local Brave with Comfortaa installed and browser-detectable. The implementation replaces it with literal family-name entry and existing-family suggestions. Text, font tokens, JSON, MCP edits, and restricted HTML share validation.
- Real local Brave at `http://localmachine:5206` verified Comfortaa entry/Enter commit, visible rendering and detection status, undo/redo, reload, and missing-name blur commit with explicit Arial fallback. Requested missing names survived a JSON download and UI import. At 800 by 700, Properties and the font field remained accessible by scrolling.
- SVG retained requested metadata. Browser rendering verified lowercase/uppercase Inter aliases resolve to the bundled canonical family, embed identical bytes, and produce identical PNG output. Lowercase Bricolage Grotesque at weight 900 was rejected. Punctuation/quotes/backslashes stayed literal without injected XML attributes or observed execution/resource requests in bounded probes.
- Live official-SDK `get_fonts` queries returned browser detection for Comfortaa/Inter and missing-font status, while workspace-target queries remained unverified. Font token definition/application and node read-back succeeded. These browser mutation receipts were pending; token persistence after reload was not separately verified. Screenshot metadata preserved `__proto__` in its entry array.
- Focused inline Node probes exercised model/token/MCP name validation, invalid inputs, JSON round trips, CSS string escaping and stack rejection, bundled aliases/weight constraints, headless status, and query limits. Actual JSX exports transpiled with TypeScript and rendered through React with literal family metadata and no injected elements/handlers in tested payloads. Additional real Brave probes verified CSSOM/HTML decoding of ampersand, colon, quote, and backslash CSS escapes.
- Independent security/edge-case review identified bundled alias handling, valid punctuation names, and prototype-like screenshot metadata loss. All three were corrected before final browser verification. Family names never choose fetch sources or enumerate local fonts. Tailscale remained online; the app responded through localmachine, private broker stayed on loopback, and missing bootstrap header, wrong Origin, wrong Host, and unauthenticated internal access each returned HTTP 403.
- `npm run build` (including `tsc --noEmit`), `npm run changeset:status`, and `git diff --check` passed. Active LSP probes checked all 12 changed TypeScript/TSX paths with zero diagnostics. UI detector returned no findings. Existing Zod dependency annotation warnings remain nonblocking. No CI workflows or new test files exist for this increment.

Limits: metric comparison is not installed-file, glyph, alias, or per-style proof. System fonts are not embedded; another device/SVG renderer may substitute them. Detection cache resets on reload, not automatically after operating-system font installation. No Mac-specific behavior, exhaustive injection audit, or font-file permission flow was exercised. Main release and its services were not rebuilt, restarted, or replaced.

## Issue #18: paginated PDF export

- After integrating Home and the introductory canvas, `npm run build`, `npm run changeset:status`, and `npm audit --omit=dev --audit-level=moderate` passed. A local browser opened the introductory canvas and completed a current-page PDF export. A browser probe using 67 references to one valid PNG exceeded the 32 MB image-reference limit and received the expected error before SVG rasterization. The previous PDF artifact checks below were not repeated on the integrated branch.
- `npm run build`, including `tsc --noEmit`, `npm run changeset:status`, `npm audit --omit=dev --audit-level=moderate`, and `git diff --check` passed. Audit found zero vulnerabilities. Active diagnostics covered eight changed TypeScript/TSX modules with zero findings. The UI detector returned no findings. Existing non-blocking Zod annotation warnings remain. No CI workflow or automated test command is configured; no test files were added.
- Local Brave downloaded selected-artboard PDFs with two pages at 150 × 135 and 142.5 × 131.25 points. Explicit no-selection page export produced one 382.5 × 138.75 point page. `pdfinfo` accepted these files and `pdftoppm` rendered their pages. At 390 × 844, the accessible PDF action remained available, document width was 390, and the download still contained two pages.
- Official SDK stdio calls exposed `export_combined_pdf`, returned a real base64 PDF, and retained document page order when artboard IDs were reversed. Explicit page scope worked; omitted, unknown, duplicate and empty IDs, and a workspace-only rendering target, were rejected.
- The final implementation exported a rich two-artboard document with Inter/Bricolage Grotesque weight 620 and static PNG, JPEG and WebP layers. Downloaded PDF pages measured 480 × 375 and 240 × 375 points. Rendered pages were visually inspected for text, artboard clipping, rotated translucent images, and artboard backgrounds.
- Real browser button activation on synthetic empty, hidden-artboard, oversized, GIF and corrupt-PNG documents showed actionable errors. A temporary anchor-click counter observed zero download initiations in all five failure cases. Original synthetic artwork and native methods were restored afterward.
- Security/edge review found missing aggregate source-image budgeting and a UI-export gap in the automatic release reload guard. Both were corrected. Browser preflight rejected three distinct 16 MP source headers before any image decode, deduplicated identical sources, and rejected concurrent export. A bounded browser probe held image decoding while the real release watcher saw a newer synthetic main manifest: a saved/ready workspace remained loaded after 6.5 seconds with export active. It stayed loaded 1.2 seconds after export completion within the idle grace period. The watcher and all overrides were then removed; no real release was changed.
- A dedicated headed Mac Brave profile accessed the isolated development app over Tailscale. UI export produced an application/pdf Blob, captured before the native download click, with two pages at the expected dimensions according to `pdfinfo`. This verifies Mac rendering/bytes, not native download completion. The earlier remote download lookup failed and is not a passing download check. Dedicated Mac browser and loopback-only CDP tunnel were closed afterward.
- Main services, authentication, Origin/Host checks, browser tickets, mutation revisions, and Tailscale configuration were unchanged. Only the task-owned development runtime was restarted for new server schemas.

Limits: PDF is lossless 2× raster artwork on white, not vector/selectable text or tagged accessible PDF. No Firefox/Safari, physical print, full 32-page/file-size saturation, image-decoder peak-memory measurement, or navigation-during-rendering check was performed. The corrected guard paths received primary verification, not a second independent review. See [PDF export](pdf-export.md) for supported resources and budgets.

### PDF export dropdown follow-up

The header now has one Export disclosure instead of separate SVG and PDF buttons. Both rows name their current scope; JSON backup and the SVG keyboard shortcut keep their existing behavior.

Real local Brave verified current-page and selected-artboard labels, normal Tab/Enter navigation, Escape restoring focus without clearing selection, outside-click dismissal, and a 390 by 844 menu within the viewport. Actual downloads produced SVG, a one-page current-page PDF, and a two-selected-artboard PDF; `pdfinfo` confirmed page counts. Browser errors were empty. Build/TypeScript, Changeset status, diff checks, and the UI detector passed. Active LSP rechecks were inconclusive for two files rather than proof of clean diagnostics. This follow-up did not rerun Mac rendering, MCP, failure-budget, or full-resource-limit checks; the PDF renderer and its concurrency/reload guards are unchanged.

Before/after screenshots contain only synthetic starter artwork and were captured outside the checkout for PR evidence. No screenshot was added to Git.

## Issue #3: Home destination

- Baseline local Brave confirmed that the editor had no Home control and Projects was only a dialog. The selected workspace now opens Home at `/`, retaining its workspace query identity. Opening or creating a file enters the editor; its labeled Home control returns to the shared library.
- Independent local Brave verification covered project creation without leaving Home, file creation/opening, file and rectangle edits surviving Home/reopen and reload, separate file histories, Back/Forward, Home/file refresh, the compact Projects dialog, no-match search, deletion confirmation/cancel, and project backup download. Editor shortcuts did not run on Home. Malformed file links and duplicate destination/workspace parameters rejected without silently opening another file. Browser error collection was empty.
- Local and headed Mac Brave checked desktop and 390 by 844 layouts. Mac access used the existing Tailscale route, a dedicated temporary browser profile, and loopback-only CDP forwarding. Home and editor had no document-width overflow at 390 px. Mac file rename, artwork reload, and undo across Home navigation passed.
- Security/edge-case review found focused blur-only drafts could be lost on history navigation to Home. Navigation now blurs the focused field before changing its original file/node context. A separate local Brave pass verified focused document name, layer name, numeric width, and on-canvas text across Back/Home/Forward; saved text also survived reload. Home imports now use the browsed project rather than the last editor project. A controlled delayed file read cancelled after navigation without importing or redirecting the new destination.
- `npm run check`, `npm run build`, `npm run changeset:status`, and `git diff --check` passed. The UI detector returned no findings. Active diagnostics found no TypeScript errors; auxiliary static rules still flag trusted URL constructors and the repository's extensionless imports. Existing dependency annotation warnings remain. No CI workflow or test script is configured; no new test suite was added.
- No broker, authentication, runtime, Tailscale, or main-service configuration changed. Home unmounts editor shortcuts and browser registration through existing cleanup. Live MCP canvas disconnect/reconnect was not exercised; canvas IDs can persist across re-registration, so callers must rediscover availability and context. Reload before a pending save completes remains an existing limitation. The final draft/import fixes were browser-checked by the implementer, not a second security review.

## Home and introductory canvas integration

- After merging the introductory canvas, local browser verification confirmed that creating an introductory workspace opens its canvas directly, Home lists the file, and reopening it returns to the editor. Creating an empty workspace opens Home with an Untitled file. `npm run build`, `npm run changeset:status`, and `git diff --check` passed on the combined branches.

## Introductory canvas

- The initial separate welcome page was replaced with an editable seed after clarification. Its prior screenshot and behavior are not part of the shipped feature.
- `npm run check`, `npm run build`, `npm run changeset:status`, and `git diff --check`: passed. Build retains existing Zod annotation-placement warnings.
- Chromium through `localmachine`: Start with introductory canvas created a real Welcome to Open Cavas file containing two artboards and 17 native layers. The document passed its schema; measured text bounds stayed inside parent artboards.
- Selected the seeded circle through Layers and moved it with ArrowRight. Edited the seeded text through Properties. Both changes survived reload, with 17 layers retained.
- Create empty workspace still produced zero layers. An existing workspace opened by its direct URL retained its one artboard and Untitled file name without seeded layers being inserted.
- Desktop screenshot at 1920 × 1080 shows both artboards inside editor chrome. At 390 × 844, fit/pan/zoom and responsive panels remain available; document width stayed 390 px. Fitting both boards makes text small, so reading requires zooming, as with other canvas artwork.
- Browser error capture returned no errors in the inspected seed session. Screenshot is committed at `docs/images/introduction.png`; seed and storage behavior are documented in `docs/introduction.md`.
- No test files or CI workflow were added. No repository CI workflow exists. Verification used a separate feature runtime; stable main was not rebuilt, restarted, or published. Visual and code review were single-agent passes.

## Issue #50: disk destination and browser recovery

- Baseline at `807bfd7` already saved service workspaces to private JSON and exposed the same saved file in a second isolated Brave profile. The older release's browser-only behavior was not reproduced. This change retains `.cavas/runtime/<profile>/<ports>/workspaces/` as the canonical store, without moving existing data or creating a competing directory.
- Local Brave verified fresh-profile copy/backup disabled, explicit empty/unreadable recovery messages, unavailable workspace without substitution, actual server save directory, and selected workspace ID/JSON path in Home/Projects. Synthetic IndexedDB and legacy-localStorage copies preserved workspace identities and left original raw browser records unchanged. Unreadable-data guidance survived list refresh.
- A controlled response loss after a successful create from a missing-workspace link retained the new target in the URL. Reload opened that saved workspace without replaying creation. Before dispatch, explicit creation now changes the target, rather than leaving the stale link authoritative.
- Desktop 1440 by 1000 and mobile 390 by 844 had no document-width overflow. A 160-character workspace name exposed chooser overflow, then wrapped correctly after correction. At 390 by 500, expanded destination details scrolled internally in Home and Projects, retaining visible file-list area. Independent review identified the footer height issue and the preexisting uncertain-create link gap; the implementer fixed and browser-checked both.
- Dedicated headed Mac Brave reached the same development app over Tailscale, opened the synthetic file, displayed its save path, retained it on reload after the task-owned runtime restarted, and showed no document-width overflow at 390 by 844. Personal profiles were not used. CDP forwarding remained loopback-only.
- A direct security probe reproduced a preexisting symlink alias exposing workspace JSON despite lexical Vite deny globs. The new realpath guard returned HTTP 403 for directory/file aliases, public aliases, direct/encoded `.cavas`, `/@fs/`, `?raw`, and `?url`. A build with a synthetic public alias to private state failed before copying it; the normal build passed after removing that fixture. Preview and a temporary release-shaped `.cavas/releases/snapshot` build served the app at HTTP 200 while denying private aliases at HTTP 403.
- Missing/wrong Origin, wrong Host, missing custom header, cross-site Fetch Metadata, reused ticket, and unauthenticated internal requests returned HTTP 403. Fixed storage metadata returned only the canonical directory with `Cache-Control: no-store`; arbitrary path input was rejected. Broker remained loopback-only, Tailscale stayed active, and main runtime/release identity did not change.
- Five synthetic workspace records retained identical SHA-256 hashes across a source build and task-owned frontend/broker restart; browser read-back also succeeded. One task-owned long-name fixture was removed after its layout check. No main release was prepared or restarted.
- `npm run check`, `npm run build`, `npm run changeset:status`, `npm audit --omit=dev --audit-level=moderate`, and `git diff --check` passed. Audit reported zero vulnerabilities. Existing Zod dependency annotation warnings remain. The UI detector returned no findings before final small layout corrections. Active diagnostics did not find TypeScript errors; two auxiliary throwing-call rules and some silent-on-clean LSP results were not clean confirmations. No CI workflow or test command is configured; no test files were added.

Limits: original affected browser data was not inspected, so original file deletion or recovery remains unconfirmed. No actual main release rollout, power-loss/disk-failure campaign, ticket-expiry timing, or new concurrent-save campaign was performed. Existing revision and atomic-save logic is unchanged. The final alias guard and review follow-ups were checked by the implementer, not a second independent reviewer. Browser backup download contents were not separately checked.

## Shared workspace layout

The structure-only migration separates `apps/web` and `apps/local-service` from
`packages/document`, `packages/engine`, and `packages/mcp`. No document, storage,
or tool-schema migration is included.

- `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm run build`, and
  `pnpm run changeset:status` passed with the pinned toolchain. The check command
  includes source import boundaries and per-package TypeScript checks. Shared
  packages compile without DOM libraries.
- All 51 MCP tool definitions and input schemas matched the pre-move baseline.
  Existing saved workspace IDs and document content reopened unchanged. Native
  SVG, PNG bytes, font status, and capture metadata matched the baseline after
  excluding the durable revision advanced by browser reopen.
- The 1280 × 639 browser composition matched the baseline pixel-for-pixel after
  aligning viewport, camera, and pointer state. Browser text editing, undo,
  redo, acknowledged saving and reload retained the expected content. At
  390 × 844, Layers remained accessible and document width stayed 390 pixels.
- Live SDK calls exercised browser PNG and two-artboard PDF output, headless
  project/file/page creation, inert HTML import, text edits, stale-revision
  rejection, undo/redo, complete-file JSON round trip, page duplication/deletion,
  and undo restoration. Closing the browser and restarting the broker preserved
  the complete workspace backup byte-for-byte; native PNG and SVG remained
  available without a frontend.
- Direct and symlink-aliased `.cavas` requests returned 403. Wrong-Origin browser
  registration returned 403. A public symlink to private state caused the build
  to fail, then the alias was removed. Main ports remained reserved.
- A separately installed snapshot under `.cavas/releases` passed the check/build
  commands and served production HTML, assets, fonts and runtime metadata through
  an isolated preview. Its private-path request returned 403. Generated dev MCP
  configuration matched the baseline. Missing-release and feature-branch release
  attempts failed safely. Stable main processes and release pointer were not
  changed.

Verification used Chromium on Linux with synthetic local workspaces. No new test
files were added. Full main publication/restart, desktop packaging, hosted web,
and other browsers were not exercised. The existing snapshot layout remains an
explicit launcher compatibility path, not a claim that a main rollout occurred.

## Contextual comments (2026-11-16)

- `pnpm run check` and `pnpm run build` passed with the pinned toolchain. The Impeccable mechanical detector reported no findings for the changed editor surfaces.
- Chromium at 1280 × 800 and 390 × 844: Add comment leaves the canvas unobstructed until placement. Layer and empty-position placement open a compact composer; viewport-edge placement remains inside the canvas. Hover previews identify the same layer used by the resulting composer; empty canvas has a distinct position hint. The native crosshair cursor was confirmed through computed style.
- Posted a comment and reply with Ctrl+Enter, resolved/reopened the thread, and exercised status undo/redo. Escape preserved an unposted draft, reopening Review restored it, and Cancel discarded it. Escape returned focus to the canvas. Narrow Layers/Properties/Review panels opened mutually exclusively without document-width overflow.
- Live development SDK reads returned the posted thread and both messages from the browser and durable workspace. Stale status writes and writes while an unfocused hidden draft existed were rejected. The complete JSON backup retained thread IDs, anchor and messages without unsent text. Browser reimport appended an editable file with all 17 original layers and the same posted feedback.
- Schema, review commands, history, persistence and export formats were not changed. These checks cover their use by the revised interface; no new test files were added. Touch hardware, other browsers, persistence-failure injection and a new full cross-page/missing-anchor regression run were not exercised. Main was not released or restarted. Evidence stays outside Git; public screenshot upload and PR publication were not requested.

## Inspector action clarity (2026-11-16)

The labeled Duplicate, To front and Delete actions were exercised in Chromium with synthetic artwork. Duplication increased 17 layers to 18; undo restored 17. To front moved the chosen rectangle to the end of drawing order, and undo restored the prior order. Deletion reduced 17 layers to 16; undo restored 17. The shared commands and document format are unchanged. Type checking and production build passed with the complete editor change.

## File and workspace context (2026-11-16)

File-menu Escape closed the menu and returned focus to its summary. Clicking outside closed it; focus leaving the menu also uses the same close path. Narrow menu layout, updated storage/backup Help copy and desktop workspace/page identity were inspected in Chromium. Existing save, export and agent-access actions were preserved. `pnpm run check`, `pnpm run build` and `pnpm run changeset:status` passed for the complete change.
