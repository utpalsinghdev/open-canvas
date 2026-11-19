# Design system

## Editor contract

Open Canvas is a working editor, not a marketing page. The user's pinned direction is a true-black application base, white primary text, and a dark neutral surface ladder that separates the drawing stage, panels and controls. Keep dense controls, minimal copy, and no decorative card or pill chrome. Artwork colors are user content, not editor theme colors.

Opening a file exposes editable artwork between Layers and Properties. The selected workspace's root destination shows Home for browsing projects and files. Tool selection and direct manipulation are the main interaction. No continuous animation, pulse, glow, or spinner runs in the editor.

## Tokens

The shared tokens are declared in `apps/web/src/styles.css` under `:root`. `apps/web/src/desktop.css`, loaded afterward, owns desktop dimensions.

- Application base: `--background` `#000000`; primary text: `--foreground` `#ffffff`. Native form controls use `color-scheme: dark`.
- Drawing stage: `--canvas-background` `#151719`, also used for Home's artwork-preview backdrop. This is chrome, not an artboard fill or document setting.
- Panels: `--panel` `#0d0d0d` for Layers, Properties, tool rail, header/footer, project navigation and review/dialog surfaces. Controls: `--control` `#101111`. Hover: `--hover` `#18191a`. Selected rows and neutral pressed controls: `--active` `#202223`, with white `--on-active` ink. Selected tools use the white/black primary treatment at every width.
- Decorative dividers: `--line` `#242728`. Essential field/button boundaries use `--control-edge`, the same approximately `#737373` as `--subtle`, mixed from 42% white and 58% panel. Dividers are not relied on to identify an editable field.
- Supporting prose: `--body` `#cdcdcd`. Metadata and secondary labels: `--muted` `#b0b0b2`. Disabled detail: `--subtle` `#737373`; disabled buttons additionally use 45% opacity and retain native disabled attributes/cursors. Disabled ink is not used for enabled labels or placeholders.
- Keyboard focus and selected emphasis: `--accent` `#57c1ff`. Focus uses a 2 px outline with 2 px black separation; canvas focus is inset. Text selection uses this blue with black ink; carets use blue except inline artwork editing, which uses the document text color.
- Primary actions: `--primary` white, `--on-primary` black. Hover uses the dark hover surface with white ink, and pressed uses the selected surface. New file, workspace creation, Export and comment Save share this treatment.
- Artwork-facing `--selection` uses the focus blue, backed by a 1 screen-pixel black `--selection-rim` on both sides. Selection, text frames, resize handles, marquee and dashed Select/solid Comment hover edges share this dual-contrast treatment. Black separates the blue from bright artwork; blue contrasts against dark artwork. Transparent artwork reveals the dark stage. No filter, blur or animation is added.
- Marquee fill: `--selection-wash`, 16% accent with transparency, resolves near `#20323e` on the stage. Selected Layers rows use neutral `--active`, not this wash. Grid dots: `--grid`, 24% secondary ink, resolve near `#3a3c3e` on the stage. These fills are supplemental, not essential boundaries.
- Existing failed-save/service/validation messages use `--danger` `#ff6161`, with explicit error wording. Destructive confirmations use the same red ink and named actions. Warnings, including locked-layer and impending-deletion messages, use `--warning` `#ffc533`. `--success` `#59d499` is reserved for confirmed success where feedback exists; no new success badge or save claim is introduced.
- Agent activity retains existing timing, recent/pending semantics and reduced-motion behavior; only its blue role follows `--accent`. The base dots remain 65% blue and recent marks retain 65% group opacity. Clearing a request never signals durable saving.
- Modal backdrops: 65% black. Menu elevation: existing 0/12/40 px geometry with 60% black. Scrollbars: control-edge thumb on panel track. Inline text-edit backgrounds remain transparent. Native browser tooltips and color-picker interiors remain browser-owned; custom cursor black ink and white contrast rims are intentionally unchanged.
- Minimum measured contrast across the specified opaque functional surfaces: white 15.98:1, body 10.05:1, secondary 7.38:1, blue focus 7.97:1, warning 10.11:1 and error 5.43:1. White/black primary actions are 21:1. Control edges are at least 3.35:1 against control/hover/selected surfaces. Blue/black contrast rims are 10.48:1; black/white is 21:1. Pale blue alone on white is only 2.00:1, so artwork-facing edges must retain the black under-stroke. Decorative dividers, grid, washes and disabled controls are not asserted to meet essential-indicator contrast.
- UI type: platform system sans through `--font-ui`. Artwork font is document data.

Spacing declarations use a 4 px grid. Borders are 1 px. Drawing handles are 8 screen pixels regardless of zoom.

### Control sizing

Two radius tokens and two height tokens in `apps/web/src/styles.css` size every text button, field, menu and control radius. Icon buttons, tool rail buttons, list rows and the narrow tab strip keep the fixed sizes listed below the table. Only the 2 px color-swatch inner corner and the squared menu separators fall outside the tokens.

| Token | Value | Used by |
| --- | --- | --- |
| `--radius-control` | 4 px | Text and icon buttons, menu items, tabs, inputs, selects, numeric and color fields, list rows, comment pins, tooltips |
| `--radius-surface` | 6 px | Menus, comment and review surfaces, dialogs, toast, zoom cluster, alignment group, file previews, inline name forms |
| `--control-height` | 32 px above 900 px, 36 px at 900 px and below | Export, File, Home, project switcher, Review, menu items, secondary, library and dialog buttons, comment Cancel and Save, inputs, selects, numeric and color fields, project rows |
| `--control-height-compact` | 28 px at every width | Zoom buttons, page and layer action icons, and Home file action icons on desktop |

Narrow screens keep the taller regular height so text buttons stay easy to tap. Icon hit areas keep their sizes: 30 px header icons on narrow screens and 32 px on desktop, 36 px tool rail buttons, and 27 by 33 px tool strip buttons under 560 px. The narrow Layers, Properties and Review tabs stay 40 px tall. Text buttons use 12 px side padding, menu rows 8 px on narrow screens and 12 px on desktop. Labels stay regular weight, with 500 for Export and other white primary actions. Outlined buttons keep a 1 px border rather than an inset shadow, because the focus treatment uses that shadow for its black separation.

## Layout and interaction

Desktop uses one 52 px header, a 48 px vertical tool rail beside the canvas, a 30 px footer, a 240 px Layers panel, and a 288 px Properties panel. Between 901 and 1100 px, panels shrink to 216 and 264 px. File navigation, Review, Help, Export, and sidebar toggles live in the header. Sidebar toggles independently collapse or reopen desktop panels; the tool rail follows the Layers edge. The canvas fills each freed column without resetting the camera or selection. Hidden panels remain mounted to retain their content. At 900 px and below, panels become explicitly toggled, mutually exclusive overlays, separate from desktop visibility preferences. Visibility is session-only and resets on reload. Under 560 px, the Export action becomes an icon with an accessible label; format and scope remain visible in its dropdown.

Controls have visible instant keyboard focus. The canvas is a Tab stop with an inset accent outline for keyboard focus. Pointer selection and panning keep canvas focus without a viewport outline, including after editing a field; keyboard input restores its focus indicator. Artwork selection outlines remain independent. Native disabled states change ink, fill, and cursor, and preserve disabled attributes. Disabled controls are exempt from normal text contrast requirements. Fields commit on blur or Enter; drag operations commit once on release. Local-save failure is visible in the header and a persistent recovery notice. The notice takes precedence over dismissible notifications, includes expandable bounded error details, and opens Projects for workspace backup. It has no dismiss or retry action and stays until saving the current workspace succeeds or a successful reload clears it.

A dotted world grid provides position context without repainting animation. Artboard titles stay the same screen size while zoom changes. Selection outlines scale inversely with zoom. Select previews the unlocked painted target with a dashed blue outline, without handles or a tooltip. Already-selected targets retain only their existing selection controls. Hover clears on empty canvas, pointer exit, window blur, and interaction start; panning, gestures, and inline text editing suppress it. During marquee selection, candidate layers instead show their selection bounds without resize handles before release. The candidate set updates as the box grows or shrinks, includes the existing selection for Shift-drag, and uses the same bounds and lock/visibility rules as release. Escape removes tentative bounds and retains the existing clear-selection shortcut. Comment retains its solid target outline and hint, including on locked artwork. These pointer-transparent overlays remain editor chrome, excluded from saved artwork and exports. Text edits use a focused textarea over the artwork; text content never becomes executable HTML.

## Review threads

Add comment uses a plus-message icon to select click-to-comment mode. Clicking artwork anchors feedback to the layer; empty canvas anchors feedback to world coordinates. Creation and pin conversations use a compact, content-height panel-colored box beside the target, clamped within the canvas as the camera changes. The new-comment box opens directly into a borderless text area. A divided footer shows the target, a quiet Cancel action, and the shared white-primary Save action. Long target names truncate in the footer but remain available in its tooltip and the text area's accessible description. Save commits nonempty feedback; Cancel discards the draft; Escape hides the box while preserving session drafts. Review uses a distinct stacked-message icon and visible label to open the file-wide list. Its header holds the status filter and close button. Each row starts with the comment preview, then shows page and comment count on the left and status on the right. Missing layers are labeled separately. On narrow screens Review lives beside Layers/Properties, with mutually exclusive panels. Open threads have numbered pins; resolved and missing-layer threads remain in the list without pins. Long conversations scroll inside the box. Comment content stays plain text.

## Review

Verification results and browser coverage are recorded in [docs/verification.md](docs/verification.md). Theme changes use real browser captures at desktop and narrow widths, computed contrast checks, and source review. Current coverage and remaining limits are stated in that record.


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

Nine blue 5 px squares form a precise 37 by 25 px lattice above each targeted artboard's top-left corner (or targeted root layer for unparented artwork), outside the artwork SVG. A pale-blue light sequence crosses the fixed geometry diagonally; the dots never jump, bounce, merge, or rotate. The sequence starts bright and finishes within 520 ms, then leaves a static blue pending mark. Fast requests retain a dimmed neutral recent-request mark only until 600 ms after dispatch; pending status clears immediately when execution ends. Only the opacity of each dot's highlight animates, without blur, filters, or looping. Reduced motion shows the static lattice immediately. The mark stays screen-sized, follows the targeted artwork, and clamps inside the viewport when panned offscreen. Page-wide requests fall back to the leading page bounds. Accessible status names “Agent processing a request on this artwork”; no text badge or decorative container is drawn. Clearing status makes no success or save claim.

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

The workspace chooser and Home/Projects footer use compact disclosures for the actual app-server save directory. Once selected, the disclosure identifies the workspace name, full ID, and JSON file. Recovery guidance distinguishes empty browser storage from unreadable storage and explains reopening the original profile and exact app address. Browser copy and backup stay disabled without validated saved data; the introductory fallback is not presented as recovered work. The shared dark theme and visible keyboard focus apply here too.

## Inspector and layer navigation

Inspector fields are grouped into Position, Dimensions, Typography for text, Appearance, and Arrange. Desktop field labels sit above their values so long property names do not squeeze numeric input. Arrangement actions use visible icon-and-text controls in two columns. With no selection, the inspector shows the current page's artboard/layer counts and a concise selection prompt. Layers scroll independently below Pages with 12 px names; their footer shows the Shift-click multi-select shortcut. One bulk control offers Collapse all while any current-page artboard is open, then Expand all when all are folded. Separated inward/outward chevrons around a center rule, an updated accessible name and a hover/focus tooltip describe the next action. It disables only when the current page has no artboards. Individual branches remain available; bulk changes preserve other pages' branch state, selection, artwork and document history.

## File and workspace context

File is labeled on desktop, closes on Escape/outside click/focus exit, and keeps its menu inside narrow viewports. The desktop footer identifies the selected workspace and page. Help distinguishes app-server saving, editable JSON backups and artwork exports. A versioned Changelog disclosure near the top keeps the current release notes available offline without displacing the shortcut list when closed. Installed builds include the terminal command for checking updates. The browser does not install updates.

## Desktop density and action hierarchy

Above 900 px, `apps/web/src/desktop.css` owns the workbench composition with 13 px base UI type, 12 px section names, and 11 px field labels/supporting metadata. Drawing tools form a vertical rail with a white/black active state. Undo/redo remain available through keyboard shortcuts and Help, without visible toolbar buttons. Toolbar accessibility orientation follows its desktop or narrow layout. Selected layers use a neutral selected surface and blue ink. Numeric values use full-width 32 px fields. Menus and review overlays have restrained offset shadows; Help uses aligned shortcut rows with separators.

Home has a 240 px project rail and an adaptive grid of native page previews, file names, metadata, and explicit actions. Search has a bounded width, New file stays at the opposite end of the row, and import/backup controls remain secondary. Previews are read-only and mounted only near the visible library area; they are neither saved snapshots nor exports. Project dialogs keep compact rows. Artwork in the editor remains uncapped.

No font dependency, document capability, or alternate mobile shell is added. Below 901 px, tools return to a horizontal strip and panels remain overlays. Workspace setup keeps a stacked fallback and recovery disclosure.

## Transient editor motion

Review, the File and Export menus and dismissible notifications use shared 160 ms ease-out entrances and 100 ms ease-in exits, built from opacity and a 4 to 6 px translate. Help, Projects, narrow Layers/Properties panels and tooltips have an entrance only; their dismissal stays immediate. Exiting content is inert and pointer-transparent, and desktop sidebar geometry, canvas work and commands are never delayed. Reduced motion makes every change immediate. See [editor motion](docs/editor-motion.md) for the token set, the surface-by-surface audit and deliberately instant interactions.

## Footer backup affordance

The footer's right-hand download icon uses a 40 px wide target within the existing footer height. Its accessible name and custom hover/focus tooltip are Download editable backup (JSON). Escape dismisses the tooltip without clearing artwork selection. It invokes the same complete editable-file JSON download as File menu backup and the save shortcut; it is not SVG/PDF Export or a successful-save indicator. The tooltip stays above the footer and inside narrow viewports.

## Footer editing context

The left footer shows No selection with current-page artboard and layer counts, a single selection's type and containing artboard, or the existing multiple-selection count. Unparented layers use their own names; unnamed roots use No artboard. Counts include hidden/locked content and update from the active page. Long context truncates with a full-text title instead of overlapping backup. Workspace/page context remains a separate centered item and keeps its existing hidden state at widths of 560 px or less. Context implies neither cloud sync nor successful saving.

## Layer-name width

The type icon occupies a fixed 14 px column with the existing 8 px name gap. Inactive unselected rows give names the space otherwise reserved by visibility/lock controls. Hover, keyboard focus, selection and directly hidden/locked rows reveal a fixed action gutter. Only the right truncation edge changes; the name's start, icon column, row height and sidebar width stay fixed. When a pointer enters from the right over reclaimed name space, newly revealed actions wait until the pointer crosses the normal name region or keyboard focus explicitly enters the row. That first click still selects instead of changing visibility/locking. Already-visible actions keep direct access. Actions do not cover the label. Names retain full-name titles, Shift-click selection and individual branch controls. Arbitrarily long names can still truncate.
