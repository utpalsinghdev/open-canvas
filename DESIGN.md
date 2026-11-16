# Design system

## Editor contract

Open Cavas is a working editor, not a marketing page. The user's pinned direction is true black application background, white primary text, dense controls, minimal copy, and no decorative card or pill chrome. Artwork colors are user content, not editor theme colors.

Opening a file exposes editable artwork between Layers and Properties. The selected workspace's root destination shows Home for browsing projects and files. Tool selection and direct manipulation are the main interaction. No continuous animation, pulse, glow, or spinner runs in the editor.

## Tokens

The shared tokens are declared in `apps/web/src/styles.css` under `:root`. `apps/web/src/desktop.css`, loaded afterward, owns desktop dimensions and menu elevation tokens.

- Background and panel: `--background`, `--panel`, both `#000000`.
- Primary text: `--foreground`, `#ffffff`.
- Controls: `--control` `#101010`; hover `--hover` `#1a1a1a`; selected `--active` `#242424`.
- Borders: `--line`, `#252525`.
- Secondary text: `--muted`, `#a0a0a0`; inactive detail `--subtle`, `#777777`.
- Focus: `--accent`, `#a6c7ff`; selection bounds `--selection`, `#8cb7ff`.
- Save/error warning: `--warning`, `#ffc486`.
- UI type: platform system sans through `--font-ui`. Artwork font is document data.

Spacing declarations use a 4 px grid. Borders are 1 px. Compact controls have 3 to 5 px corner radii. Drawing handles are 8 screen pixels regardless of zoom.

## Layout and interaction

Desktop uses one 52 px header, a 48 px vertical tool rail beside the canvas, a 30 px footer, a 240 px Layers panel, and a 288 px Properties panel. Between 901 and 1100 px, panels shrink to 216 and 264 px. File navigation, Review, Help, Export, and sidebar toggles live in the header. Sidebar toggles independently collapse or reopen desktop panels; the tool rail follows the Layers edge. The canvas fills each freed column without resetting the camera or selection. Hidden panels remain mounted to retain their content. At 900 px and below, panels become explicitly toggled, mutually exclusive overlays, separate from desktop visibility preferences. Visibility is session-only and resets on reload. Under 560 px, the Export action becomes an icon with an accessible label; format and scope remain visible in its dropdown.

Controls have visible instant keyboard focus. Native disabled states change ink, fill, and cursor, and preserve disabled attributes. Disabled controls are exempt from normal text contrast requirements. Fields commit on blur or Enter; drag operations commit once on release. Local-save failure is visible in the header and a persistent recovery notice. The notice takes precedence over dismissible notifications, includes expandable bounded error details, and opens Projects for workspace backup. It has no dismiss or retry action and stays until saving the current workspace succeeds or a successful reload clears it.

A dotted world grid provides position context without repainting animation. Artboard titles stay the same screen size while zoom changes. Selection outlines scale inversely with zoom. Text edits use a focused textarea over the artwork; text content never becomes executable HTML.

## Review threads

Add comment uses a plus-message icon to select click-to-comment mode. Clicking artwork anchors feedback to the layer; empty canvas anchors feedback to world coordinates. Creation and pin conversations use a compact, content-height black box beside the target, clamped within the canvas as the camera changes. New-comment composition uses a single borderless text area with Cancel and the shared white-primary Save action, without a visible title or target-label row. The target remains in the accessible description. Save commits nonempty feedback; Cancel discards the draft; Escape hides the box while preserving session drafts. Review uses a distinct stacked-message icon and visible label to open the file-wide list. On narrow screens Review lives beside Layers/Properties, with mutually exclusive panels. Open threads have numbered pins; resolved and missing-layer threads remain in the list without pins. Long conversations scroll inside the box. Comment content stays plain text.

## Review

Desktop at 1440 by 1000 and mobile at 390 by 844 were inspected in a real browser. Mobile has no document-width overflow and exposes both panels. Design detector returned no findings. Static Hallmark checks have no floor failures; pure black and white are explicitly waived because they are user requirements. Hallmark's render tier was unavailable, so browser captures and interactions provide visual evidence instead. This was a single-agent review, not an independent review.


## Automatic agent connection

App startup connects automatically, with no connection badge, masked-code field, Pair button, or pairing instructions. Pause/Resume agent access lives in the File menu and lets users persistently opt out for the selected service workspace. Routine saving/saved labels are omitted from the header; failed saves remain visible, including at narrow widths.

## Project and page navigation

The selected workspace opens at Home, a full-height Files library with a project rail and desktop artwork previews. Each preview shows the file's remembered active page using native artwork, or Empty page when it has no visible roots. Import and workspace backup stay in the heading; Switch workspace stays in the app header. Opening or creating a file enters the editor. A labeled Home control remains visible at every editor width. The compact project-name action opens the Projects dialog, which keeps compact rows for quick switching. Home and the dialog share library actions; file previews are content, not decorative card chrome. Open/rename/duplicate/backup/delete remain explicit. Narrow Home keeps file rows without mounting preview artwork. A separate warning and confirmation precedes permanent library deletion. Project/workspace backup and JSON import remain visible above the list.

Pages live above Layers with compact add/rename/duplicate/delete controls. Current-page state uses the existing active color. On narrow screens, project navigation remains a horizontal scrollable list within the dialog; file content takes the remaining space. Pages remain accessible through the Layers overlay. No continuous animation was added.

## Canvas cursors

Select, Hand, Text, and resize cursors use static 32×32 SVGs with 1.5 px dark ink,
rounded joins, and a 1 px white contrast rim. Artboard, Rectangle, and Ellipse
use the native crosshair, with no custom assets or tool badges. Select points at (5, 3); both hand
states share a palm hotspot at (16, 18). Text and resize cursors center at (16, 16).
Hand silhouettes use white fills. Text placement uses the same outlined I-beam
language, while the inline textarea retains its native text cursor.

Every custom cursor retains its matching native fallback. Cursor styling belongs
only to the canvas SVG and Select-mode resize handles, never panels or controls.
Active pan overrides tool and resize cursors without changing pointer geometry.
## Page request activity

Nine blue 5 px squares form a precise 37 by 25 px lattice above the displayed page artwork's leading corner, outside the artwork SVG. A pale-blue light sequence crosses the fixed geometry diagonally; the dots never jump, bounce, merge, or rotate. The sequence starts bright and finishes within 520 ms, then leaves a static blue pending mark. Fast requests retain a dimmed neutral recent-request mark only until 600 ms after dispatch; pending status clears immediately when execution ends. Only the opacity of each dot's highlight animates, without blur, filters, or looping. Reduced motion shows the static lattice immediately. The mark stays screen-sized, follows the page bounds, and clamps inside the viewport when panned offscreen. Accessible status names “Agent processing a request on this page”; no text badge or decorative container is drawn. Clearing status makes no success or save claim.

## Committed artwork reveal

MCP-created artboards and layers enter together per committed batch with a single 220 ms ease-out opacity reveal, from 25% to full presentation opacity. Separate canvas wrappers leave stored layer opacity, geometry, clipping, and hit testing intact. No stagger, movement, loop, or extra undo state is added. Reduced motion displays final artwork immediately. Manual creation, navigation, reload, and undo/redo keep their existing rendering.

## Local workspace selection

## Installed font families

Typography uses a labeled text field with a native datalist for the five existing suggestions. Enter any literal installed family name and commit on blur or Enter; Escape restores the saved name. Invalid input keeps a visible error without changing artwork. A status line identifies browser detection, unavailable-font fallback, or unverified availability. This replaces the closed family select without adding font enumeration, permission dialogs, or new editor chrome.

Introduction belongs inside the editor canvas, not in a separate welcome page or Help dialog. Start with introductory canvas creates a workspace containing two editable 600 × 760 artboards with 17 native layers. Lime and lavender artwork introduces drawing, navigation, saving, and agent access. Shapes and text are real editable examples, not HTML illustrations. Fresh browser fallback uses the same seed. Existing documents never receive seeded content; empty creation and browser copying remain explicit separate choices. The ordinary canvas fit/pan/zoom controls also apply on narrow screens.

The local workspace chooser appears before mounting the editor. Desktop places saved-workspace opening rows beside a new-workspace form, with recovery and storage details below both. Narrow screens stack the same groups. New workspace groups its name, primary introductory-canvas action, and secondary empty-workspace action. Browser recovery actions live inside Recover browser-only work; the browser-storage status and service errors remain visible outside the disclosure. Save-destination details and Refresh workspaces follow the form. Copying keeps original browser storage untouched. File menu exposes persistent Pause/Resume and Switch local workspace. No automatic profile merge or headless connection badge is added.

## PDF export action

One compact Export dropdown replaces separate SVG and PDF header buttons. Its two rows include their scope: SVG · Selected artboard or SVG · Current page, and PDF · Selected artboards or PDF · Current page. PDF puts selected artboards on separate pages in one file. Pending export disables only the PDF row with static progress text; completion and actionable errors use the existing notification area. The menu remains inside narrow viewports, supports normal keyboard focus, and dismisses on Escape, outside click, or focus leaving it. JSON backup remains in the File menu.

## Workspace storage and recovery clarity

The workspace chooser and Home/Projects footer use compact disclosures for the actual app-server save directory. Once selected, the disclosure identifies the workspace name, full ID, and JSON file. Recovery guidance distinguishes empty browser storage from unreadable storage and explains reopening the original profile and exact app address. Browser copy and backup stay disabled without validated saved data; the introductory fallback is not presented as recovered work. Existing black editor styling and native focus behavior remain.

## Inspector and layer navigation

Inspector fields are grouped into Position, Dimensions, Typography for text, Appearance, and Arrange. Desktop field labels sit above their values so long property names do not squeeze numeric input. Arrangement actions use visible icon-and-text controls in two columns. With no selection, the inspector shows the current page's artboard/layer counts and a concise selection prompt. Layers scroll independently below Pages with 12 px names; their footer shows the Shift-click multi-select shortcut. Collapse all is an inward-chevron icon with an accessible name and tooltip; it disables when all artboards are folded.

## File and workspace context

File is labeled on desktop, closes on Escape/outside click/focus exit, and keeps its menu inside narrow viewports. The desktop footer identifies the selected workspace and page. Help distinguishes app-server saving, editable JSON backups and artwork exports.

## Desktop density and action hierarchy

Above 900 px, `apps/web/src/desktop.css` owns the workbench composition with 13 px base UI type, 12 px section names, and 11 px field labels/supporting metadata. Drawing tools form a vertical rail with a white active state. Undo/redo remain available through keyboard shortcuts and Help, without visible toolbar buttons. Toolbar accessibility orientation follows its desktop or narrow layout. Selected layers use the existing blue selection wash and ink. Numeric values use full-width 34 px fields. Menus and review overlays have restrained offset shadows; Help uses aligned shortcut rows with separators.

Home has a 240 px project rail and an adaptive grid of native page previews, file names, metadata, and explicit actions. Search has a bounded width, New file stays at the opposite end of the row, and import/backup controls remain secondary. Previews are read-only and mounted only near the visible library area; they are neither saved snapshots nor exports. Project dialogs keep compact rows. Artwork in the editor remains uncapped.

No animation, font dependency, document capability, or alternate mobile shell is added. Below 901 px, tools return to a horizontal strip and panels remain overlays. Workspace setup keeps a stacked fallback and recovery disclosure.
