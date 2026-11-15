import { ArrowRight, Frame } from 'lucide-react';
import './introduction.css';

const SEEN = 'open-cavas.introduction.v1';

/** A browser preference only. Never modifies workspace or document data. */
export function needsIntroduction() {
  const { pathname, search } = window.location;
  if (pathname !== '/' || ['workspace', 'project', 'file', 'page'].some((key) => new URLSearchParams(search).has(key))) return false;
  try { return localStorage.getItem(SEEN) !== 'seen'; }
  catch { return true; }
}

export function dismissIntroduction() {
  try { localStorage.setItem(SEEN, 'seen'); }
  catch { /* Browsing can continue when this optional preference cannot be saved. */ }
}

export function IntroductionContent() {
  return <div className="introduction-content">
    <div className="introduction-copy">
      <h1 id="introduction-heading">Welcome to<br />Open Cavas.</h1>
      <p className="introduction-lead">An open canvas for your next idea. Arrange text, shapes, and images, then take your design with you.</p>
      <dl className="introduction-basics">
        <div><dt>Start with an artboard <kbd>A</kbd></dt><dd>Choose Artboard, then click or drag on the canvas. Add text with <kbd>T</kbd> or a rectangle with <kbd>R</kbd>.</dd></div>
        <div><dt>Make it yours <kbd>V</kbd></dt><dd>Select a layer to move or resize it. Change its color and type in Properties. Double-click text to edit.</dd></div>
        <div><dt>Find your way <kbd>Space + drag</kbd></dt><dd>Pan around the canvas. Use <kbd>Shift + 1</kbd> to fit your artwork in view. Projects holds your files; Pages organizes each file.</dd></div>
      </dl>
    </div>
    <figure className="introduction-artwork" aria-label="Example composition with a yellow artboard, large type, and overlapping shapes">
      <div className="introduction-board" aria-hidden="true">
        <span className="introduction-board-label">A little space to explore</span>
        <span className="introduction-board-title">Ideas<br />take<br />shape.</span>
        <div className="introduction-shape" />
        <span className="introduction-board-footer">Start anywhere. Make it yours.</span>
      </div>
      <figcaption>Your canvas starts with you.</figcaption>
    </figure>
    <div className="introduction-details">
      <section><h2>Local by default</h2><p>No account needed. Choose a workspace on this machine. Edits save to the local service; download JSON for an editable backup or export SVG for artwork. No cloud sync.</p></section>
      <section><h2>Work with your tools</h2><p>Trusted local MCP clients can access new workspaces automatically. Pause agent access in the File menu whenever you want. This is a local editor, not a public sharing service.</p></section>
    </div>
  </div>;
}

export function Introduction({ onContinue }: { onContinue: () => void }) {
  return <main className="introduction" aria-labelledby="introduction-heading">
    <header className="introduction-header"><span className="brand"><Frame size={18} strokeWidth={1.6} />Open Cavas</span><button className="text-button" onClick={onContinue}>Skip introduction<ArrowRight size={14} /></button></header>
    <IntroductionContent />
    <footer className="introduction-footer"><button className="export-button" onClick={onContinue}>Choose a workspace<ArrowRight size={16} /></button><p>Find this introduction again in Help.</p></footer>
  </main>;
}
