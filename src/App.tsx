import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  FolderOpen,
  Frame,
  HelpCircle,
  Layers2,
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
import { IconButton } from './components/Button';
import { useEditor } from './editor/store';
import { useCamera } from './editor/useCamera';
import { useShortcuts } from './editor/useShortcuts';
import {
  exportSvg,
  readDocument,
  readImage,
  saveDocument,
} from './editor/files';
import { Projects } from './components/Projects';
import { currentFile } from './workspace/model';
import { createNode, newId } from './editor/model';
import { useDestination } from './workspace/useDestination';

export default function App() {
  const destination = useDestination();
  if (destination.error === undefined) return <main>Opening destination</main>;
  if (destination.error) {
    return (
      <main className="help-dialog" aria-labelledby="destination-heading">
        <h1 id="destination-heading">Destination unavailable</h1>
        <p role="alert">{destination.error}</p>
        <p>Links identify local files. They do not share their contents.</p>
        <button className="export-button" onClick={destination.recover}>
          Open last workspace
        </button>
      </main>
    );
  }

  return <EditorApp />;
}

function EditorApp() {
  const {
    document,
    workspace,
    location,
    selectedIds,
    saveState,
    message,
    notify,
    edit,
    importData,
    createFile,
    select,
  } = useEditor();
  const controls = useCamera();
  const [panel, setPanel] = useState<'layers' | 'properties' | null>(null);
  const [layersVisible, setLayersVisible] = useState(true);
  const [propertiesVisible, setPropertiesVisible] = useState(true);
  const [help, setHelp] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const project = workspace.projects.find(
    (project) => project.id === location.projectId
  );
  const file = currentFile(workspace, location);
  const activePage = file.document.pages.find(
    (page) => page.id === location.pageId
  );
  useEffect(() => {
    const frame = requestAnimationFrame(controls.fit);
    return () => cancelAnimationFrame(frame);
  }, [location.fileId, location.pageId, controls.fit]);
  const imageInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(document.name);
  useEffect(() => {
    setName(document.name);
    window.document.title = `${document.name} / Open Cavas`;
  }, [document.name]);
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => notify(''), 8000);
    return () => clearTimeout(timeout);
  }, [message, notify]);
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

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const targetProject = useEditor.getState().location.projectId;
    try {
      importData(await readDocument(file), targetProject);
      setProjectsOpen(false);
      notify('Imported as new files/projects. Existing work was kept.');
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not open document.'
      );
    }
  }
  async function addImage(file: File) {
    const target = useEditor.getState().location;
    try {
      const image = await readImage(file);
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
      } satisfies import('./editor/model').DesignNode;
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
          <span>Open Cavas</span>
        </div>
        <div className="document-controls">
          <span className="header-slash">/</span>
          <button
            className="project-switcher"
            aria-label="Open projects"
            onClick={() => setProjectsOpen(true)}
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
          <details className="file-menu">
            <summary aria-label="File menu">
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
                  documentInput.current?.click();
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
            </div>
          </details>
        </div>
        <div className="header-actions">
          <AgentConnection />
          <span
            className={`save-status ${saveState === 'failed' ? 'save-failed' : ''}`}
          >
            <Check size={12} />
            {saveState === 'saved'
              ? 'Saved locally'
              : saveState === 'pending'
                ? 'Saving'
                : 'Not saved'}
          </span>
          <button
            className="export-button"
            aria-label="Export SVG"
            onClick={exportFile}
          >
            <ArrowDownToLine size={14} />
            <span>Export SVG</span>
          </button>
        </div>
      </header>
      <div className="workspace-bar">
        <div className="workspace-label">
          <IconButton
            label={layersVisible ? 'Collapse Layers sidebar' : 'Expand Layers sidebar'}
            aria-expanded={layersVisible}
            aria-controls="layers-panel"
            onClick={() => setLayersVisible((visible) => !visible)}
          >
            <PanelLeft size={17} />
          </IconButton>
          <span>Page</span>
          <span className="muted">/</span>
          <span>{activePage?.name}</span>
        </div>
        <Toolbar onImage={() => imageInput.current?.click()} />
        <div className="workspace-end">
          <IconButton
            className="icon-button desktop-panel-control"
            label={propertiesVisible ? 'Collapse Properties sidebar' : 'Expand Properties sidebar'}
            aria-expanded={propertiesVisible}
            aria-controls="properties-panel"
            onClick={() => setPropertiesVisible((visible) => !visible)}
          >
            <PanelRight size={17} />
          </IconButton>
          <IconButton
            label="Keyboard shortcuts and help"
            onClick={() => setHelp(true)}
          >
            <HelpCircle size={17} />
          </IconButton>
        </div>
      </div>
      <div className="mobile-panel-controls">
        <button
          aria-pressed={panel === 'layers'}
          aria-expanded={panel === 'layers'}
          aria-controls="layers-panel"
          onClick={() => setPanel(panel === 'layers' ? null : 'layers')}
        >
          <Layers2 size={15} />
          Layers
        </button>
        <button
          aria-pressed={panel === 'properties'}
          aria-expanded={panel === 'properties'}
          aria-controls="properties-panel"
          onClick={() => setPanel(panel === 'properties' ? null : 'properties')}
        >
          <PanelRight size={15} />
          Properties
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
        />
        <Inspector />
      </main>
      <footer className="status-bar">
        <span>
          {selectedIds.length
            ? `${selectedIds.length} selected`
            : 'Local-first design editor'}
        </span>
        <span>Open Cavas / Web preview</span>
        <button onClick={save}>Download backup</button>
      </footer>
      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <IconButton label="Dismiss message" onClick={() => notify('')}>
            <X size={14} />
          </IconButton>
        </div>
      )}
      <input
        ref={documentInput}
        className="hidden"
        aria-label="Open document file"
        type="file"
        accept=".json,application/json"
        onChange={importFile}
      />
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
      {projectsOpen && (
        <Projects
          onClose={() => setProjectsOpen(false)}
          onImport={() => documentInput.current?.click()}
        />
      )}
      {help && <Help onClose={() => setHelp(false)} />}
    </div>
  );
}
