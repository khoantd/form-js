import { render } from 'preact';
import '@bpmn-io/form-js/dist/assets/form-js.css';
import '@bpmn-io/form-js/dist/assets/form-js-editor.css';
import '@bpmn-io/form-js/dist/assets/form-js-playground.css';
import './styles.scss';

import { Router } from './components/Router';
import { LandingPage } from './components/LandingPage';
import { PlaygroundPage } from './components/PlaygroundPage';

// Define routes
const routes = {
  '/start': LandingPage,
  '/playground': PlaygroundPage,
};

// Render app
const container = document.querySelector('#app');
if (container) {
  render(<Router routes={routes} defaultRoute="/start" />, container);
} else {
  console.error('Container element #app not found');
}

