import Ids from 'ids';
import { get, isObject, isString, isUndefined, set } from 'min-dash';

import {
  ExpressionLanguageModule,
  ExpressionFieldModule,
  MarkdownRendererModule,
  ViewerCommandsModule,
  RepeatRenderModule,
} from './features';

import { CoreModule } from './core';

import { clone, createFormContainer, createInjector } from './util';

/**
 * @typedef { import('./types').Injector } Injector
 * @typedef { import('./types').Data } Data
 * @typedef { import('./types').Errors } Errors
 * @typedef { import('./types').Schema } Schema
 * @typedef { import('./types').FormProperties } FormProperties
 * @typedef { import('./types').FormProperty } FormProperty
 * @typedef { import('./types').FormEvent } FormEvent
 * @typedef { import('./types').FormOptions } FormOptions
 *
 * @typedef { {
 *   data: Data,
 *   initialData: Data,
 *   errors: Errors,
 *   properties: FormProperties,
 *   schema: Schema
 * } } State
 *
 * @typedef { (type:FormEvent, priority:number, handler:Function) => void } OnEventWithPriority
 * @typedef { (type:FormEvent, handler:Function) => void } OnEventWithOutPriority
 * @typedef { OnEventWithPriority & OnEventWithOutPriority } OnEventType
 */

const ids = new Ids([32, 36, 1]);

/**
 * The form.
 */
export class Form {
  /**
   * @constructor
   * @param {FormOptions} options
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

    const { container, injector = this._createInjector(options, this._container), properties = {}, theme, analytics: analyticsOptions } = options;

    /**
     * @private
     * @type {State}
     */
    this._state = {
      initialData: null,
      data: null,
      properties,
      errors: {},
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

    // Register any custom validators provided via options
    if (options.customValidators && typeof options.customValidators === 'object') {
      const validationRegistry = this.get('validationRegistry', false);
      if (validationRegistry) {
        Object.entries(options.customValidators).forEach(([name, validator]) => {
          if (typeof validator === 'function') {
            try {
              validationRegistry.register(name, validator);
            } catch (error) {
              console.warn(`Failed to register custom validator "${name}":`, error);
            }
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
    // clear diagram services (e.g. EventBus)
    this._emit('diagram.clear');

    // clear form services
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
   * Register a custom validator at runtime.
   *
   * @param {string} name - Validator name
   * @param {Function} validator - Validation function
   */
  registerValidator(name, validator) {
    const validationRegistry = this.get('validationRegistry', false);
    if (!validationRegistry) {
      throw new Error('validationRegistry service not available');
    }

    if (typeof name !== 'string' || !name) {
      throw new Error('Validator name must be a non-empty string');
    }

    if (typeof validator !== 'function') {
      throw new Error('Validator must be a function');
    }

    validationRegistry.register(name, validator);
  }

  /**
   * Destroy the form, removing it from DOM,
   * if attached.
   */
  destroy() {
    // destroy form services
    this.get('eventBus').fire('form.destroy');

    // destroy diagram services (e.g. EventBus)
    this.get('eventBus').fire('diagram.destroy');

    this._detach(false);
  }

  /**
   * Open a form schema with the given initial data.
   *
   * @param {Schema} schema
   * @param {Data} [data]
   *
   * @return Promise<{ warnings: Array<any> }>
   */
  importSchema(schema, data = {}) {
    return new Promise((resolve, reject) => {
      try {
        this.clear();

        const { schema: importedSchema, warnings } = this.get('importer').importSchema(schema);

        const initializedData = this._getInitializedFieldData(clone(data));

        this._setState({
          data: initializedData,
          errors: {},
          schema: importedSchema,
          initialData: clone(initializedData),
        });

        this._emit('import.done', { warnings });

        return resolve({ warnings });
      } catch (error) {
        this._emit('import.done', {
          error,
          warnings: error.warnings || [],
        });

        return reject(error);
      }
    });
  }

  /**
   * Submit the form, triggering all field validations.
   *
   * @returns { { data: Data, errors: Errors, files: Map<string, File[]> } }
   */
  submit() {
    const { properties } = this._getState();

    if (properties.readOnly || properties.disabled) {
      throw new Error('form is read-only');
    }

    this._emit('presubmit');

    const data = this._getSubmitData();

    const errors = this.validate();

    const files = this.get('fileRegistry').getAllFiles();

    const result = {
      data,
      errors,
      files,
    };

    this._emit('submit', result);

    return result;
  }

  reset() {
    this._emit('reset');

    this._setState({
      data: clone(this._state.initialData),
      errors: {},
    });
  }

  /**
   * @returns {Errors|Promise<Errors>}
   */
  validate() {
    const formFieldRegistry = this.get('formFieldRegistry'),
      formFieldInstanceRegistry = this.get('formFieldInstanceRegistry'),
      validator = this.get('validator');

    const { data } = this._getState();
    const errors = {};
    const promises = [];

    const getErrorPath = (id, indexes) => [id, ...Object.values(indexes || {})];

    formFieldInstanceRegistry.getAllKeyed().forEach((fieldInstance) => {
      const { id, valuePath, indexes } = fieldInstance;

      const field = formFieldRegistry.get(id);

      // (1) Skip disabled fields
      if (field.disabled) {
        return;
      }

      // (2) Validate the field instance
      const value = get(data, valuePath);
      const fieldErrors = validator.validateFieldInstance(fieldInstance, value);

      // Handle async validation
      if (fieldErrors && typeof fieldErrors.then === 'function') {
        promises.push(
          fieldErrors.then((asyncFieldErrors) => {
            if (asyncFieldErrors && asyncFieldErrors.length) {
              set(errors, getErrorPath(field.id, indexes), asyncFieldErrors);
            }
          }),
        );
      } else if (fieldErrors && fieldErrors.length) {
        set(errors, getErrorPath(field.id, indexes), fieldErrors);
      }
    });

    // If there are async validators, wait for them
    if (promises.length > 0) {
      return Promise.all(promises).then(() => {
        this._setState({ errors });
        return errors;
      });
    }

    this._setState({ errors });

    // @ts-ignore
    return errors;
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
   * @private
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
   * @param {FormProperty} property
   * @param {any} value
   */
  setProperty(property, value) {
    const properties = set(this._getState().properties, [property], value);

    this._setState({ properties });
  }

  /**
   * @param {FormEvent} type
   * @param {Function} handler
   */
  off(type, handler) {
    this.get('eventBus').off(type, handler);
  }

  /**
   * Apply a theme to the form.
   *
   * @param {import('./types').Theme|string} theme - Theme object or preset name
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
   * @returns {import('./types').Theme}
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
   * @param {import('./types').Theme} theme - Theme object
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
   * @returns {import('./types').Theme|null}
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
   * @returns {Array<{name: string, theme: import('./types').Theme}>}
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
   * Get analytics data.
   *
   * @returns {import('./core/Analytics').AnalyticsData} Analytics data
   */
  getAnalytics() {
    const analytics = this.get('analytics', false);
    if (!analytics) {
      throw new Error('Analytics service not available');
    }
    return analytics.getData();
  }

  /**
   * Track field focus event.
   *
   * @param {string} fieldId - Field identifier
   */
  trackFieldFocus(fieldId) {
    const analytics = this.get('analytics', false);
    if (analytics) {
      analytics.trackFocus(fieldId);
    }
  }

  /**
   * Track field blur event.
   *
   * @param {string} fieldId - Field identifier
   */
  trackFieldBlur(fieldId) {
    const analytics = this.get('analytics', false);
    if (analytics) {
      analytics.trackBlur(fieldId);
    }
  }

  /**
   * Reset analytics data.
   */
  resetAnalytics() {
    const analytics = this.get('analytics', false);
    if (analytics) {
      analytics.reset();
    }
  }

  /**
   * Enable analytics tracking.
   */
  enableAnalytics() {
    const analytics = this.get('analytics', false);
    if (analytics) {
      analytics.enable();
    }
  }

  /**
   * Disable analytics tracking.
   */
  disableAnalytics() {
    const analytics = this.get('analytics', false);
    if (analytics) {
      analytics.disable();
    }
  }

  /**
   * Get current locale.
   *
   * @returns {string}
   */
  getLocale() {
    const i18n = this.get('i18n', false);
    if (!i18n) {
      throw new Error('I18n service not available');
    }
    return i18n.getLocale();
  }

  /**
   * Set current locale at runtime.
   *
   * @param {string} locale - Locale code (e.g., 'en', 'de', 'fr')
   */
  setLocale(locale) {
    const i18n = this.get('i18n', false);
    if (!i18n) {
      throw new Error('I18n service not available');
    }
    i18n.setLocale(locale);
    this._emit('locale.changed', { locale });
  }

  /**
   * Get fallback locale.
   *
   * @returns {string}
   */
  getFallbackLocale() {
    const i18n = this.get('i18n', false);
    if (!i18n) {
      throw new Error('I18n service not available');
    }
    return i18n.getFallbackLocale();
  }

  /**
   * Set fallback locale.
   *
   * @param {string} locale - Locale code
   */
  setFallbackLocale(locale) {
    const i18n = this.get('i18n', false);
    if (!i18n) {
      throw new Error('I18n service not available');
    }
    i18n.setFallbackLocale(locale);
  }

  /**
   * Add or update translations for a locale.
   *
   * @param {string} locale - Locale code
   * @param {Record<string, string>} translations - Translation dictionary
   */
  addTranslations(locale, translations) {
    const i18n = this.get('i18n', false);
    if (!i18n) {
      throw new Error('I18n service not available');
    }
    i18n.addTranslations(locale, translations);
  }

  /**
   * Get all translations for a locale.
   *
   * @param {string} [locale] - Locale code, defaults to current locale
   * @returns {Record<string, string>}
   */
  getTranslations(locale) {
    const i18n = this.get('i18n', false);
    if (!i18n) {
      throw new Error('I18n service not available');
    }
    return i18n.getTranslations(locale);
  }

  /**
   * @private
   *
   * @param {FormOptions} options
   * @param {Element} container
   *
   * @returns {Injector}
   */
  _createInjector(options, container) {
    const { modules = this._getModules(), additionalModules = [], ...config } = options;

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
        container,
      },
      analytics: options.analytics || {},
    };

    return createInjector([
      { config: ['value', enrichedConfig] },
      { form: ['value', this] },
      CoreModule,
      ...modules,
      ...additionalModules,
    ]);
  }

  /**
   * @private
   */
  _emit(type, data) {
    this.get('eventBus').fire(type, data);
  }

  /**
   * @internal
   *
   * @param { { fieldInstance: any, value: any } } update
   */
  _update(update) {
    const { fieldInstance, value } = update;

    const { id, valuePath, indexes } = fieldInstance;

    const { data, errors } = this._getState();

    const validator = this.get('validator');

    const fieldErrors = validator.validateFieldInstance(fieldInstance, value);

    set(data, valuePath, value);

    set(errors, [id, ...Object.values(indexes || {})], fieldErrors.length ? fieldErrors : undefined);

    this._emit('field.updated', update);

    this._setState({
      data: clone(data),
      errors: clone(errors),
    });
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
      ExpressionLanguageModule,
      ExpressionFieldModule,
      MarkdownRendererModule,
      ViewerCommandsModule,
      RepeatRenderModule,
    ];
  }

  /**
   * @internal
   */
  _onEvent(type, priority, handler) {
    this.get('eventBus').on(type, priority, handler);
  }

  /**
   * @internal
   */
  _getSubmitData() {
    const formFieldRegistry = this.get('formFieldRegistry');
    const formFieldInstanceRegistry = this.get('formFieldInstanceRegistry');
    const formData = this._getState().data;

    const submitData = {};

    formFieldInstanceRegistry.getAllKeyed().forEach((formFieldInstance) => {
      const { id, valuePath } = formFieldInstance;
      const { disabled } = formFieldRegistry.get(id);

      if (disabled) {
        return;
      }

      const value = get(formData, valuePath);
      set(submitData, valuePath, value);
    });

    return submitData;
  }

  /**
   * @internal
   */
  _getInitializedFieldData(data, options = {}) {
    const formFieldRegistry = this.get('formFieldRegistry');
    const formFields = this.get('formFields');
    const pathRegistry = this.get('pathRegistry');
    const eventBus = this.get('eventBus');

    function initializeFieldDataRecursively(initializedData, formField, indexes) {
      const { defaultValue, type, isRepeating } = formField;
      const { config: fieldConfig } = formFields.get(type);

      const valuePath = pathRegistry.getValuePath(formField, { indexes });
      let valueData = get(data, valuePath);

      // (1) Process keyed fields
      if (fieldConfig.keyed) {
        // (a) Retrieve and sanitize data from input
        if (!isUndefined(valueData) && fieldConfig.sanitizeValue) {
          valueData = fieldConfig.sanitizeValue({ formField, data, value: valueData, eventBus });
        }

        // (b) Initialize field value in output data
        const initializedFieldValue = !isUndefined(valueData)
          ? valueData
          : !isUndefined(defaultValue)
            ? defaultValue
            : fieldConfig.emptyValue;
        set(initializedData, valuePath, initializedFieldValue);
      }

      // (2) Process parents
      if (!Array.isArray(formField.components)) {
        return;
      }

      if (fieldConfig.repeatable && isRepeating) {
        // (a) Sanitize repeatable parents data if it is not an array
        if (!valueData || !Array.isArray(valueData)) {
          valueData =
            new Array(isUndefined(formField.defaultRepetitions) ? 1 : formField.defaultRepetitions)
              .fill()
              .map((_) => ({})) || [];
        }

        // (b) Ensure all elements of the array are objects
        valueData = valueData.map((val) => (isObject(val) ? val : {}));

        // (c) Initialize field value in output data
        set(initializedData, valuePath, valueData);

        // (d) If indexed ahead of time, recurse repeatable simply across the children
        if (!isUndefined(indexes[formField.id])) {
          formField.components.forEach((component) =>
            initializeFieldDataRecursively(initializedData, component, { ...indexes }),
          );

          return;
        }

        // (e1) Recurse repeatable parents both across the indexes of repetition and the children
        valueData.forEach((_, index) => {
          formField.components.forEach((component) =>
            initializeFieldDataRecursively(initializedData, component, { ...indexes, [formField.id]: index }),
          );
        });

        return;
      }

      // (e2) Recurse non-repeatable parents only across the children
      formField.components.forEach((component) => initializeFieldDataRecursively(initializedData, component, indexes));
    }

    // allows definition of a specific subfield to generate the data for
    const container = options.container || formFieldRegistry.getForm();
    const indexes = options.indexes || {};
    const basePath = pathRegistry.getValuePath(container, { indexes }) || [];

    // if indexing ahead of time, we must add this index to the data path at the end
    const path = !isUndefined(indexes[container.id]) ? [...basePath, indexes[container.id]] : basePath;

    const workingData = clone(data);
    initializeFieldDataRecursively(workingData, container, indexes);
    return get(workingData, path, {});
  }
}
