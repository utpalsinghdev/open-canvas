import type { ComponentProps } from 'react';

// Screen-sized contrast rim belongs to editor chrome, never the artwork renderer.
export function CanvasOutline({ zoom, strokeWidth = 1, className = '', ...props }:
  Omit<ComponentProps<'rect'>, 'strokeWidth'> & { zoom: number; strokeWidth?: number }) {
  return <>
    <rect {...props} className={`${className} canvas-contrast-rim`} strokeWidth={(strokeWidth + 2) / zoom} pointerEvents="none" />
    <rect {...props} className={className} strokeWidth={strokeWidth / zoom} />
  </>;
}
