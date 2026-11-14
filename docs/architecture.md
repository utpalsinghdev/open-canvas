# Architecture

## Planned MVP

A versioned JSON document holds an ordered node list. Each node has geometry and styling. Node kinds are artboard, rectangle, ellipse, text, and image. Only artboards can parent other nodes. Children use absolute world coordinates; moving an artboard translates its children. This keeps selection and SVG export in the same coordinate space.

Zod owns the persisted schema. Zustand owns the document, selection, and bounded snapshot history. Viewport pan/zoom and pointer previews do not create history entries. A completed pointer gesture creates one undo step.

React renders SVG artwork and a DOM editor shell. Imports accept only validated documents and safe raster data URLs. The application does not evaluate imported HTML or JavaScript.

Local browser storage is the only automatic persistence. Download JSON for a portable backup. SVG is a visual export, not an editable Open Cavas document.
