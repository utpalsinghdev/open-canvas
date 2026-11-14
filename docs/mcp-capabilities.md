# MCP capability coverage

Open Cavas owns its document model and MCP implementation.

## Implemented and live-verified through MCP

- Official SDK stdio initialize, tools/list, tools/call, tool errors, and browser targeting. 27 tools exposed.
- Live document/tree/node/style/selection reads with stable layer identity.
- Artboard creation, batch text/rectangle/image creation, text edits, property changes, rotation, artboard-and-child movement, duplication, deletion, reordering, and selection.
- Undo/redo through the same document history as manual edits.
- Restricted inert HTML import into editable layers. A background and text label were created and read back.
- Document rename, blank-document creation, complete JSON export and reopening.
- SVG, standalone SVG-based HTML, and SVG JSX export. PNG artwork capture returned as MCP image content.
- Persisted design token definition/read-back and explicit token application.
- Manual text changes visible through MCP, stale-revision rejection, and focused manual-edit protection.
- Wrong pairing code, wrong Origin, and missing Origin rejected with HTTP 403.

Live verification used synthetic artwork in a dedicated browser session. Source-boundary checks and remaining checks are recorded in `verification.md`.

## Implemented capabilities and limits

- Layer types are the current Open Cavas primitives, not arbitrary DOM/CSS.
- HTML uses a documented static subset and restricted block layout. It is not arbitrary page import, flex/grid, rich text, or computed browser layout.
- HTML/JSX output represents SVG artwork, not semantic application UI or JSX from an original source tree.
- Screenshots capture supported artwork, not the editor window or a native Mac window.
- Tokens support color, number, and font metadata with literal assignment. No dynamic binding, theme inheritance, breakpoint/container token system, or UI token panel.
- New/open/rename/export operate on this tab's document, not a persistent multi-file library.

## Not implemented

Multi-page management, third-party editable design document compatibility, auto layout, arbitrary vector paths, responsive web-layout semantics, dynamic theme tokens, shared server-side documents, multiplayer conflict merging, headless editing, hosted HTTP MCP are unsupported.

No placeholder tools claim those capabilities. `get_tree` honestly reports the one existing page. Adding a transport does not create editor features that the document model cannot represent.
