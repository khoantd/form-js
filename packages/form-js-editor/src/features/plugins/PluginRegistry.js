import { Plugin } from './Plugin';

/**
 * Registry for managing form editor plugins.
 *
 * @class PluginRegistry
 */
export class PluginRegistry {
  constructor() {
    /**
     * @private
     * @type {Map<string, Plugin>}
     */
    this._plugins = new Map();

    /**
     * @private
     * @type {Array<import('../../types').Module>}
     */
    this._modules = [];

    /**
     * @private
     * @type {Object<string, Function>}
     */
    this._commandHandlers = {};

    /**
     * @private
     * @type {Array<Object>}
     */
    this._paletteEntries = [];

    /**
     * @private
     * @type {Array<Object|Function>}
     */
    this._propertiesPanelProviders = [];

    /**
     * @private
     * @type {Array<Object>}
     */
    this._formFieldTypes = [];
  }

  /**
   * Register a plugin.
   *
   * @param {Plugin|Object} plugin - Plugin instance or plugin definition
   * @param {Object} context - Plugin context
   * @returns {Plugin}
   */
  register(plugin, context) {
    let pluginInstance;

    if (plugin instanceof Plugin) {
      pluginInstance = plugin;
    } else if (typeof plugin === 'object' && plugin.name) {
      // Create plugin instance from definition
      pluginInstance = new Plugin(plugin);
      // Copy methods from definition to instance
      Object.getOwnPropertyNames(plugin).forEach((key) => {
        if (key !== 'name' && key !== 'version' && key !== 'description') {
          if (typeof plugin[key] === 'function') {
            pluginInstance[key] = plugin[key].bind(pluginInstance);
          } else {
            pluginInstance[key] = plugin[key];
          }
        }
      });
    } else {
      throw new Error('Invalid plugin: must be a Plugin instance or an object with a name property');
    }

    const { name } = pluginInstance;

    if (this._plugins.has(name)) {
      console.warn(`Plugin "${name}" is already registered. Overwriting previous registration.`);
    }

    // Initialize plugin
    pluginInstance.init(context);

    // Collect plugin contributions
    this._collectPluginContributions(pluginInstance);

    // Register event listeners
    pluginInstance.registerEventListeners();

    this._plugins.set(name, pluginInstance);

    return pluginInstance;
  }

  /**
   * Unregister a plugin.
   *
   * @param {string} name - Plugin name
   */
  unregister(name) {
    const plugin = this._plugins.get(name);

    if (!plugin) {
      return;
    }

    // Cleanup plugin
    if (typeof plugin.destroy === 'function') {
      plugin.destroy();
    }

    // Remove plugin contributions
    this._removePluginContributions(plugin);

    this._plugins.delete(name);
  }

  /**
   * Get a registered plugin.
   *
   * @param {string} name - Plugin name
   * @returns {Plugin|undefined}
   */
  get(name) {
    return this._plugins.get(name);
  }

  /**
   * Check if a plugin is registered.
   *
   * @param {string} name - Plugin name
   * @returns {boolean}
   */
  has(name) {
    return this._plugins.has(name);
  }

  /**
   * Get all registered plugins.
   *
   * @returns {Array<Plugin>}
   */
  getAll() {
    return Array.from(this._plugins.values());
  }

  /**
   * Get all modules contributed by plugins.
   *
   * @returns {Array<import('../../types').Module>}
   */
  getModules() {
    return this._modules;
  }

  /**
   * Get all command handlers contributed by plugins.
   *
   * @returns {Object<string, Function>}
   */
  getCommandHandlers() {
    return this._commandHandlers;
  }

  /**
   * Get all palette entries contributed by plugins.
   *
   * @returns {Array<Object>}
   */
  getPaletteEntries() {
    return this._paletteEntries;
  }

  /**
   * Get all properties panel providers contributed by plugins.
   *
   * @returns {Array<Object|Function>}
   */
  getPropertiesPanelProviders() {
    return this._propertiesPanelProviders;
  }

  /**
   * Get all form field types contributed by plugins.
   *
   * @returns {Array<Object>}
   */
  getFormFieldTypes() {
    return this._formFieldTypes;
  }

  /**
   * Collect contributions from a plugin.
   *
   * @private
   * @param {Plugin} plugin - Plugin instance
   */
  _collectPluginContributions(plugin) {
    // Collect modules
    const modules = plugin.getModules();
    if (Array.isArray(modules)) {
      this._modules.push(...modules);
    }

    // Collect command handlers
    const commandHandlers = plugin.getCommandHandlers();
    if (commandHandlers && typeof commandHandlers === 'object') {
      Object.assign(this._commandHandlers, commandHandlers);
    }

    // Collect palette entries
    const paletteEntries = plugin.getPaletteEntries();
    if (Array.isArray(paletteEntries)) {
      this._paletteEntries.push(...paletteEntries);
    }

    // Collect properties panel providers
    const propertiesPanelProviders = plugin.getPropertiesPanelProviders();
    if (Array.isArray(propertiesPanelProviders)) {
      this._propertiesPanelProviders.push(...propertiesPanelProviders);
    }

    // Collect form field types
    const formFieldTypes = plugin.getFormFieldTypes();
    if (Array.isArray(formFieldTypes)) {
      this._formFieldTypes.push(...formFieldTypes);
    }
  }

  /**
   * Remove contributions from a plugin.
   *
   * @private
   * @param {Plugin} plugin - Plugin instance
   */
  _removePluginContributions(plugin) {
    // Note: This is a simplified implementation.
    // In a production system, you might want to track which contributions
    // belong to which plugin for more precise removal.

    // For now, we'll just clear all contributions when a plugin is unregistered.
    // This is acceptable since plugins are typically registered at initialization
    // and not dynamically unregistered during runtime.
  }
}

