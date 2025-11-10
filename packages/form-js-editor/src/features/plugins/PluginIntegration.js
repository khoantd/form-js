/**
 * Integrates plugin contributions into the editor.
 *
 * @class PluginIntegration
 */
export class PluginIntegration {
  constructor(pluginRegistry, eventBus, injector, modeling, formFields, propertiesPanel) {
    this._pluginRegistry = pluginRegistry;
    this._eventBus = eventBus;
    this._injector = injector;
    this._modeling = modeling;
    this._formFields = formFields;
    this._propertiesPanel = propertiesPanel;

    eventBus.on('form.init', () => {
      this._integratePlugins();
    });
  }

  /**
   * Integrate all plugin contributions.
   *
   * @private
   */
  _integratePlugins() {
    // Integrate command handlers
    this._integrateCommandHandlers();

    // Integrate form field types
    this._integrateFormFieldTypes();

    // Integrate properties panel providers
    this._integratePropertiesPanelProviders();

    // Fire event to notify that plugins are integrated
    this._eventBus.fire('plugins.integrated', {
      pluginRegistry: this._pluginRegistry,
    });
  }

  /**
   * Integrate command handlers from plugins.
   *
   * @private
   */
  _integrateCommandHandlers() {
    const commandHandlers = this._pluginRegistry.getCommandHandlers();

    if (!this._modeling || !commandHandlers || Object.keys(commandHandlers).length === 0) {
      return;
    }

    // Register command handlers with modeling service
    Object.entries(commandHandlers).forEach(([commandId, HandlerClass]) => {
      const commandStack = this._injector.get('commandStack', false);

      if (commandStack) {
        const handler = this._injector.instantiate(HandlerClass);
        commandStack.registerHandler(commandId, handler);
      }
    });
  }

  /**
   * Integrate form field types from plugins.
   *
   * @private
   */
  _integrateFormFieldTypes() {
    const formFieldTypes = this._pluginRegistry.getFormFieldTypes();

    if (!this._formFields || !formFieldTypes || formFieldTypes.length === 0) {
      return;
    }

    // Register form field types
    formFieldTypes.forEach((formField) => {
      const { type } = formField.config || formField;

      if (!type) {
        console.warn('Form field type missing "type" property, skipping registration');
        return;
      }

      this._formFields.register(type, formField);
    });
  }

  /**
   * Integrate properties panel providers from plugins.
   *
   * @private
   */
  _integratePropertiesPanelProviders() {
    const providers = this._pluginRegistry.getPropertiesPanelProviders();

    if (!this._propertiesPanel || !providers || providers.length === 0) {
      return;
    }

    // Register properties panel providers
    providers.forEach((provider) => {
      if (typeof provider === 'function') {
        // Provider is a class, instantiate it
        const providerInstance = this._injector.instantiate(provider);
        this._propertiesPanel.registerProvider(providerInstance);
      } else if (provider && typeof provider.getGroups === 'function') {
        // Provider is already an instance
        this._propertiesPanel.registerProvider(provider);
      } else {
        console.warn('Invalid properties panel provider, skipping registration');
      }
    });
  }
}

PluginIntegration.$inject = ['pluginRegistry', 'eventBus', 'injector', 'modeling', 'formFields', 'propertiesPanel'];

