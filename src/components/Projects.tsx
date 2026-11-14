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

type Edit =
  | { kind: 'project'; id: string | null; name: string }
  | { kind: 'file'; id: string | null; name: string };
type Removal =
  | { kind: 'project'; id: string; name: string }
  | { kind: 'file'; id: string; name: string };
export function Projects({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const state = useEditor();
  const [projectId, setProjectId] = useState(state.location.projectId);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [search, setSearch] = useState('');
  const project =
    state.workspace.projects.find((project) => project.id === projectId) ??
    state.workspace.projects[0];
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
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
        dialog.current?.close();
      }
      setEdit(null);
    });
  }
  return (
    <dialog ref={dialog} className="projects-dialog" onClose={onClose}>
      <header className="projects-heading">
        <h2>Projects</h2>
        <div>
          <button onClick={onImport}>
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
          <IconButton
            label="Close projects"
            onClick={() => dialog.current?.close()}
          >
            <X size={18} />
          </IconButton>
        </div>
      </header>
      <div className="projects-layout">
        <nav className="project-list" aria-label="Projects">
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
                        dialog.current?.close();
                      })
                    }
                  >
                    <File size={18} />
                    <span>
                      <strong>{file.document.name}</strong>
                      <small>
                        {file.document.pages.length}{' '}
                        {file.document.pages.length === 1 ? 'page' : 'pages'}
                        {file.id === state.location.fileId ? ', open' : ''}
                      </small>
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
        Projects and files stay in this browser. Import backups as new items
        without replacing existing work.
      </footer>
    </dialog>
  );
}
