import { createNode, type DesignDocument, type DesignNode } from '@open-cavas/document/model';

/** Original introduction made entirely from editable editor layers. */
export function starterDocument(): DesignDocument {
  const welcome = { ...createNode('artboard', 100, 100), name: 'Welcome to Open Cavas', width: 600, height: 760, fill: '#d9f171' };
  const practice = { ...createNode('artboard', 748, 100), name: 'Try it yourself', width: 600, height: 760, fill: '#d6d5f2' };
  const text = (board: typeof welcome, name: string, content: string, x: number, y: number, width: number, fontSize = 20, heading = false): DesignNode => ({
    ...createNode('text', board.x + x, board.y + y), name, parentId: board.id,
    text: content, width, height: fontSize * 1.3, fontSize,
    fontFamily: heading ? 'Bricolage Grotesque' : 'Inter', fontWeight: heading ? 600 : 400,
    lineHeight: 1.35, letterSpacing: heading ? -1.5 : 0, align: 'left',
    wrap: true, sizing: 'auto-height', fill: '#172015',
  });
  return {
    version: 1, name: 'Welcome to Open Cavas', tokens: {},
    nodes: [
      welcome, practice,
      text(welcome, 'Welcome title', 'Welcome to\nOpen Cavas.', 40, 40, 520, 64, true),
      text(welcome, 'Introduction', 'A canvas for your next idea. Start with text, shapes, and images. Everything here is yours to edit.', 40, 228, 510, 22),
      text(welcome, 'Create heading', 'Start with an artboard', 40, 350, 520, 28, true),
      text(welcome, 'Create instructions', 'Press A, then click or drag on the canvas.\nAdd text with T or a rectangle with R.', 40, 396, 520),
      text(welcome, 'Navigate heading', 'Find your way around', 40, 496, 520, 28, true),
      text(welcome, 'Navigate instructions', 'Hold Space and drag to pan.\nPress Shift + 1 to fit all your artwork.\nProjects holds files; Pages organizes each file.', 40, 542, 520),
      text(welcome, 'Welcome footer', 'No account. No cloud sync. Just your canvas.', 40, 692, 520, 18),
      text(practice, 'Practice title', 'Make it yours.', 40, 40, 520, 52, true),
      text(practice, 'Practice instructions', 'Press V and select a shape below. Move it, resize it, or change its fill in Properties.', 40, 122, 520, 22),
      { ...createNode('rectangle', practice.x + 40, practice.y + 228), name: 'Try changing this rectangle', parentId: practice.id, width: 230, height: 160, fill: '#65618c', radius: 16 },
      { ...createNode('ellipse', practice.x + 320, practice.y + 228), name: 'Try moving this circle', parentId: practice.id, width: 160, height: 160, fill: '#d9f171' },
      text(practice, 'Editable prompt', 'Double-click this text. Say something new.', 40, 416, 520, 24, true),
      text(practice, 'Backup heading', 'Keep what you make', 40, 504, 520, 28, true),
      text(practice, 'Backup instructions', 'Edits save to this machine’s local service. Download JSON for an editable backup. Export SVG to take your artwork elsewhere.', 40, 550, 520),
      text(practice, 'Agent access note', 'Local MCP clients can access new workspaces.\nPause agent access in the File menu.', 40, 672, 520, 18),
    ],
  };
}
