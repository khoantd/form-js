import { PluginRegistry } from './PluginRegistry';
import { PluginIntegration } from './PluginIntegration';

export const PluginModule = {
  __init__: ['pluginIntegration'],
  pluginRegistry: ['type', PluginRegistry],
  pluginIntegration: ['type', PluginIntegration],
};

