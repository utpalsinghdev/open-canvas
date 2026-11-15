# Design system

## Editor contract

Open Cavas is a working editor, not a marketing page. The user's pinned direction is true black application background, white primary text, dense controls, minimal copy, and no decorative card or pill chrome. Artwork colors are user content, not editor theme colors.

The first viewport exposes editable starter artboards between Layers and Properties. Tool selection and direct manipulation are the main interaction. No continuous animation, pulse, glow, or spinner runs in the editor.

## Tokens

The authoritative tokens are declared in `src/styles.css` under `:root`.

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

Desktop uses a 54 px header, 55 px toolbar, 27 px footer, 224 px Layers panel, and 248 px Properties panel. At narrower desktop widths panels shrink to 192 and 224 px. Persistent sidebar icons at the left and right ends of the toolbar row independently collapse or reopen desktop panels. The canvas fills each freed column without resetting the camera or selection. Hidden panels remain mounted to retain their content. At 900 px and below, panels become explicitly toggled, mutually exclusive overlays, separate from desktop visibility preferences. Visibility is session-only and resets on reload. Under 560 px, the Export action becomes an icon with an accessible label; format and scope remain visible in its dropdown.

Controls have visible instant keyboard focus. Native disabled states change ink, fill, and cursor, and preserve disabled attributes. Disabled controls are exempt from normal text contrast requirements. Fields commit on blur or Enter; drag operations commit once on release. Local-save failure is visible in the header and a persistent recovery notice. The notice takes precedence over dismissible notifications, includes expandable bounded error details, and opens Projects for workspace backup. It has no dismiss or retry action and stays until saving the current workspace succeeds or a successful reload clears it.

A dotted world grid provides position context without repainting animation. Artboard titles stay the same screen size while zoom changes. Selection outlines scale inversely with zoom. Text edits use a focused textarea over the artwork; text content never becomes executable HTML.

## Review threads

The Comment drawing tool selects click-to-comment mode with a crosshair; clicking artwork anchors feedback to that layer, while clicking empty canvas anchors feedback to world coordinates. Comments uses the existing toolbar icon language and a dense black panel over the canvas, with file-wide thread rows and text-first feedback. On mobile the Comments action lives beside Layers/Properties and its panel occupies the lower canvas, leaving room to place pins above it. Open threads have fixed-screen-size numbered pins; resolved and missing-layer threads remain in the list without pins. The panel scrolls independently of camera pan/zoom. Thread navigation centers targets outside the panel. All controls retain visible focus; comment content stays plain text.

## Review

Desktop at 1440 by 1000 and mobile at 390 by 844 were inspected in a real browser. Mobile has no document-width overflow and exposes both panels. Design detector returned no findings. Static Hallmark checks have no floor failures; pure black and white are explicitly waived because they are user requirements. Hallmark's render tier was unavailable, so browser captures and interactions provide visual evidence instead. This was a single-agent review, not an independent review.


## Automatic agent connection

App startup connects automatically, with no connection badge, masked-code field, Pair button, or pairing instructions. Pause/Resume agent access lives in the File menu and lets users persistently opt out for the selected service workspace. Routine saving/saved labels are omitted from the header; failed saves remain visible, including at narrow widths.

## Project and page navigation

A compact project-name action sits before the file name in the header. Its Projects dialog uses a project list and dense file rows, not decorative cards. File rows expose explicit open/rename/duplicate/backup/delete actions. A separate warning and confirmation precedes permanent library deletion. Project/workspace backup and JSON import remain visible above the list.

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

Nine blue 5 px squares form a precise 37 by 25 px lattice above the displayed page artwork's leading corner, outside the artwork SVG. A pale-blue light sequence crosses the fixed geometry diagonally; the dots never jump, bounce, merge, or rotate. The sequence finishes within 2.04 seconds, then leaves a static blue pending mark. Only the opacity of each dot's highlight animates, without blur, filters, or looping. Reduced motion shows the static lattice immediately. The mark stays screen-sized, follows the page bounds, and clamps inside the viewport when panned offscreen. Accessible status names “Agent processing a request on this page”; no text badge or decorative container is drawn. Clearing status makes no success or save claim.

## Local workspace selection

First load shows a dense local workspace chooser before mounting the editor. Existing service workspaces are explicit choices. Creating an empty workspace and copying browser data are separate actions; copying keeps original browser storage untouched. Errors stay visible. File menu exposes persistent Pause/Resume and Switch local workspace. No automatic profile merge or headless connection badge is added.

## PDF export action

One compact Export dropdown replaces separate SVG and PDF header buttons. Its two rows include their scope: SVG · Selected artboard or SVG · Current page, and PDF · Selected artboards or PDF · Current page. PDF puts selected artboards on separate pages in one file. Pending export disables only the PDF row with static progress text; completion and actionable errors use the existing notification area. The menu remains inside narrow viewports, supports normal keyboard focus, and dismisses on Escape, outside click, or focus leaving it. JSON backup remains in the File menu.
