import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  ChevronDown,
  FolderOpen,
  House,
  Frame,
  HelpCircle,
  Layers2,
  MessagesSquare,
  PanelLeft,
  PanelRight,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { Canvas } from './components/Canvas';
import { Layers } from './components/Layers';
import { Inspector } from './components/Inspector';
import { Toolbar } from './components/Toolbar';
import { AgentConnection } from './components/AgentConnection';
import { Help } from './components/Help';
import { ExportMenu } from './components/ExportMenu';
import { IconButton } from './components/Button';
import { EditorFooter } from './components/EditorFooter';
import { useEditor } from './editor/store';
import { useCamera } from './editor/useCamera';
import { useShortcuts } from './editor/useShortcuts';
import {
  exportSvg,
  readImage,
  saveDocument,
} from './editor/files';
import { currentFile } from '@open-cavas/document/workspace';
import { createNode, newId } from '@open-cavas/document/model';
import { usePageReview } from './review/drafts';

export function EditorApp({ onHome, onProjects, onImport }: {
  onHome: () => void;
  onProjects: () => void;
  onImport: () => void;
}) {
  const {
    document,
    workspace,
    location,
    saveState,
    notify,
    edit,
    createFile,
    select,
  } = useEditor();
  const controls = useCamera();
  const [panel, setPanel] = useState<'layers' | 'properties' | null>(null);
  const [layersVisible, setLayersVisible] = useState(true);
  const [propertiesVisible, setPropertiesVisible] = useState(true);
  const [help, setHelp] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { page: reviewPage, update: updateReview } = usePageReview(location);
  function toggleReviews() {
    setPanel(null);
    if (!commentsOpen && !Object.values(reviewPage.bodies).some((body) => body.trim()))
      updateReview({ threadId: null, anchor: null });
    setCommentsOpen((open) => !open);
  }
  const project = workspace.projects.find(
    (project) => project.id === location.projectId
  );
  const fileMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && fileMenu.current && !fileMenu.current.contains(event.target)) fileMenu.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !fileMenu.current?.open) return;
      event.preventDefault();
      event.stopPropagation();
      fileMenu.current.open = false;
      fileMenu.current.querySelector('summary')?.focus();
    }
    window.document.addEventListener('pointerdown', outside);
    window.document.addEventListener('keydown', escape, true);
    return () => {
      window.document.removeEventListener('pointerdown', outside);
      window.document.removeEventListener('keydown', escape, true);
    };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(controls.fit);
    return () => cancelAnimationFrame(frame);
  }, [location.fileId, location.pageId, controls.fit]);
  const imageInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const [name, setName] = useState(document.name);
  useEffect(() => {
    setName(document.name);
    window.document.title = `${document.name} / Open Canvas`;
  }, [document.name]);
  const save = useCallback(() => {
    const state = useEditor.getState();
    saveDocument(currentFile(state.workspace, state.location).document);
    useEditor.getState().notify('JSON backup downloaded.');
  }, []);
  const exportFile = useCallback(() => {
    try {
      const state = useEditor.getState();
      const current = currentFile(state.workspace, state.location);
      const page = current.document.pages.find(
        (page) => page.id === state.location.pageId
      );
      exportSvg(
        {
          ...state.document,
          name: `${state.document.name} - ${page?.name ?? 'Page'}`,
        },
        state.selectedIds
      );
      state.notify('SVG exported.');
    } catch (error) {
      useEditor
        .getState()
        .notify(error instanceof Error ? error.message : 'Export failed.');
    }
  }, []);
  useShortcuts({
    fit: controls.fit,
    zoomTo: controls.zoomTo,
    save,
    exportFile,
  });

  async function addImage(file: File) {
    const target = useEditor.getState().location;
    try {
      const image = await readImage(file);
      if (!mounted.current) throw new Error('Image import cancelled because the editor was closed.');
      const state = useEditor.getState();
      if (
        target.projectId !== state.location.projectId ||
        target.fileId !== state.location.fileId ||
        target.pageId !== state.location.pageId
      )
        throw new Error(
          'Image import cancelled because the active file or page changed.'
        );
      const chosen = state.document.nodes.find((node) =>
        state.selectedIds.includes(node.id)
      );
      const board =
        chosen?.kind === 'artboard'
          ? chosen
          : state.document.nodes.find((node) => node.id === chosen?.parentId);
      const element = controls.viewport.current;
      const x = board
        ? board.x + 24
        : ((element?.clientWidth ?? 800) / 2 - controls.camera.x) /
            controls.camera.zoom -
          image.width / 2;
      const y = board
        ? board.y + 24
        : ((element?.clientHeight ?? 600) / 2 - controls.camera.y) /
            controls.camera.zoom -
          image.height / 2;
      const node = {
        ...createNode('rectangle', Math.round(x), Math.round(y)),
        ...image,
        kind: 'image',
        id: newId(),
        name: file.name.slice(0, 160),
        parentId: board?.id ?? null,
      } satisfies import('@open-cavas/document/model').DesignNode;
      if (edit((doc) => ({ ...doc, nodes: [...doc.nodes, node] }))) {
        select([node.id]);
        notify('Image added.');
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Image import failed.');
    }
  }
  function closeMenu(element: HTMLElement) {
    element.closest('details')?.removeAttribute('open');
  }

  return (
    <div className={`app-shell ${panel ? `show-${panel}` : ''} ${layersVisible ? '' : 'hide-layers'} ${propertiesVisible ? '' : 'hide-properties'}`}>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">
            <Frame size={18} strokeWidth={1.6} />
          </span>
          <span>Open Canvas</span>
        </div>
        <IconButton
          className="icon-button desktop-panel-control"
          label={layersVisible ? 'Collapse Layers sidebar' : 'Expand Layers sidebar'}
          aria-expanded={layersVisible}
          aria-controls="layers-panel"
          onClick={() => setLayersVisible((visible) => !visible)}
        >
          <PanelLeft size={17} />
        </IconButton>
        <button className="home-button" onClick={onHome}>
          <House size={15} />Home
        </button>
        <div className="document-controls">
          <span className="header-slash">/</span>
          <button
            className="project-switcher"
            aria-label="Open projects"
            title={`Project: ${project?.name ?? ''}`}
            onClick={() => onProjects()}
          >
            <FolderOpen size={15} />
            <span>{project?.name}</span>
          </button>
          <span className="header-slash">/</span>
          <input
            ref={nameInput}
            className="document-name"
            aria-label="Document name"
            value={name}
            maxLength={160}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => {
              const next = name.trim() || 'Untitled';
              setName(next);
              if (next !== document.name)
                edit((doc) => ({ ...doc, name: next }));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
          <details ref={fileMenu} className="file-menu" onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
          }}>
            <summary aria-label="File menu">
              <span>File</span>
              <ChevronDown size={14} />
            </summary>
            <div className="file-menu-items">
              <button
                onClick={(event) => {
                  createFile(location.projectId, 'Untitled');
                  closeMenu(event.currentTarget);
                }}
              >
                <Plus size={15} />
                New file
              </button>
              <button
                onClick={(event) => {
                  onImport();
                  closeMenu(event.currentTarget);
                }}
              >
                <FolderOpen size={15} />
                Open JSON
              </button>
              <button
                onClick={(event) => {
                  save();
                  closeMenu(event.currentTarget);
                }}
              >
                <Save size={15} />
                Download JSON
              </button>
              <button
                onClick={(event) => {
                  nameInput.current?.focus();
                  closeMenu(event.currentTarget);
                }}
              >
                Rename file
              </button>
              <AgentConnection />
            </div>
          </details>
        </div>
        <div className="header-actions">
          {saveState === 'failed' && <span className="save-status save-failed" role="alert">
            <AlertTriangle size={12} />
            Not saved
          </span>}
          <button className="review-toggle desktop-panel-control" aria-label="Review threads" aria-expanded={commentsOpen} onClick={toggleReviews}>
            <MessagesSquare size={17} /><span>Review</span>
          </button>
          <IconButton
            className="icon-button desktop-panel-control"
            label={propertiesVisible ? 'Collapse Properties sidebar' : 'Expand Properties sidebar'}
            aria-expanded={propertiesVisible}
            aria-controls="properties-panel"
            onClick={() => setPropertiesVisible((visible) => !visible)}
          >
            <PanelRight size={17} />
          </IconButton>
          <IconButton label="Keyboard shortcuts and help" onClick={() => setHelp(true)}>
            <HelpCircle size={17} />
          </IconButton>
          <ExportMenu onSvg={exportFile} />
        </div>
      </header>
      <div className="workspace-bar">
        <Toolbar onImage={() => imageInput.current?.click()} onComment={() => { setPanel(null); setCommentsOpen(false); }} />
      </div>
      <div className="mobile-panel-controls">
        <button
          aria-pressed={panel === 'layers'}
          aria-expanded={panel === 'layers'}
          aria-controls="layers-panel"
          onClick={() => { setCommentsOpen(false); setPanel(panel === 'layers' ? null : 'layers'); }}
        >
          <Layers2 size={15} />
          Layers
        </button>
        <button
          aria-pressed={panel === 'properties'}
          aria-expanded={panel === 'properties'}
          aria-controls="properties-panel"
          onClick={() => { setCommentsOpen(false); setPanel(panel === 'properties' ? null : 'properties'); }}
        >
          <PanelRight size={15} />
          Properties
        </button>
        <button aria-label="Review threads" aria-expanded={commentsOpen} onClick={toggleReviews}>
          <MessagesSquare size={15} />Review
        </button>
        {panel && (
          <IconButton label="Close panel" onClick={() => setPanel(null)}>
            <X size={15} />
          </IconButton>
        )}
      </div>
      <main className="editor-workspace">
        <Layers key={location.fileId} />
        <Canvas
          key={`${location.fileId}:${location.pageId}`}
          controls={controls}
          review={{ open: commentsOpen, setOpen: setCommentsOpen }}
        />
        <Inspector />
      </main>
      <EditorFooter onSave={save} />
      <input
        ref={imageInput}
        className="hidden"
        aria-label="Add image file"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void addImage(file);
        }}
      />
      {help && <Help onClose={() => setHelp(false)} />}
    </div>
  );
}
