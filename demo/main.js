import { render } from 'preact';
import '@bpmn-io/form-js/dist/assets/form-js.css';
import '@bpmn-io/form-js/dist/assets/form-js-editor.css';
import '@bpmn-io/form-js/dist/assets/form-js-playground.css';
import './styles.scss';

import { Router } from './components/Router';
import { LandingPage } from './components/LandingPage';
import { PlaygroundPage } from './components/PlaygroundPage';
import { initializeErrorHandling } from './utils/errorHandler';

// Initialize comprehensive error handling system
initializeErrorHandling();

// Define routes
const routes = {
  '/start': LandingPage,
  '/playground': PlaygroundPage,
};

// Render app
const container = document.querySelector('#app');
if (container) {
  try {
    render(<Router routes={routes} defaultRoute="/start" />, container);
  } catch (error) {
    console.error('Failed to render app:', error);
    container.innerHTML = `
      <div style="padding: 20px; font-family: monospace;">
        <h1>Render Error</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
} else {
  console.error('Container element #app not found');
}

