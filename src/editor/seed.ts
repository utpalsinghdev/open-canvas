import { newId, createNode, type DesignDocument, type DesignNode } from './model';

export function starterDocument(): DesignDocument {
  const poster = { ...createNode('artboard', 100, 100), id: 'poster', name: '01 / A little space', width: 640, height: 500, fill: '#d9f171' };
  const note = { ...createNode('artboard', 800, 100), id: 'note', name: '02 / A fresh start', width: 320, height: 500, fill: '#d6d5f2' };
  const text = (name: string, content: string, x: number, y: number, width: number, fontSize: number, parentId: string, fill = '#172015'): DesignNode => ({
    ...createNode('text', x, y), kind: 'text', id: newId(), name,
    text: content, width, height: fontSize * 2.6, fontSize, fontFamily: 'Arial', fontWeight: '500', align: 'left', parentId, fill,
  });
  return {
    version: 1, name: 'A little space',
    nodes: [
      poster, note,
      text('Studio label', 'Open Cavas / Starter study', 136, 132, 500, 14, 'poster'),
      text('Headline', 'A little less.\nA lot more.', 132, 193, 570, 76, 'poster'),
      { ...createNode('ellipse', 530, 421), id: 'orbit', parentId: 'poster', name: 'Circle', width: 160, height: 160, fill: '#172015' },
      text('Footnote', 'Room to think.\nSpace to make.', 136, 502, 300, 18, 'poster'),
      text('Note label', 'An open invitation', 828, 134, 250, 14, 'note', '#282542'),
      { ...createNode('rectangle', 828, 186), id: 'block', parentId: 'note', name: 'Color field', width: 264, height: 140, fill: '#65618c', radius: 70 },
      text('Note headline', 'Start with\nsomething.', 828, 362, 270, 39, 'note', '#282542'),
      text('Note footer', 'Make it yours.', 828, 548, 250, 14, 'note', '#282542'),
    ],
  };
}
