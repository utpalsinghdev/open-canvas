# Document format

The authoritative schema is `packages/document/src/model.ts`. TypeScript types derive from it. Current downloads use a version-2 multi-page file, described below. Version-1 single-page data remains accepted as a legacy import and used internally as the active-page projection. Both use `<name>.cavas.json`.

```json
{
  "version": 1,
  "name": "Untitled",
  "nodes": []
}
```

## Common layer fields

Every layer has `id`, `kind`, `name`, `parentId`, `x`, `y`, `width`, `height`, `fill`, `opacity`, `rotation`, `hidden`, `locked`, and `radius`.

- IDs must be unique, 1 to 100 ASCII letters, digits, underscores, or hyphens.
- Names are at most 160 characters. Document names must not be empty.
- `parentId` is null or the ID of an artboard in the same document. Artboards cannot have parents.
- `x` and `y` are absolute world coordinates, each between -100,000 and 100,000.
- Width and height are between 1 and 20,000. Radius is between 0 and 10,000.
- Fill is a six-digit hexadecimal color including `#`.
- Opacity is between 0 and 1. Rotation is degrees between -360 and 360. Artboard rotation is always zero.
- Hidden and locked are booleans. Children inherit those restrictions from their artboard.

## Variants

- `artboard`: a clipping frame. `parentId` must be null and rotation zero.
- `rectangle`: filled rectangle, with optional rounding through the required radius field.
- `ellipse`: ellipse inside its width and height.
- `text`: adds `text`, `fontSize`, `fontFamily`, `fontWeight`, `lineHeight`, `letterSpacing`, `align`, `wrap`, and `sizing`. Content is at most 10,000 characters and size is 6 to 500. Families are literal names of 1 to 100 characters, trimmed at validation. Control characters and URL-like values are rejected. Punctuation, Unicode, quotes, and backslashes remain literal through CSS-string and XML escaping. Arial, Georgia, Courier New, Inter, and Bricolage Grotesque are suggestions, not a closed enum. Inter and Bricolage Grotesque variable font files are bundled with their SIL Open Font License texts. Weights are integers from 100 to 900, constrained to the bundled font's supported range (Inter 100–900; Bricolage Grotesque 300–800, matched case-insensitively). System families accept 100–900 without claiming each weight is installed. Legacy string weights such as `"500"` are normalized to numbers. `lineHeight` is a unitless multiplier from 0.5 to 4; `letterSpacing` is pixel tracking from -100 to 100. Alignment is left, center, or right. Newlines remain explicit; optional wrapping uses measured word boundaries. Sizing is `fixed`, `auto-height`, or `auto-width`. Missing typography fields in older documents default to Arial, weight 500, line height 1.2, zero tracking, left alignment, no wrapping, and fixed sizing.
- `image`: adds `src`, a base64 PNG, JPEG, WebP, or GIF data URL. SVG and external URLs are rejected. Images crop to the frame with centered aspect-fill behavior.

## Order and validation

The node array controls paint order among siblings. Artboard children are grouped under their parent for rendering and export even when other roots appear between them in the array. A document can have at most 1,000 nodes.

Import rejects malformed JSON, unsupported versions, invalid geometry, duplicate IDs, and missing or non-artboard parents. It never executes imported content. Unknown object properties are dropped during parsing. UI JSON import is limited to 40 MB. The file picker additionally limits each newly added raster image to 2 MB and verifies that the browser can decode it.

Text font availability distinguishes the saved request from its resolved rendering family. Bundled Inter and Bricolage Grotesque resolve case-insensitively to canonical names and load only fixed application assets, with an eight-second network deadline. Browser system fonts are detected by comparing a sample's canvas widths against three generic fallback families. This works on HTTP tailnet origins without local-font enumeration or a secure-context permission prompt. It is a heuristic: metric-compatible substitutes, missing glyphs, aliases, installed weights/styles, and changes to system fonts during a session cannot be proved. Reload after installing a font; the session-only detection cache is bounded to 256 names.

Reads report requested/resolved family, fallback, availability (`available`, `unavailable`, `unverified`, or `loading`), and detection method (`bundled`, `browser-metrics`, or `unverified`). Undetected or unavailable fonts render and measure with Arial without rewriting the saved request; Arial itself remains browser-dependent. Without a browser, availability is unverified and text dimensions are unmeasured. System font files are never read, uploaded, or embedded. SVG retains the requested name in `data-font-family`, uses the resolved family for rendering, and embeds only loaded bundled font bytes. System-font appearance can differ on another device or SVG renderer. No document name selects a font source or triggers a font fetch.

Text layout exposes resolved bounds, content dimensions, and overflow, not automatic clipping to the text box. Wrapping breaks at whitespace, not inside long words; artboards remain clipping containers.

The optional `tokens` field defaults to `{}` when loading earlier version-1 documents. It is a dictionary of up to 200 token names. Names begin with an ASCII letter and contain at most 80 letters, digits, underscores, or hyphens. Each value is `{ "type": "color", "value": "#d9f171" }`, `{ "type": "number", "value": 16 }`, or `{ "type": "font", "value": "Arial" }`. Numbers are finite and bounded by -100,000 and 100,000; fonts use the same literal family-name validation as text. Tokens are metadata with explicit literal application, not dynamic node references.

Undo history, current selection, viewport, agent pairing, state revision, and panel state are not serialized. SVG exports do not reopen as editable Open Cavas documents.


## Version-2 multi-page files

```json
{
  "version": 2,
  "name": "Website",
  "tokens": {},
  "pages": [
    { "id": "desktop", "name": "Desktop", "nodes": [] },
    { "id": "mobile", "name": "Mobile", "nodes": [] }
  ]
}
```

Pages have stable IDs and nonempty names. A file has 1 to 100 pages; each page has at most 1,000 nodes, with at most 10,000 nodes across the file. Node IDs must be unique across the file. Parent references must resolve to an artboard on the same page. Token metadata belongs to the file, not individual pages.

Project archives use `{ "kind": "open-cavas-project", "version": 1, "project": ... }`. Workspace archives use `{ "kind": "open-cavas-workspace", "version": 1, "projects": [...] }`. A project has an ID/name and a nonempty `files` array. Each file record has an ID, a version-2 `document`, and `pageId` identifying its remembered active page. The runtime schema is `packages/document/src/workspace.ts`.

Workspace validation requires unique project IDs and unique file IDs across projects. Project/file/page names are trimmed and nonempty. Imported archives append projects with regenerated project/file IDs, retaining page/node IDs within each independent file. A version-1 document becomes a new version-2 file with one generated Page 1.

Current UI JSON import limit is 40 MB. MCP request/response limits remain 12 MB, so browser backups are required for larger workspaces.

## Review threads

Version-2 pages also contain a `threads` array, defaulting to `[]` for older backups. Posted threads and comments persist in file/project/workspace archives; version-1 imports start without threads. Anchors are either a stable layer ID on the containing page or finite world coordinates. See [review-threads.md](review-threads.md#file-format-and-limits) for the schema, validation limits, copy/deletion rules, and retained missing-anchor policy. Session drafts are not serialized.

## Text frames and editing bounds

Text `width` and `height` describe the stored frame, not glyph extents. Selection shows the resolved frame dashed and a solid content outline based on the same font and line layout as the artwork. Resize handles follow the selected sizing mode. Inline editing grows with the draft while preserving the frame width for wrapped text. Edits do not change stored frame dimensions. Alignment and rotation remain anchored to the resolved frame.

Artwork preserves whitespace. The textarea preserves draft whitespace and uses eight-space tab stops. Native textarea and SVG font metrics and wrapping may differ.
