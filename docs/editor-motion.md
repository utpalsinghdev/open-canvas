# Editor motion

Editor chrome uses shared tokens in `apps/web/src/motion.css`: 160 ms decelerating entrances and 100 ms accelerating exits. Motion uses opacity and small translations, without loops, blur, scale effects or animated layout. Actions execute immediately; animation never schedules a document command.

## Transient-surface audit

- **Review list, new-comment composer and conversation:** enter and exit through `SurfacePresence`. Closing immediately marks the retained surface inert, pointer-transparent and hidden from assistive technology, restores focus, then removes its content after the exit. Reopening interrupts the current animation rather than waiting for it. Switching between list, draft and thread content is immediate; it never queues old conversations. Position updates track the anchor without easing camera motion.
- **File and Export dropdowns:** native `details` keeps its existing keyboard, Escape, focus-exit and outside-click behavior. Supporting browsers transition the contents with `::details-content` and discrete content visibility. Closing removes interaction immediately; the remaining pixels can fade out. Browsers without that CSS support keep native instant dismissal rather than a JavaScript replacement for native disclosure behavior.
- **Help and Projects dialogs:** brief entrance and backdrop fade. Native dialog close, Escape, focus restoration and modal release remain immediate. No delayed modal close or retained top-layer blocker.
- **Narrow Layers and Properties overlays:** brief entrance; close and switch remain immediate so an old panel cannot obscure the newly selected one. Desktop sidebar collapse/expand stays instant to preserve canvas geometry and gesture coordinates.
- **Dismissible notifications:** enter and exit through `SurfacePresence`; replacement text updates immediately without restarting motion. The existing eight-second lifetime and action timing are unchanged.
- **Persistent save-recovery notice and save-failure indicators:** instant. They report a safety condition, not a decorative notification; recovery must not wait for an effect.
- **Native selects, font datalist, file chooser, browser tooltips and storage/recovery disclosures:** remain native and instant. Their platform-controlled presentation and inline layout do not need a second lifecycle.
- **Library rename/create/deletion forms and validation messages:** instant, keeping focused input and confirmation/error feedback immediately available.
- **Workspace selection, Home/file/page navigation, layer expansion, review pins and target previews:** instant. These are navigation, content or direct targeting rather than floating-surface entrances.
- **Canvas drawing, selection, panning, zoom, resizing, typing and command/history execution:** unchanged and instant. No editor motion is serialized to artwork, JSON backups, SVG, PNG or PDF.
- **Page request indicator:** retains its existing finite signal; this change adds no activity animation.

## Reduced motion and lifecycle

`prefers-reduced-motion: reduce` skips CSS motion and Web Animations entirely. Enabling the preference during a Review or notification animation cancels it and finishes the current visibility change. No animation completion event is needed in reduced-motion mode. Unmounting cancels owned animations, and rapid reopens cancel stale completion callbacks.

Review remains nonmodal: Escape and its Close/Cancel controls dismiss it; outside clicks continue to interact with the canvas rather than acquiring new modal dismissal behavior. Menus retain outside-click dismissal. Dialogs retain their native focus and modal semantics.

## Verification

See [verification record](verification.md) for observed checks and browser coverage. Before/after screenshots show the same settled states; timing and interruption require live-browser observation, not a claim based on still images.
