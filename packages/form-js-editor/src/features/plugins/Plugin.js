/**
 * Base class for form editor plugins.
 *
 * Plugins can extend the form editor functionality by:
 * - Registering custom modules
 * - Registering command handlers
 * - Adding palette entries
 * - Adding properties panel providers
 * - Registering custom form field types
 * - Hooking into events
 * - Extending services
 *
 * @class Plugin
 */
export class Plugin {
  /**
   * @constructor
   * @param {Object} options - Plugin options
   * @param {string} options.name - Plugin name (required)
   * @param {string} [options.version] - Plugin version
   * @param {string} [options.description] - Plugin description
   */
  constructor(options = {}) {
    const { name, version = '1.0.0', description = '' } = options;

    if (!name) {
      throw new Error('Plugin name is required');
    }

    /**
     * @public
     * @type {string}
     */
    this.name = name;

    /**
     * @public
     * @type {string}
     */
    this.version = version;

    /**
     * @public
     * @type {string}
     */
    this.description = description;

    /**
     * @private
     * @type {boolean}
     */
    this._initialized = false;

    /**
     * @private
     * @type {Object}
     */
    this._services = {};
  }

  /**
   * Initialize the plugin.
   * Called when the plugin is registered with the editor.
   *
   * @param {Object} context - Plugin context
   * @param {import('../../FormEditor').FormEditor} context.formEditor - Form editor instance
   * @param {import('didi').Injector} context.injector - Dependency injector
   * @param {import('../../core/EventBus').EventBus} context.eventBus - Event bus
   */
  init(context) {
    if (this._initialized) {
      return;
    }

    this._services = {
      formEditor: context.formEditor,
      injector: context.injector,
      eventBus: context.eventBus,
    };

    this._initialized = true;
  }

  /**
   * Get a service from the injector.
   *
   * @param {string} type - Service type
   * @param {boolean} [strict=true] - Whether to throw if service not found
   * @returns {any}
   */
  getService(type, strict = true) {
    return this._services.injector.get(type, strict);
  }

  /**
   * Get the event bus.
   *
   * @returns {import('../../core/EventBus').EventBus}
   */
  getEventBus() {
    return this._services.eventBus;
  }

  /**
   * Get the form editor instance.
   *
   * @returns {import('../../FormEditor').FormEditor}
   */
  getFormEditor() {
    return this._services.formEditor;
  }

  /**
   * Register custom modules to extend the editor.
   * Override this method to return an array of module definitions.
   *
   * @returns {Array<import('../../types').Module>}
   */
  getModules() {
    return [];
  }

  /**
   * Register custom command handlers.
   * Override this method to return an object mapping command IDs to handler classes.
   *
   * @returns {Object<string, Function>}
   */
  getCommandHandlers() {
    return {};
  }

  /**
   * Register custom palette entries.
   * Override this method to return an array of palette entry definitions.
   *
   * @returns {Array<PaletteEntry>}
   */
  getPaletteEntries() {
    return [];
  }

  /**
   * Register custom properties panel providers.
   * Override this method to return an array of provider instances or classes.
   *
   * @returns {Array<Object|Function>}
   */
  getPropertiesPanelProviders() {
    return [];
  }

  /**
   * Register custom form field types.
   * Override this method to return an array of form field definitions.
   *
   * @returns {Array<Object>}
   */
  getFormFieldTypes() {
    return [];
  }

  /**
   * Hook into editor events.
   * Override this method to set up event listeners.
   */
  registerEventListeners() {
    // Override in subclasses
  }

  /**
   * Cleanup when plugin is destroyed.
   * Override this method to clean up resources.
   */
  destroy() {
    // Override in subclasses
  }
}

/**
 * @typedef { {
 *   label: string,
 *   type: string,
 *   group: ('basic-input'|'selection'|'presentation'|'container'|'action'),
 *   icon?: preact.FunctionalComponent,
 *   iconUrl?: string
 * } } PaletteEntry
 */

