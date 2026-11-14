# Agent control through MCP

Open Cavas exposes 27 tools over the official MCP SDK's stdio transport. It controls a paired Open Cavas browser directly.

## Start and pair

Use this checkout, not the main checkout. Install dependencies, then start the agent-enabled editor:

```sh
npm install
npm run dev:agent
```

Open **http://localmachine:5182**. The application binds `0.0.0.0`. It is a development server, not an authenticated production deployment. Keep it on a trusted network and do not expose it to the public internet.

Generate the exact stdio configuration for this checkout:

```sh
npm run --silent mcp:config
```

Copy its `open-cavas` entry into your MCP client's configuration. The command prints JSON only and does not modify any agent settings.

Alternatively, use the example below. Replace all `/absolute/open-cavas` paths with this checkout's absolute path. Use the same Node installation as the one that ran npm install. An example configuration is in `mcp.example.json`.

```json
{
  "mcpServers": {
    "open-cavas": {
      "command": "node",
      "args": [
        "/absolute/open-cavas/node_modules/tsx/dist/cli.mjs",
        "/absolute/open-cavas/server/index.ts"
      ],
      "cwd": "/absolute/open-cavas"
    }
  }
}
```

Start or reconnect the MCP client so it launches the server. Then, in this checkout:

```sh
npm run mcp:pair
```

This prints a **private pairing code**. In the app, choose **Connect agent**, paste the code, and choose **Pair agent**. The code grants read/write access to this tab's document. Only pair trusted agents. Do not put the code in a committed config, URL, chat message, or screenshot.

The server writes the code to `.cavas/pairing.json`, mode 0600, inside a mode-0700 directory ignored by Git. A new server process rotates the code. Normal server shutdown removes it. After a crash, the old file may remain, but cannot connect to a new process. Reloading the browser disconnects it and creates a new canvas ID; pair again and call `list_canvases`.

To remove access, use **Disconnect agent** or stop the MCP client. Document edits remain in browser storage and ordinary undo history.

### Ports and origins

The private broker listens only on `127.0.0.1:4781`. Vite explicitly denies `.cavas/**` through its filesystem guard, including `/@fs` requests, while preserving Vite's default secret-file deny rules. Private pairing files must never be served by the development server. Vite proxies `/__cavas` WebSocket upgrades; it does not make the broker's raw listener public. Every upgrade requires the private code and the exact configured browser Origin. Codes travel in a WebSocket subprotocol, not a query string, and are never reflected as the selected subprotocol.

Defaults:

- Browser app: `http://localmachine:5182`.
- Broker: `127.0.0.1:4781`.
- `CAVAS_MCP_PORT` overrides the broker port. Set it identically for the MCP process and Vite process.
- `CAVAS_APP_ORIGIN` overrides the exact allowed origin for the MCP process. Use it when changing the browser hostname, scheme, or port. No trailing slash or path.

One MCP process owns each broker port. Starting a second process on the same port fails rather than stealing the existing connection. Up to eight browser tabs can pair with one process. This is not a multi-agent synchronization or hosted Streamable HTTP service.

For a production preview, first run `npm run build`, then start Vite preview on the configured app port. The WebSocket proxy is also configured for preview. A static-file-only host without the authenticated broker/proxy does not provide agent control.

## Agent workflow

1. Call `get_capabilities`, then `list_canvases`.
2. Choose an explicit canvas ID. Never infer which browser tab the user intends.
3. Read `get_document`, `get_tree`, `get_node`, or `get_selection`.
4. Supply that response's `revision` as `expectedRevision` on every mutation.
5. Read the relevant node/tree after changing it. Tool success is not a screenshot or proof of durable browser storage.
6. Use `get_screenshot` to inspect artwork or an artboard when visual confirmation matters.

Selection and document changes advance the revision. Manual browser edits advance it too. Stale mutations fail without changing state. A manually active drag, on-canvas text edit, or focused inspector/document-name field blocks agent writes until the user finishes or cancels the edit.

Each atomic document mutation is one undo step. Selection changes are separate session state. Read responses and edit receipts include a persistence state, `saved`, `pending`, or `failed`. A `pending` receipt means the document is in memory, not yet durably written. Download JSON backups.

There is no automatic mutation retry. Cancellation, timeout, or disconnection after dispatch can leave the outcome unknown. Reconnect and inspect actual state before deciding whether to repeat an operation. Late responses cannot satisfy another request or another tab's pending call.

## Tools

### Discovery and read-back

`get_capabilities`, `list_canvases`, `get_document`, `get_tree`, `get_node`, `get_styles`, `get_selection`.

By default document/node/style reads omit base64 image bytes. Such abbreviated document responses are not lossless import files. Use `export_document` with format `json`, or explicitly request images in `get_document`, for a complete document. Stable node IDs survive JSON export/import and browser reload; canvas IDs do not.

### Creation and editing

`select_nodes`, `create_artboard`, `create_nodes`, `update_nodes`, `set_text`, `move_nodes`, `duplicate_nodes`, `delete_nodes`, `reorder_nodes`, `undo`, `redo`.

Coordinates are absolute world pixels, including when a parent is supplied. Only artboards can parent nodes. Creating or moving an artboard follows the same editor rules as manual editing. Locked targets reject agent changes, except a direct unlock. Batches validate before committing, so a malformed entry cannot partially update a document. `create_nodes` accepts at most 100 layers per call.

### Documents and output

`rename_document`, `create_document`, `open_document`, `export_document`, `get_screenshot`.

New/open operations replace this tab's document and remain undoable. They do not manage arbitrary disk paths or a multi-file library. Export returns content to the agent, not a server-side file write.

SVG preserves supported artwork. HTML export is a standalone document containing that SVG, not semantic HTML/CSS layout. JSX export is a React component containing SVG JSX, not a semantic component reconstruction. JSON exports the complete editable document.

PNG screenshots render supported artwork, not editor chrome. They use the browser's SVG/image/canvas pipeline. Maximum side is 4096 pixels and maximum area is eight megapixels. Use a smaller scale or select one artboard if a document is too large. Text does not automatically wrap, so overflow and artboard clipping are preserved.

### Static HTML import

`write_html` creates editable primitives inside an existing artboard. Input is parsed inertly and never mounted, executed, or fetched.

Supported tags: div, section, article, header, footer, main, aside, nav, span, p, h1, h2, h3, button, label, img, ul, li, a. These are imported as visual primitives, not interactive web controls.

Supported attributes: `style`, `data-layer-name`, `src`, `alt`. IDs, classes, event handlers, links, and other attributes are rejected.

Supported styles: position, left, top, width, height, padding, background, background-color, color, font-size, font-family, font-weight, border-radius, opacity, text-align, display. Dimensions must be pixel numbers. Colors accept hex or RGB. Fonts and weights must match the document schema. Block flow is a restricted vertical stack; absolute positioning uses the containing block's origin. Text must occupy its own element. Font/color inheritance and CSS group-opacity semantics are not implemented.

Scripts, stylesheets, embeds, SVG/MathML markup, network image URLs, CSS variables, expressions, important declarations, flex/grid, mixed rich text, and unsupported CSS/attributes are rejected. At most 100 generated layers and 20 nesting levels per import. Invalid input commits nothing. This is not arbitrary website rendering.

### Design tokens

`get_design_tokens`, `set_design_tokens`, `apply_design_token`.

Documents store at most 200 named color, number, or font tokens. Applying a token copies its value to compatible node properties in one undo step. There are no dynamic references; later token edits do not change previously styled layers. Tokens are managed through MCP and JSON in this increment, not a new visual token editor.

## Security and limits

- Stdio is the agent boundary. The HTTP listener is not an unauthenticated MCP API.
- Loopback binding, code validation, exact-origin validation, explicit canvas IDs, and per-request socket binding are separate checks.
- Browser commands and document mutations validate through shared Zod schemas. Unsupported kinds and properties fail.
- No shell execution, arbitrary file reads/writes, remote asset fetching, HTML execution, or third-party credentials are exposed.
- Requests/responses are limited to 12 MB and 30 seconds. The editor retains its 1,000-layer and 80-undo-snapshot limits.
- The paired browser owns data. Closing it stops document access. There is no headless editor, server document database, or file/page synchronization.
- After editing connector or tool source in development, reload and re-pair the browser. An existing WebSocket callback can retain the previous hot-reloaded implementation. Restart the MCP client after server/schema changes.
