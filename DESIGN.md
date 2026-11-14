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

Desktop uses a 54 px header, 55 px toolbar, 27 px footer, 224 px Layers panel, and 248 px Properties panel. At narrower desktop widths panels shrink to 192 and 224 px. Persistent sidebar icons at the left and right ends of the toolbar row independently collapse or reopen desktop panels. The canvas fills each freed column without resetting the camera or selection. Hidden panels remain mounted to retain their content. At 900 px and below, panels become explicitly toggled, mutually exclusive overlays, separate from desktop visibility preferences. Visibility is session-only and resets on reload. Under 560 px, the SVG action becomes an icon with an accessible label.

Controls have visible instant keyboard focus. Native disabled states change ink, fill, and cursor, and preserve disabled attributes. Disabled controls are exempt from normal text contrast requirements. Fields commit on blur or Enter; drag operations commit once on release. Local-save failure is visible in the header and a live status message.

A dotted world grid provides position context without repainting animation. Artboard titles stay the same screen size while zoom changes. Selection outlines scale inversely with zoom. Text edits use a focused textarea over the artwork; text content never becomes executable HTML.

## Review

Desktop at 1440 by 1000 and mobile at 390 by 844 were inspected in a real browser. Mobile has no document-width overflow and exposes both panels. Design detector returned no findings. Static Hallmark checks have no floor failures; pure black and white are explicitly waived because they are user requirements. Hallmark's render tier was unavailable, so browser captures and interactions provide visual evidence instead. This was a single-agent review, not an independent review.


## Automatic agent connection

The header uses the existing compact agent disclosure to show Agent connected, Waiting for agent, or Agent access paused. App startup connects automatically, with no masked-code field, Pair button, or pairing instructions. A Pause/Resume control lets users opt out per tab. Waiting uses static text, not animation. The disclosure states that trusted local MCP agents can access the workspace while the tab stays open. At narrow widths the accessible icon opens a viewport-contained panel.

## Project and page navigation

A compact project-name action sits before the file name in the header. Its Projects dialog uses a project list and dense file rows, not decorative cards. File rows expose explicit open/rename/duplicate/backup/delete actions. A separate warning and confirmation precedes permanent library deletion. Project/workspace backup and JSON import remain visible above the list.

Pages live above Layers with compact add/rename/duplicate/delete controls. Current-page state uses the existing active color. On narrow screens, project navigation remains a horizontal scrollable list within the dialog; file content takes the remaining space. Pages remain accessible through the Layers overlay. No continuous animation was added.

## Canvas cursors

Canvas-only tool and resize cursors use static 32×32 SVGs with 1.5 px dark ink,
rounded joins, and a 1 px white contrast rim. Placement crosshairs stay at (8, 8)
with smaller tool badges offset below/right. Select points at (5, 3); both hand
states share a palm hotspot at (16, 18). Text and resize cursors center at (16, 16).
Hand silhouettes use white fills. Text placement uses the same outlined I-beam
language, while the inline textarea retains its native text cursor.

Every custom cursor retains its matching native fallback. Cursor styling belongs
only to the canvas SVG and Select-mode resize handles, never panels or controls.
Active pan overrides tool and resize cursors without changing pointer geometry.
