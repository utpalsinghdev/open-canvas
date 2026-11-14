import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initializeWorkspace } from './workspace/persistence';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing.');
root.textContent = 'Opening workspace';
void initializeWorkspace().then(() =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
);
