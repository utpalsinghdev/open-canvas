import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  Copy,
  File,
  Folder,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEditor } from '../editor/store';
import { download, saveDocument } from '../editor/files';
import { IconButton } from './Button';
import { WorkspaceStorage } from './WorkspaceStorage';
import { FilePreview } from './FilePreview';

type Edit =
  | { kind: 'project'; id: string | null; name: string }
  | { kind: 'file'; id: string | null; name: string };
type Removal =
  | { kind: 'project'; id: string; name: string }
  | { kind: 'file'; id: string; name: string };
type Props = {
  onImport: (projectId: string) => void;
  onOpen: () => void;
} & ({ mode: 'home' } | { mode: 'dialog'; onClose: () => void });

/** The same library actions serve the Home destination and editor's quick switcher. */
export function Projects(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const state = useEditor();
  const [projectId, setProjectId] = useState(state.location.projectId);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [search, setSearch] = useState('');
  const project =
    state.workspace.projects.find((project) => project.id === projectId) ??
    state.workspace.projects[0];
  useEffect(() => {
    if (props.mode === 'dialog') dialog.current?.showModal();
    else {
      window.document.title = 'Home / Open Cavas';
      heading.current?.focus();
    }
  }, [props.mode]);
  function run(action: () => void) {
    try {
      action();
    } catch (error) {
      state.notify(
        error instanceof Error ? error.message : 'Project action failed.'
      );
    }
  }
  function submit() {
    if (!edit) return;
    run(() => {
      if (edit.kind === 'project') {
        if (edit.id) state.renameProject(edit.id, edit.name);
        else setProjectId(state.createProject(edit.name));
      } else if (edit.id) state.renameFile(project.id, edit.id, edit.name);
      else {
        state.createFile(project.id, edit.name);
        props.onOpen();
      }
      setEdit(null);
    });
  }
  const content = (
    <>
      <header className="projects-heading">
        {props.mode === 'home'
          ? <h1 id="home-heading" ref={heading} tabIndex={-1}>Files</h1>
          : <h2 id="projects-heading">Projects</h2>}
        <div>
          <button onClick={() => props.onImport(project.id)}>
            <Upload size={14} />
            Import JSON
          </button>
          <button
            onClick={() =>
              download(
                JSON.stringify(state.workspace, null, 2),
                'Open Cavas.workspace.json',
                'application/json'
              )
            }
          >
            <ArrowDownToLine size={14} />
            Workspace backup
          </button>
          {props.mode === 'dialog' && <IconButton
            label="Close projects"
            onClick={() => dialog.current?.close()}
          >
            <X size={18} />
          </IconButton>}
        </div>
      </header>
      <div className="projects-layout">
        <nav className="project-list" aria-label="Projects">
          <div className="project-nav-heading">Projects<span>{state.workspace.projects.length}</span></div>
          <button
            className="new-project-button"
            onClick={() => {
              setEdit({ kind: 'project', id: null, name: '' });
              setRemoval(null);
            }}
          >
            <Plus size={14} />
            New project
          </button>
          {state.workspace.projects.map((item) => (
            <button
              key={item.id}
              aria-pressed={item.id === project.id}
              title={item.name}
              onClick={() => {
                setProjectId(item.id);
                setSearch('');
                setEdit(null);
                setRemoval(null);
              }}
            >
              <Folder size={14} />
              <span>{item.name}</span>
              <span className="muted">{item.files.length}</span>
            </button>
          ))}
        </nav>
        <section className="project-files" aria-label="Project files">
          <div className="project-title">
            <h3>{project.name}</h3>
            <IconButton
              label="Rename project"
              onClick={() =>
                setEdit({ kind: 'project', id: project.id, name: project.name })
              }
            >
              <Pencil size={14} />
            </IconButton>
            <IconButton
              label="Download project"
              onClick={() =>
                download(
                  JSON.stringify(
                    { kind: 'open-cavas-project', version: 1, project },
                    null,
                    2
                  ),
                  `${project.name}.project.json`,
                  'application/json'
                )
              }
            >
              <ArrowDownToLine size={14} />
            </IconButton>
            <IconButton
              label="Delete project"
              disabled={state.workspace.projects.length === 1}
              onClick={() => {
                setRemoval({
                  kind: 'project',
                  id: project.id,
                  name: project.name,
                });
                setEdit(null);
              }}
            >
              <Trash2 size={14} />
            </IconButton>
          </div>
          <div className="files-toolbar">
            <input
              aria-label="Search files"
              placeholder="Search files"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              onClick={() => {
                setEdit({ kind: 'file', id: null, name: '' });
                setRemoval(null);
              }}
            >
              <Plus size={14} />
              New file
            </button>
          </div>
          {edit && (
            <form
              className="library-name-form"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <label>
                {edit.kind === 'project' ? 'Project name' : 'File name'}
                <input
                  aria-label={
                    edit.kind === 'project' ? 'Project name' : 'File name'
                  }
                  key={`${edit.kind}-${edit.id}`}
                  autoFocus
                  value={edit.name}
                  maxLength={160}
                  onChange={(event) =>
                    setEdit({ ...edit, name: event.target.value })
                  }
                />
              </label>
              <button type="submit" disabled={!edit.name.trim()}>
                {edit.id ? 'Save name' : 'Create'}
              </button>
              <button type="button" onClick={() => setEdit(null)}>
                Cancel
              </button>
            </form>
          )}
          {removal && (
            <div className="library-removal" role="alert">
              <p>
                Delete {removal.kind} &quot;{removal.name}&quot;? This removes
                its saved contents and cannot be undone. Download a backup
                first.
              </p>
              <button
                onClick={() =>
                  run(() => {
                    if (removal.kind === 'project')
                      state.deleteProject(removal.id);
                    else state.deleteFile(project.id, removal.id);
                    setRemoval(null);
                  })
                }
              >
                Confirm deletion
              </button>
              <button onClick={() => setRemoval(null)}>Cancel</button>
            </div>
          )}
          <div className="file-list">
            {project.files
              .filter((file) =>
                file.document.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((file) => (
                <div className="file-row" key={file.id}>
                  <button
                    className="file-open"
                    aria-label={`Open file ${file.document.name}`}
                    onClick={() =>
                      run(() => {
                        state.openFile(project.id, file.id);
                        props.onOpen();
                      })
                    }
                  >
                    {props.mode === 'home' && <FilePreview document={file.document} pageId={file.pageId} />}
                    <span className="file-info">
                      <File size={16} />
                      <span>
                      <strong>{file.document.name}</strong>
                      <small>
                        {file.document.pages.length}{' '}
                        {file.document.pages.length === 1 ? 'page' : 'pages'}
                        {file.id === state.location.fileId ? ', last opened' : ''}
                      </small>
                      </span>
                    </span>
                  </button>
                  <div className="file-actions">
                    <IconButton
                      label={`Rename file ${file.document.name}`}
                      onClick={() => {
                        setEdit({
                          kind: 'file',
                          id: file.id,
                          name: file.document.name,
                        });
                        setRemoval(null);
                      }}
                    >
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton
                      label={`Duplicate file ${file.document.name}`}
                      onClick={() =>
                        run(() => {
                          state.duplicateFile(project.id, file.id);
                        })
                      }
                    >
                      <Copy size={14} />
                    </IconButton>
                    <IconButton
                      label={`Download file ${file.document.name}`}
                      onClick={() => saveDocument(file.document)}
                    >
                      <ArrowDownToLine size={14} />
                    </IconButton>
                    <IconButton
                      label={`Delete file ${file.document.name}`}
                      disabled={project.files.length === 1}
                      onClick={() => {
                        setRemoval({
                          kind: 'file',
                          id: file.id,
                          name: file.document.name,
                        });
                        setEdit(null);
                      }}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </div>
              ))}
            {!project.files.some((file) =>
              file.document.name.toLowerCase().includes(search.toLowerCase())
            ) && <p className="panel-empty">No matching files.</p>}
          </div>
        </section>
      </div>
      <footer>
        <WorkspaceStorage />
        Import backups as new items without replacing existing work.
      </footer>
    </>
  );
  return props.mode === 'home'
    ? <main className="home-library" aria-labelledby="home-heading">{content}</main>
    : <dialog ref={dialog} className="projects-dialog" aria-labelledby="projects-heading" onClose={props.onClose}>{content}</dialog>;
}
