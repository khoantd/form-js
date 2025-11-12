import Ids from 'ids';
import { clone, createFormContainer, createInjector, schemaVersion } from '@bpmn-io/form-js-viewer';
import { isString, set } from 'min-dash';

import { CoreModule } from './core';
import { EditorActionsModule } from './features/editor-actions';
import { EditorExpressionLanguageModule } from './features/expression-language';
import { FormEditorKeyboardModule } from './features/keyboard';
import { DraggingModule } from './features/dragging';
import { ModelingModule } from './features/modeling';
import { SelectionModule } from './features/selection';
import { PaletteModule } from './features/palette';
import { PropertiesPanelModule } from './features/properties-panel';
import { RenderInjectionModule } from './features/render-injection';
import { RepeatRenderModule } from './features/repeat-render';
import { PluginModule, PluginRegistry } from './features/plugins';
import { PreviewModeModule } from './features/preview-mode';

import { MarkdownRendererModule } from '@bpmn-io/form-js-viewer';

const ids = new Ids([32, 36, 1]);

/**
 * @typedef { import('./types').Injector } Injector
 * @typedef { import('./types').Module } Module
 * @typedef { import('./types').Schema } Schema
 *
 * @typedef { import('./types').FormEditorOptions } FormEditorOptions
 * @typedef { import('./types').FormEditorProperties } FormEditorProperties
 *
 * @typedef { {
 *   properties: FormEditorProperties,
 *   schema: Schema
 * } } State
 *
 * @typedef { (type:string, priority:number, handler:Function) => void } OnEventWithPriority
 * @typedef { (type:string, handler:Function) => void } OnEventWithOutPriority
 * @typedef { OnEventWithPriority & OnEventWithOutPriority } OnEventType
 */

/**
 * The form editor.
 */
export class FormEditor {
  /**
   * @constructor
   * @param {FormEditorOptions} options
   */
  constructor(options = {}) {
    /**
     * @public
     * @type {OnEventType}
     */
    this.on = this._onEvent;

    /**
     * @public
     * @type {String}
     */
    this._id = ids.next();

    /**
     * @private
     * @type {Element}
     */
    this._container = createFormContainer();

    this._container.setAttribute('tabindex', '0');

    const { container, exporter, injector = this._createInjector(options, this._container), properties = {}, theme } = options;

    /**
     * @private
     * @type {any}
     */
    this.exporter = exporter;

    /**
     * @private
     * @type {State}
     */
    this._state = {
      properties,
      schema: null,
    };

    this.get = injector.get;

    this.invoke = injector.invoke;

    this.get('eventBus').fire('form.init');

    // Register any custom form field types provided via options
    if (Array.isArray(options.customFormFieldTypes) && options.customFormFieldTypes.length) {
      const formFields = this.get('formFields', false);
      if (formFields) {
        options.customFormFieldTypes.forEach((formField) => {
          const type = (formField && formField.config && formField.config.type) || null;
          if (type) {
            formFields.register(type, formField);
          }
        });
      }
    }

    // Apply initial theme if provided
    if (theme) {
      try {
        const themeManager = this.get('themeManager', false);
        if (themeManager) {
          themeManager.applyTheme(theme, false);
        }
      } catch (error) {
        // Theme manager might not be available, ignore
        console.warn('Failed to apply initial theme:', error);
      }
    }

    if (container) {
      this.attachTo(container);
    }
  }

  clear() {
    // clear form services
    this._emit('diagram.clear');

    // clear diagram services (e.g. EventBus)
    this._emit('form.clear');
  }

  /**
   * Register a custom form field type at runtime.
   *
   * @param {string|Object} typeOrFormField - Type name or form field implementation (with config.type)
   * @param {Object} [formField] - Form field implementation if first arg is a string
   */
  registerFormFieldType(typeOrFormField, formField) {
    const formFields = this.get('formFields', false);
    if (!formFields) {
      throw new Error('formFields service not available');
    }

    let type = null;
    let impl = null;

    if (typeof typeOrFormField === 'string') {
      type = typeOrFormField;
      impl = formField;
    } else if (typeOrFormField && typeOrFormField.config && typeOrFormField.config.type) {
      type = typeOrFormField.config.type;
      impl = typeOrFormField;
    }

    if (!type || !impl) {
      throw new Error('Invalid arguments for registerFormFieldType');
    }

    formFields.register(type, impl);
  }

  /**
   * Register a custom form field type definition.
   *
   * @param {Object} definition - Custom type definition
   * @returns {Object} The created custom type definition
   */
  registerCustomFormFieldType(definition) {
    const customTypeRegistry = this.get('customTypeRegistry', false);
    if (!customTypeRegistry) {
      throw new Error('Custom type registry not available');
    }
    return customTypeRegistry.create(definition);
  }

  /**
   * Get all registered custom form field types.
   *
   * @returns {Array<Object>} Array of custom type definitions
   */
  getCustomFormFieldTypes() {
    const customTypeRegistry = this.get('customTypeRegistry', false);
    if (!customTypeRegistry) {
      return [];
    }
    return customTypeRegistry.list();
  }

  /**
   * Export custom types as JSON.
   *
   * @returns {string} JSON string of custom types
   */
  exportCustomTypes() {
    const customTypeRegistry = this.get('customTypeRegistry', false);
    if (!customTypeRegistry) {
      throw new Error('Custom type registry not available');
    }
    return customTypeRegistry.export();
  }

  /**
   * Import custom types from JSON.
   *
   * @param {string} json - JSON string of custom types
   * @param {boolean} [merge=false] - If true, merge with existing types. If false, replace all.
   */
  importCustomTypes(json, merge = false) {
    const customTypeRegistry = this.get('customTypeRegistry', false);
    if (!customTypeRegistry) {
      throw new Error('Custom type registry not available');
    }
    return customTypeRegistry.import(json, merge);
  }

  destroy() {
    // destroy form services
    this.get('eventBus').fire('form.destroy');

    // destroy diagram services (e.g. EventBus)
    this.get('eventBus').fire('diagram.destroy');

    this._detach(false);
  }

  /**
   * @param {Schema} schema
   *
   * @return {Promise<{ warnings: Array<any> }>}
   */
  importSchema(schema) {
    return new Promise((resolve, reject) => {
      try {
        this.clear();

        // Ensure custom types are registered after clear() but before importSchema
        // The form.clear event listener will re-register them, but we also ensure it here
        const customTypeRegistry = this.get('customTypeRegistry', false);
        if (customTypeRegistry) {
          // Use the public method to ensure all custom types are registered
          customTypeRegistry.ensureRegistered();
        }

        const { schema: importedSchema, warnings } = this.get('importer').importSchema(schema);

        this._setState({
          schema: importedSchema,
        });

        this._emit('import.done', { warnings });

        return resolve({ warnings });
      } catch (error) {
        this._emit('import.done', {
          error: error,
          warnings: error.warnings || [],
        });

        return reject(error);
      }
    });
  }

  /**
   * @returns {Schema}
   */
  saveSchema() {
    return this.getSchema();
  }

  /**
   * @returns {Schema}
   */
  getSchema() {
    const { schema } = this._getState();

    return exportSchema(schema, this.exporter, schemaVersion);
  }

  /**
   * @param {Element|string} parentNode
   */
  attachTo(parentNode) {
    if (!parentNode) {
      throw new Error('parentNode required');
    }

    this.detach();

    if (isString(parentNode)) {
      parentNode = document.querySelector(parentNode);
    }

    const container = this._container;

    parentNode.appendChild(container);

    this._emit('attach');
  }

  detach() {
    this._detach();
  }

  /**
   * @internal
   *
   * @param {boolean} [emit]
   */
  _detach(emit = true) {
    const container = this._container,
      parentNode = container.parentNode;

    if (!parentNode) {
      return;
    }

    if (emit) {
      this._emit('detach');
    }

    parentNode.removeChild(container);
  }

  /**
   * @param {any} property
   * @param {any} value
   */
  setProperty(property, value) {
    const properties = set(this._getState().properties, [property], value);

    this._setState({ properties });
  }

  /**
   * @param {string} type
   * @param {Function} handler
   */
  off(type, handler) {
    this.get('eventBus').off(type, handler);
  }

  /**
   * Apply a theme to the form editor.
   *
   * @param {import('@bpmn-io/form-js-viewer/dist/types/types').Theme|string} theme - Theme object or preset name
   * @param {boolean} [merge=true] - Whether to merge with current theme
   */
  applyTheme(theme, merge = true) {
    const themeManager = this.get('themeManager', false);
    if (!themeManager) {
      throw new Error('Theme manager not available');
    }
    themeManager.applyTheme(theme, merge);
  }

  /**
   * Get the current theme.
   *
   * @returns {import('@bpmn-io/form-js-viewer/dist/types/types').Theme}
   */
  getTheme() {
    const themeManager = this.get('themeManager', false);
    if (!themeManager) {
      throw new Error('Theme manager not available');
    }
    return themeManager.getTheme();
  }

  /**
   * Reset theme to default.
   */
  resetTheme() {
    const themeManager = this.get('themeManager', false);
    if (!themeManager) {
      throw new Error('Theme manager not available');
    }
    themeManager.resetTheme();
  }

  /**
   * Register a theme preset.
   *
   * @param {string} name - Preset name
   * @param {import('@bpmn-io/form-js-viewer/dist/types/types').Theme} theme - Theme object
   */
  registerThemePreset(name, theme) {
    const themeManager = this.get('themeManager', false);
    if (!themeManager) {
      throw new Error('Theme manager not available');
    }
    themeManager.registerPreset(name, theme);
  }

  /**
   * Get a theme preset.
   *
   * @param {string} name - Preset name
   * @returns {import('@bpmn-io/form-js-viewer/dist/types/types').Theme|null}
   */
  getThemePreset(name) {
    const themeManager = this.get('themeManager', false);
    if (!themeManager) {
      throw new Error('Theme manager not available');
    }
    return themeManager.getPreset(name);
  }

  /**
   * Get all registered theme presets.
   *
   * @returns {Array<{name: string, theme: import('@bpmn-io/form-js-viewer/dist/types/types').Theme}>}
   */
  getThemePresets() {
    const themeManager = this.get('themeManager', false);
    if (!themeManager) {
      throw new Error('Theme manager not available');
    }
    return themeManager.getPresets();
  }

  /**
   * Set a theme property.
   *
   * @param {string} property - CSS variable name
   * @param {string} value - CSS value
   */
  setThemeProperty(property, value) {
    const themeManager = this.get('themeManager', false);
    if (!themeManager) {
      throw new Error('Theme manager not available');
    }
    themeManager.setProperty(property, value);
  }

  /**
   * Get a theme property.
   *
   * @param {string} property - CSS variable name
   * @returns {string|null}
   */
  getThemeProperty(property) {
    const themeManager = this.get('themeManager', false);
    if (!themeManager) {
      throw new Error('Theme manager not available');
    }
    return themeManager.getProperty(property);
  }

  /**
   * @internal
   *
   * @param {FormEditorOptions} options
   * @param {Element} container
   *
   * @returns {Injector}
   */
  _createInjector(options, container) {
    const { modules = this._getModules(), additionalModules = [], plugins = [], renderer = {}, ...config } = options;

    // Derive customFieldTypes from customFormFieldTypes if not explicitly provided
    const derivedCustomTypes =
      Array.isArray(options.customFormFieldTypes)
        ? options.customFormFieldTypes
            .map((ff) => (ff && ff.config && ff.config.type) || null)
            .filter(Boolean)
        : [];

    const enrichedConfig = {
      ...config,
      customFieldTypes: Array.isArray(config.customFieldTypes) && config.customFieldTypes.length
        ? config.customFieldTypes
        : derivedCustomTypes,
      renderer: {
        ...renderer,
        container,
      },
    };

    // Create a temporary plugin registry to collect plugin modules before injector creation
    let pluginModules = [];
    if (plugins && plugins.length > 0) {
      const tempRegistry = new PluginRegistry();
      const tempContext = {
        formEditor: this,
        injector: null, // Will be set after injector creation
        eventBus: null, // Will be set after injector creation
      };

      // Register plugins temporarily to collect modules
      plugins.forEach((plugin) => {
        try {
          const pluginInstance = tempRegistry.register(plugin, tempContext);
          const modules = pluginInstance.getModules();
          if (Array.isArray(modules)) {
            pluginModules.push(...modules);
          }
        } catch (error) {
          console.error(`Failed to register plugin: ${error.message}`, error);
        }
      });
    }

    const injector = createInjector([
      { config: ['value', enrichedConfig] },
      { formEditor: ['value', this] },
      CoreModule,
      ...modules,
      ...additionalModules,
      ...pluginModules, // Add plugin modules at injector creation time
    ]);

    // Register plugins after injector is created (for non-module contributions)
    if (plugins && plugins.length > 0) {
      this._registerPlugins(plugins, injector);
    }

    return injector;
  }

  /**
   * Register plugins with the editor.
   *
   * @internal
   * @param {Array<Plugin|Object>} plugins - Array of plugin instances or definitions
   * @param {Injector} injector - Dependency injector
   */
  _registerPlugins(plugins, injector) {
    const pluginRegistry = injector.get('pluginRegistry', false);
    const eventBus = injector.get('eventBus', false);

    if (!pluginRegistry || !eventBus) {
      console.warn('Plugin system not available. Make sure PluginModule is included in modules.');
      return;
    }

    const context = {
      formEditor: this,
      injector,
      eventBus,
    };

    plugins.forEach((plugin) => {
      try {
        pluginRegistry.register(plugin, context);
      } catch (error) {
        console.error(`Failed to register plugin: ${error.message}`, error);
      }
    });
  }

  /**
   * @internal
   */
  _emit(type, data) {
    this.get('eventBus').fire(type, data);
  }

  /**
   * @internal
   */
  _getState() {
    return this._state;
  }

  /**
   * @internal
   */
  _setState(state) {
    this._state = {
      ...this._state,
      ...state,
    };

    this._emit('changed', this._getState());
  }

  /**
   * @internal
   */
  _getModules() {
    return [
      ModelingModule,
      EditorActionsModule,
      FormEditorKeyboardModule,
      DraggingModule,
      SelectionModule,
      PaletteModule,
      EditorExpressionLanguageModule,
      MarkdownRendererModule,
      PropertiesPanelModule,
      RenderInjectionModule,
      RepeatRenderModule,
      PluginModule,
      PreviewModeModule,
    ];
  }

  /**
   * @internal
   */
  _onEvent(type, priority, handler) {
    this.get('eventBus').on(type, priority, handler);
  }
}

// helpers //////////

export function exportSchema(schema, exporter, schemaVersion) {
  const exportDetails = exporter
    ? {
        exporter,
      }
    : {};

  const cleanedSchema = clone(schema, (name, value) => {
    if (['_parent', '_path'].includes(name)) {
      return undefined;
    }

    return value;
  });

  return {
    ...cleanedSchema,
    ...exportDetails,
    schemaVersion,
  };
}
