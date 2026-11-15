# Introduction

A new browser visiting the app root sees a welcome page before local workspace selection. It introduces the supported editor workflow without requiring an account or creating sample files.

![Open Cavas welcome page](images/introduction.png)

## Content and controls

- Create an artboard with A; add text with T or a rectangle with R.
- Select with V, move or resize layers, change properties, and double-click text to edit.
- Pan with Space + drag, fit artwork with Shift + 1, and find files and pages through Projects and Pages.
- Edits save to the local workspace service. JSON backups are editable; SVG exports contain artwork. No cloud sync is promised.
- Trusted local MCP clients can access new workspaces automatically. File menu offers Pause agent access.

Choose a workspace and Skip introduction both open the existing chooser. Neither action creates a workspace or changes documents. Creating an empty workspace, copying browser data, and opening existing workspaces remain explicit chooser actions.

## Returning users

Dismissal stores `open-cavas.introduction.v1 = seen` in localStorage for this browser origin. Clearing site storage or using a different browser/origin can show the introduction again. If this optional preference cannot be written, navigation still proceeds, but a later root visit can show it again.

An already selected service workspace opens as before. Workspace queries, file/page queries, and non-root destination paths bypass the welcome page so it does not intercept valid links or hide destination errors. Help > Introduction reopens the same content without changing workspace data. Keyboard shortcuts remains the default Help section. Escape closes Help; editor shortcuts do not run inside it.

On narrow screens, the welcome content stacks and scrolls. Skip introduction remains at the top; the main action follows the content.

## Reference and limits

Paper's public [homepage](https://paper.design/) and [docs index](https://paper.design/docs) informed the focus on a canvas and practical workflows. This is original Open Cavas copy and artwork, not a reproduction of Paper's private onboarding. Paper's private first-run content was not inspected. The colored composition is illustrative, not an embedded editor or an editable document. The introduction does not add cloud sharing, HTML layout, multiplayer, or other unsupported capabilities.

Implementation lives in `src/components/Introduction.tsx` and `introduction.css`, with first-run placement in `WorkspaceAccess.tsx` and replay in `Help.tsx`.
