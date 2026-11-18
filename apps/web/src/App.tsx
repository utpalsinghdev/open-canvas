import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, Frame } from 'lucide-react';
import { EditorApp } from './EditorApp';
import { Projects } from './components/Projects';
import { WorkspaceAccess } from './components/WorkspaceAccess';
import { WorkspaceNotice } from './components/WorkspaceNotice';
import { readDocument } from './editor/files';
import { useEditor } from './editor/store';
import { switchServiceWorkspace, useWorkspaceService } from './workspace/persistence';
import { useDestination } from './workspace/useDestination';

export default function App() {
  return <WorkspaceAccess><WorkspaceScreen /></WorkspaceAccess>;
}

function WorkspaceScreen() {
  const destination = useDestination();
  const record = useWorkspaceService((state) => state.record);
  const { message, notify, saveState } = useEditor();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const documentInput = useRef<HTMLInputElement>(null);
  const importTarget = useRef<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => notify(''), 8000);
    return () => clearTimeout(timeout);
  }, [message, notify]);

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const targetProject = importTarget.current ?? useEditor.getState().location.projectId;
    const targetUrl = window.location.href;
    const workspaceId = useWorkspaceService.getState().record?.id;
    try {
      const data = await readDocument(file);
      if (window.location.href !== targetUrl || useWorkspaceService.getState().record?.id !== workspaceId)
        throw new Error('Import cancelled because the destination changed.');
      useEditor.getState().importData(data, targetProject);
      setProjectsOpen(false);
      destination.openEditor();
      notify('Imported as new files/projects. Existing work was kept.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not open document.');
    }
  }
  function onImport(projectId: string) {
    importTarget.current = projectId;
    documentInput.current?.click();
  }

  if (destination.view.kind === 'loading') return <main>Opening destination</main>;
  if (destination.view.kind === 'error') {
    return (
      <main className="help-dialog" aria-labelledby="destination-heading">
        <h1 id="destination-heading">Destination unavailable</h1>
        <p role="alert">{destination.view.message}</p>
        <p>Links identify local files. They do not share their contents.</p>
        <button className="export-button" onClick={destination.openHome}>
          Go to Home
        </button>
      </main>
    );
  }

  return <>
    {destination.view.kind === 'home' ? (
      <div className="home-shell">
        <header className="app-header home-header">
          <div className="brand"><Frame size={18} strokeWidth={1.6} />Open Canvas</div>
          <div className="header-actions">
            {saveState === 'failed' && <span className="save-status save-failed" role="alert"><AlertTriangle size={12} />Not saved</span>}
            <button className="workspace-choice" onClick={switchServiceWorkspace} aria-label="Switch local workspace" title={record?.name}>
              <span>{record?.name}</span><span>Switch workspace</span>
            </button>
          </div>
        </header>
        <Projects mode="home" onImport={onImport} onOpen={destination.openEditor} />
      </div>
    ) : <EditorApp onHome={destination.openHome} onProjects={() => setProjectsOpen(true)} onImport={() => onImport(useEditor.getState().location.projectId)} />}
    <WorkspaceNotice onProjects={() => setProjectsOpen(true)} />
    <input
      ref={documentInput}
      className="hidden"
      aria-label="Open document file"
      type="file"
      accept=".json,application/json"
      onChange={importFile}
    />
    {projectsOpen && <Projects mode="dialog" onImport={onImport} onOpen={() => {
      setProjectsOpen(false);
      destination.openEditor();
    }} onClose={() => setProjectsOpen(false)} />}
  </>;
}
