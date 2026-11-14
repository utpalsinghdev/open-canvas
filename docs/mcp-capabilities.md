# MCP capability coverage

The earlier read-only reference project was `/home/utpal/work/paper-custom-bridge`. Its `docs/capabilities.md` and coordination record were inspected without modifying that project or Mac helper. The reference thread was also read. That work established window/Accessibility discovery, not stable document identity and complete live editing. Open Cavas now owns its document model, so its MCP implementation does not reuse that fragile UI transport or depend on Paper quota.

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

Live verification used synthetic artwork in a dedicated browser session. It did not mutate Paper or the earlier portfolio document. Source-boundary checks and remaining checks are recorded in `verification.md`.

## Implemented but narrower than Paper

- Layer types are the current Open Cavas primitives, not arbitrary DOM/CSS.
- HTML uses a documented static subset and restricted block layout. It is not arbitrary page import, flex/grid, rich text, or computed browser layout.
- HTML/JSX output represents SVG artwork, not semantic application UI or JSX from an original source tree.
- Screenshots capture supported artwork, not the editor window or a native Mac window.
- Tokens support color, number, and font metadata with literal assignment. No dynamic binding, theme inheritance, breakpoint/container token system, or UI token panel.
- New/open/rename/export operate on this tab's document, not a persistent multi-file library.

## Not implemented

Multi-page management, Paper document compatibility, auto layout, arbitrary vector paths, responsive web-layout semantics, dynamic theme tokens, shared server-side documents, multiplayer conflict merging, headless editing, hosted HTTP MCP, and full official Paper API/tool-schema compatibility.

No placeholder tools claim those capabilities. `get_tree` honestly reports the one existing page. Full Paper MCP parity is not claimed. Adding a transport does not create editor features that the document model cannot represent.
