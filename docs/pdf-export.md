# PDF export

Open **Export** in the header and choose **PDF · Selected artboards** to export selected artboards. Shift-click artboards on the canvas or in Layers to select more than one. Non-artboard selections are ignored when artboards are selected. Each selected artboard becomes one PDF page, in document layer order, regardless of selection order. Hidden selected artboards fail with an error rather than disappearing from the PDF.

When no artboards are selected, the PDF menu item explicitly reads **PDF · Current page**. This exports the visible active page as one page using its artwork bounds. It does not export every artboard as separate pages or include other document pages. Empty pages fail without downloading a file.

The same dropdown contains SVG with its current scope. SVG keeps its existing behavior: exactly one selected artboard exports that board; all other selections export the current page. JSON backups remain in the File menu. Escape, clicking outside, or tabbing out dismisses the dropdown. While a PDF is rendering, its menu item is disabled with static progress text; SVG remains available.

## Dimensions and appearance

One CSS pixel becomes 0.75 PDF points, equivalent to 96 pixels per inch. A 640 × 480 artboard produces a 480 × 360 point page. Portrait and landscape artboards keep their own dimensions. No paper-size preset, margins, scaling-to-fit, or print dialog is involved.

The connected browser rasterizes the same SVG artwork used by existing visual exports at 2× resolution, then embeds a lossless PNG on each PDF page. Text, rotation, clipping, opacity, and static embedded raster images remain visual artwork. Text is not selectable or searchable, shapes are not PDF vectors, and the result is not an editable document or tagged accessible PDF. Transparent areas are composited on white. Use JSON for editable backups and SVG for vector output.

Bundled fonts must load successfully before export. System fonts use the same browser resolution as the editor; their availability can differ between machines. Corrupt images, GIF images, animated PNG/WebP, and unavailable bundled fonts fail with a visible error. Convert animation to a static PNG/JPEG before export. Hidden layers do not participate in resource checks or output. No external image or font URL is accepted from document content.

## Limits

- At most 32 artboards per PDF.
- At 2× resolution, at most 4096 pixels per side and 8 megapixels per page, with at most 32 megapixels across the PDF. A 2048 px artboard side reaches the side limit.
- Source raster images must decode and contain at most 16 megapixels each, with at most 32 megapixels across unique image sources. Identical sources are checked once. All headers and the aggregate budget are checked before any source decoding.
- Embedded image references may total at most 32 MB across exported pages, including repeated references to the same source. This bounds SVG generation before rasterization.
- The completed PDF must be at most 8 MB, including browser downloads. This leaves room for base64 and metadata within the existing 12 MB MCP transport limit.
- One PDF export can run at a time in a tab. Pending UI exports delay automatic main-release reloads through download initiation and the normal idle grace period. Large exports can take several seconds. No partial file is downloaded on failure. Export fewer or smaller artboards when limits are exceeded.

## MCP

`export_combined_pdf` is a read-only browser-rendered operation. Supply an explicit connected `canvasId`, `scope: "artboards"`, and unique nonempty `artboardIds` from the active page. IDs must all identify existing visible artboards. Caller order does not change page order.

For a whole active-page export, explicitly use `scope: "page"` and omit `artboardIds`. There is no implicit use of the user's current selection. A durable `workspaceId` target fails because headless rendering is not implemented.

The ordinary read envelope includes revision, context, and persistence status. Its `result` includes base64 `data`, `encoding: "base64"`, `mimeType: "application/pdf"`, `name`, `pageCount`, ordered `pages` with names, world-space bounds and dimensions in PDF points, `pointsPerPixel: 0.75`, and `rasterScale: 2`. Decode the base64 bytes in the agent's normal artifact workflow. The tool does not write server-side filesystem paths, fetch remote assets, or change artwork/selection. Each export captures an immutable active-page snapshot before asynchronous rendering. Read-back and persistence remain separate evidence.

After upgrading, reconnect the MCP client and reload older browser tabs to pick up the new tool. No broker authentication, listener, or Tailscale configuration changes are required.
