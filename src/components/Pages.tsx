import { useState } from 'react';
import { Check, Copy, File, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEditor } from '../editor/store';
import { currentFile } from '../workspace/model';
import { IconButton } from './Button';

export function Pages() {
  const state = useEditor();
  const { projectId, fileId, pageId } = state.location;
  const file = currentFile(state.workspace, state.location);
  const [rename, setRename] = useState<{ id: string; name: string } | null>(
    null
  );
  const [remove, setRemove] = useState<string | null>(null);
  function run(action: () => void) {
    try {
      action();
    } catch (error) {
      state.notify(
        error instanceof Error ? error.message : 'Page action failed.'
      );
    }
  }
  return (
    <section className="pages-section" aria-label="Pages">
      <div className="pages-heading">
        <span>
          Pages <span className="muted">{file.document.pages.length}</span>
        </span>
        <IconButton
          label="Add page"
          onClick={() =>
            run(() => {
              state.createPage(
                projectId,
                fileId,
                `Page ${file.document.pages.length + 1}`
              );
            })
          }
        >
          <Plus size={14} />
        </IconButton>
      </div>
      {file.document.pages.map((page) => (
        <div key={page.id}>
          {rename?.id === page.id ? (
            <form
              className="page-name-form"
              onSubmit={(event) => {
                event.preventDefault();
                run(() => {
                  state.renamePage(projectId, fileId, page.id, rename.name);
                  setRename(null);
                });
              }}
            >
              <input
                aria-label="Page name"
                autoFocus
                maxLength={160}
                value={rename.name}
                onChange={(event) =>
                  setRename({ ...rename, name: event.target.value })
                }
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setRename(null);
                }}
              />
              <IconButton
                label="Save page name"
                type="submit"
                disabled={!rename.name.trim()}
              >
                <Check size={13} />
              </IconButton>
            </form>
          ) : (
            <div className={`page-item ${page.id === pageId ? 'current' : ''}`}>
              <button
                className="page-select"
                aria-pressed={page.id === pageId}
                title={page.name}
                onClick={() =>
                  run(() => state.openFile(projectId, fileId, page.id))
                }
              >
                <File size={12} />
                <span>{page.name}</span>
              </button>
              <div className="page-actions">
                <IconButton
                  label={`Rename page ${page.name}`}
                  onClick={() => setRename({ id: page.id, name: page.name })}
                >
                  <Pencil size={12} />
                </IconButton>
                <IconButton
                  label={`Duplicate page ${page.name}`}
                  onClick={() =>
                    run(() => {
                      state.duplicatePage(projectId, fileId, page.id);
                    })
                  }
                >
                  <Copy size={12} />
                </IconButton>
                <IconButton
                  label={`Delete page ${page.name}`}
                  disabled={file.document.pages.length === 1}
                  onClick={() => setRemove(page.id)}
                >
                  <Trash2 size={12} />
                </IconButton>
              </div>
            </div>
          )}
          {remove === page.id && (
            <div className="inline-confirm" role="alert">
              <span>Delete this page? Undo can restore it.</span>
              <button
                onClick={() =>
                  run(() => {
                    state.deletePage(projectId, fileId, page.id);
                    setRemove(null);
                  })
                }
              >
                Delete page
              </button>
              <button onClick={() => setRemove(null)}>Cancel</button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
