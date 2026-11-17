import { useEffect, useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode };

export function IconButton({ label, children, ...props }: IconButtonProps) {
  return <button type="button" className="icon-button" title={label} aria-label={label} {...props}>{children}</button>;
}

/** Explicit tooltip supports keyboard focus and Escape, unlike a native title. */
export function TooltipIconButton({ label, ...props }: IconButtonProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const visible = open && !props.disabled;
  useEffect(() => {
    if (!visible) return;
    function dismiss(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
    document.addEventListener('keydown', dismiss, true);
    return () => document.removeEventListener('keydown', dismiss, true);
  }, [visible]);
  return <span className="tooltip-anchor" onPointerEnter={() => setOpen(true)} onPointerLeave={(event) => {
    if (!event.currentTarget.contains(event.currentTarget.ownerDocument.activeElement)) setOpen(false);
  }} onFocus={() => setOpen(true)} onBlur={(event) => {
    if (!event.currentTarget.matches(':hover')) setOpen(false);
  }}>
    <IconButton {...props} label={label} title={undefined} aria-describedby={visible ? id : undefined} />
    {visible && <span id={id} role="tooltip" className="control-tooltip">{label}</span>}
  </span>;
}
