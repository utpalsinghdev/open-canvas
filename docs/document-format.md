# Document format

The authoritative schema is `src/editor/model.ts`. TypeScript types derive from it. This document describes version 1, downloaded as `<name>.cavas.json`.

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
- `text`: adds `text`, `fontSize`, `fontFamily`, `fontWeight`, and `align`. Content is at most 10,000 characters. Size is 6 to 500. Families are Arial, Georgia, or Courier New. Weights are string values 400, 500, 600, or 700. Alignment is left, center, or right. Newlines create explicit lines at 1.2 times the font size.
- `image`: adds `src`, a base64 PNG, JPEG, WebP, or GIF data URL. SVG and external URLs are rejected. Images crop to the frame with centered aspect-fill behavior.

## Order and validation

The node array controls paint order among siblings. Artboard children are grouped under their parent for rendering and export even when other roots appear between them in the array. A document can have at most 1,000 nodes.

Import rejects malformed JSON, unsupported versions, invalid geometry, duplicate IDs, and missing or non-artboard parents. It never executes imported content. Unknown object properties are dropped during parsing. JSON import is limited to 12 MB. The file picker additionally limits each newly added raster image to 2 MB and verifies that the browser can decode it.

The optional `tokens` field defaults to `{}` when loading earlier version-1 documents. It is a dictionary of up to 200 token names. Names begin with an ASCII letter and contain at most 80 letters, digits, underscores, or hyphens. Each value is `{ "type": "color", "value": "#d9f171" }`, `{ "type": "number", "value": 16 }`, or `{ "type": "font", "value": "Arial" }`. Numbers are finite and bounded by -100,000 and 100,000; fonts use the same family enum as text. Tokens are metadata with explicit literal application, not dynamic node references.

Undo history, current selection, viewport, agent pairing, state revision, and panel state are not serialized. SVG exports do not reopen as editable Open Cavas documents.
