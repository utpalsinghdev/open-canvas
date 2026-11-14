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

