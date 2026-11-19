# Editor motion

Transient editor chrome shares one set of tokens in `apps/web/src/motion.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--ui-enter-duration` | 160 ms | Entrances |
| `--ui-exit-duration` | 100 ms | Exits |
| `--ui-enter-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Short ease-out |
| `--ui-exit-easing` | `cubic-bezier(0.4, 0, 1, 1)` | Quicker ease-in |
| `--ui-surface-offset` | `0 4px` (Review panel `6px 0`) | Small `translate` that accompanies the fade |

Motion uses only `opacity` and `translate`. There are no loops, blur, scale, shimmer, pulse, spinners or animated layout. Actions run immediately: nothing waits for an animation, and no motion is stored in the document, undo history, backups or exports.

## How surfaces animate

- **Retained surfaces** (Review, notifications) render through `SurfacePresence`. It keeps the last open content mounted while it is marked `data-presence="closed"`, sets `inert` on it at once, and unmounts it when its CSS transitions settle. `.surface-presence[inert]` content is also `pointer-events: none`, so an exiting surface is neither focusable nor a hit target. Reopening reverses the running transition from its current opacity. Under reduced motion no transition exists, so the content unmounts immediately, including when the preference changes mid-animation.
- **File and Export menus** stay native `details` elements. In browsers that support `::details-content` and discrete transitions, the contents transition `content-visibility`, opacity and translate. `useMenuInert` makes the items inert the moment `open` clears, so a fading menu cannot take focus or clicks. Other browsers keep the native instant open and close.
- **Dialogs and narrow panels** use an entrance keyframe only (see the table).
- **Tooltips** use an opacity-only entrance.

## Transient-surface audit

| Surface | Motion | Reason |
| --- | --- | --- |
| Review list, new-comment composer, conversation | Enter and exit | Nonmodal overlay. One surface persists across list, draft and thread content, so switching between them never replays motion or queues an old conversation. Position follows the anchor without easing camera movement. |
| File menu, Export menu | Enter and exit where supported | Dropdown. Native keyboard, Escape, focus-exit and outside-click behavior is unchanged. |
| Dismissible notifications (toast) | Enter and exit | Replacement text updates in place without restarting motion. The eight-second lifetime is unchanged. |
| Help dialog, Projects dialog | Enter and backdrop fade only | Native modal. A delayed exit would keep a top-layer blocker over the editor, so Escape, close and focus restoration stay immediate. |
| Narrow Layers and Properties overlays | Enter only | Closing and switching are instant so an old panel can never cover the newly selected one. |
| Hover and focus tooltips (`TooltipIconButton`) | Enter only | Hint, not a state change. It unmounts the moment pointer or focus leaves, and Escape still dismisses it. |
| Desktop sidebar collapse and expand | Instant | Changes canvas geometry and gesture coordinates. |
| Persistent save-recovery notice, Not saved indicator | Instant | Safety conditions must not wait for an effect. |
| Comment target hint, review pins, draft pin | Instant | Follow the pointer or artwork. |
| Review hint, warnings, empty and error states | Instant | Inline content. |
| Native selects, font datalist, file chooser, browser `title` tooltips, storage and changelog disclosures | Instant | Platform-controlled. |
| Library rename, create and delete forms, validation messages | Instant | Focused input and confirmation must be available at once. |
| Home, workspace chooser, file and page navigation, layer expansion, project switcher list | Instant | Navigation and content, not floating surfaces. |
| Canvas drawing, selection, pan, zoom, resize, text typing, commands, undo and redo | Instant | Never delayed by chrome motion. |
| Agent request dots and MCP creation reveal | Unchanged | Existing finite effects with their own reduced-motion rules. |

## Interaction rules

- Review stays nonmodal. Escape and Close or Cancel dismiss it and return focus to the control that opened it. Outside clicks keep reaching the canvas.
- Menus keep outside-click and focus-exit dismissal. Closing is observable at once: `open` clears, items go inert and focus returns to the summary on Escape.
- Dialogs keep native modal focus handling.
- `prefers-reduced-motion: reduce` removes every transition and keyframe in `motion.css`, so state changes are immediate.

## Verification

See the [verification record](verification.md). Motion and interruption need live-browser sampling; still screenshots show only settled states.
