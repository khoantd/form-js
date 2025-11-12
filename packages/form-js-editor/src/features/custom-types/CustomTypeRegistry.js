import { Fragment } from 'preact';
import Ids from 'ids';

const ids = new Ids([32, 36, 1]);

// localStorage key for persisting custom types
const STORAGE_KEY = 'form-js-custom-types';

/**
 * @typedef { {
 *   id: string,
 *   name: string,
 *   type: string,
 *   baseType: string,
 *   icon?: string,
 *   color?: string,
 *   category?: string,
 *   config: {
 *     label?: string,
 *     description?: string,
 *     helper?: string,
 *     defaultValue?: any,
 *     required?: boolean,
 *     min?: number,
 *     max?: number,
 *     options?: Array<{ label: string, value: string }>,
 *     [key: string]: any
 *   }
 * } } CustomTypeDefinition
 */

/**
 * Registry for managing custom form field types.
 * Custom types are persisted to localStorage and automatically restored on page load.
 */
export class CustomTypeRegistry {
  /**
   * @constructor
   * @param {import('../../core/EventBus').EventBus} eventBus
   * @param {import('@bpmn-io/form-js-viewer').FormFields} formFields
   */
  constructor(eventBus, formFields) {
    /**
     * @private
     * @type {Map<string, CustomTypeDefinition>}
     */
    this._types = new Map();

    /**
     * @private
     * @type {import('../../core/EventBus').EventBus}
     */
    this._eventBus = eventBus;

    /**
     * @private
     * @type {import('@bpmn-io/form-js-viewer').FormFields}
     */
    this._formFields = formFields;

    // Restore custom types from localStorage on initialization
    this._restoreFromStorage();

    // Listen for form lifecycle events
    eventBus.on('form.init', () => {
      // Re-register all custom types when form initializes
      // This ensures custom types are available even if form is re-initialized
      this._types.forEach((def) => {
        try {
          this._registerType(def);
        } catch (error) {
          console.error(`Failed to re-register custom type "${def.type}" on form.init:`, error);
        }
      });
    });

    // Re-register custom types after form.clear to ensure they're available for schema import
    eventBus.on('form.clear', () => {
      // Re-register all custom types immediately after clear
      // This ensures they're available when schema is imported
      this._types.forEach((def) => {
        try {
          this._registerType(def);
        } catch (error) {
          console.error(`Failed to re-register custom type "${def.type}" after form.clear:`, error);
        }
      });
    });

    eventBus.on('form.destroy', () => {
      // Clean up on destroy
      this._types.forEach((def) => {
        this._unregisterType(def.type);
      });
    });
  }

  /**
   * Restore custom types from localStorage.
   * This ensures custom types persist across page refreshes.
   *
   * @private
   */
  _restoreFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const types = JSON.parse(stored);
      if (!Array.isArray(types)) {
        console.warn('Invalid custom types data in localStorage, ignoring');
        return;
      }

      // Restore each type (without firing events during restoration)
      types.forEach((typeDef) => {
        try {
          // Store in memory without registering yet
          // Registration will happen on form.init event
          this._types.set(typeDef.type, typeDef);
        } catch (error) {
          console.warn(`Failed to restore custom type "${typeDef.type}":`, error);
        }
      });

      // Register all restored types immediately
      // This ensures they're available right away, just like built-in types
      this._types.forEach((def) => {
        try {
          this._registerType(def);
        } catch (error) {
          console.warn(`Failed to register restored custom type "${def.type}":`, error);
        }
      });

      if (this._types.size > 0) {
        // Fire event to notify that custom types were restored
        this._eventBus.fire('customTypes.restored', { count: this._types.size });
        this._eventBus.fire('customTypes.changed');
      }
    } catch (error) {
      console.warn('Failed to restore custom types from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Save custom types to localStorage.
   * This ensures custom types persist across page refreshes.
   *
   * @private
   */
  _saveToStorage() {
    try {
      const types = this.list();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
    } catch (error) {
      console.warn('Failed to save custom types to localStorage:', error);
      // Handle quota exceeded error gracefully
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, custom types will not persist');
      }
    }
  }

  /**
   * Create a new custom type definition.
   *
   * @param {Omit<CustomTypeDefinition, 'id'>} definition
   * @returns {CustomTypeDefinition}
   */
  create(definition) {
    const { name, type, baseType } = definition;

    if (!name || !type || !baseType) {
      throw new Error('Custom type definition must include name, type, and baseType');
    }

    // Validate type key is unique
    if (this._types.has(type)) {
      throw new Error(`Custom type with key "${type}" already exists`);
    }

    // Validate type doesn't conflict with built-in types
    if (this._formFields.get(type)) {
      throw new Error(`Type "${type}" conflicts with a built-in form field type`);
    }

    const id = ids.next();
    const customType = {
      id,
      ...definition,
    };

    this._types.set(type, customType);
    
    // Register the type immediately
    try {
      this._registerType(customType);
      
      // Verify registration was successful
      const registered = this._formFields.get(type);
      if (!registered) {
        throw new Error(`Custom type "${type}" was not registered successfully in formFields`);
      }
    } catch (error) {
      // Remove from types map if registration failed
      this._types.delete(type);
      throw error;
    }

    // Fire events to notify all listeners (including EditorFieldFactory)
    // This ensures the FieldFactory is immediately aware of the new custom type
    // and treats it exactly like a built-in type
    this._eventBus.fire('customTypes.added', { type: customType });
    this._eventBus.fire('customTypes.changed');

    // Verify the type is immediately available in formFields
    // This ensures it can be used right away, just like built-in types
    const verifyRegistered = this._formFields.get(type);
    if (!verifyRegistered) {
      console.warn(`Custom type "${type}" was registered but not immediately available in formFields`);
    }

    // Persist to localStorage so it survives page refresh
    this._saveToStorage();

    return customType;
  }

  /**
   * Ensure all custom types are registered in formFields.
   * This is useful after form.clear() to re-register types before schema import.
   *
   * @public
   */
  ensureRegistered() {
    this._types.forEach((def) => {
      try {
        // Check if already registered
        const registered = this._formFields.get(def.type, false);
        if (!registered) {
          this._registerType(def);
        }
      } catch (error) {
        console.error(`Failed to ensure custom type "${def.type}" is registered:`, error);
      }
    });
  }

  /**
   * Update an existing custom type.
   *
   * @param {string} type
   * @param {Partial<CustomTypeDefinition>} updates
   * @returns {CustomTypeDefinition}
   */
  update(type, updates) {
    const existing = this._types.get(type);
    if (!existing) {
      throw new Error(`Custom type "${type}" not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      type: existing.type, // Don't allow changing type key
      id: existing.id, // Don't allow changing id
    };

    this._types.set(type, updated);
    this._unregisterType(type);
    this._registerType(updated);

    this._eventBus.fire('customTypes.changed');

    return updated;
  }

  /**
   * Delete a custom type.
   *
   * @param {string} type
   */
  delete(type) {
    const existing = this._types.get(type);
    if (!existing) {
      return;
    }

    this._unregisterType(type);
    this._types.delete(type);

    this._eventBus.fire('customTypes.removed', { type: existing });
    this._eventBus.fire('customTypes.changed');
  }

  /**
   * Get a custom type by its type key.
   *
   * @param {string} type
   * @returns {CustomTypeDefinition|undefined}
   */
  get(type) {
    return this._types.get(type);
  }

  /**
   * List all custom types.
   *
   * @returns {Array<CustomTypeDefinition>}
   */
  list() {
    return Array.from(this._types.values());
  }

  /**
   * Check if a type exists.
   *
   * @param {string} type
   * @returns {boolean}
   */
  has(type) {
    return this._types.has(type);
  }

  /**
   * Export all custom types as JSON.
   *
   * @returns {string}
   */
  export() {
    const types = this.list();
    return JSON.stringify(types, null, 2);
  }

  /**
   * Import custom types from JSON.
   *
   * @param {string} json
   * @param {boolean} [merge=false] - If true, merge with existing types. If false, replace all.
   */
  import(json, merge = false) {
    let types;
    try {
      types = JSON.parse(json);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }

    if (!Array.isArray(types)) {
      throw new Error('Imported data must be an array of custom type definitions');
    }

    if (!merge) {
      // Clear existing types
      const existingTypes = Array.from(this._types.keys());
      existingTypes.forEach((type) => {
        this.delete(type);
      });
    }

    // Import new types
    types.forEach((typeDef) => {
      try {
        if (merge && this._types.has(typeDef.type)) {
          this.update(typeDef.type, typeDef);
        } else {
          // Generate new ID for imported types
          const { id, ...rest } = typeDef;
          this.create(rest);
        }
      } catch (error) {
        console.warn(`Failed to import custom type "${typeDef.type}": ${error.message}`);
      }
    });

    this._eventBus.fire('customTypes.imported', { count: types.length });
    this._eventBus.fire('customTypes.changed');
  }

  /**
   * Register a custom type with the form fields registry.
   *
   * @private
   * @param {CustomTypeDefinition} definition
   */
  _registerType(definition) {
    const { type, baseType, name, config } = definition;

    // Get the base form field implementation
    const baseField = this._formFields.get(baseType);
    if (!baseField) {
      console.warn(`Base field type "${baseType}" not found for custom type "${type}"`);
      return;
    }

    // Check if this is a select-based field type
    const selectBasedTypes = ['select', 'checklist', 'taglist', 'radio'];
    const isSelectBased = selectBasedTypes.includes(baseType);

    // Create a wrapper component that uses the base field
    const CustomFieldComponent = (props) => {
      // Merge custom config with field props
      const mergedProps = {
        ...props,
        field: {
          ...props.field,
          // Apply custom defaults
          label: config.label || props.field.label,
          description: config.description || props.field.description,
          helper: config.helper || props.field.helper,
          defaultValue: config.defaultValue !== undefined ? config.defaultValue : props.field.defaultValue,
          required: config.required !== undefined ? config.required : props.field.required,
          validate: {
            ...props.field.validate,
            required: config.required !== undefined ? config.required : props.field.validate?.required,
            min: config.min !== undefined ? config.min : props.field.validate?.min,
            max: config.max !== undefined ? config.max : props.field.validate?.max,
          },
          // Use 'values' for select-based fields, 'options' for others
          ...(config.options && isSelectBased
            ? { values: config.options }
            : config.options && !isSelectBased
            ? { options: config.options }
            : {}),
        },
      };

      // Render the base field component
      const BaseComponent = baseField;
      return <BaseComponent {...mergedProps} />;
    };

    // Create config for the custom type
    const customConfig = {
      type,
      name: name,
      group: definition.category || 'custom',
      keyed: baseField.config?.keyed || false,
      emptyValue: baseField.config?.emptyValue,
      create: (options = {}) => {
        const baseCreate = baseField.config?.create || (() => ({}));
        const baseFieldData = baseCreate(options);

        return {
          ...baseFieldData,
          label: config.label || baseFieldData.label,
          description: config.description || baseFieldData.description,
          helper: config.helper || baseFieldData.helper,
          defaultValue: config.defaultValue !== undefined ? config.defaultValue : baseFieldData.defaultValue,
          required: config.required !== undefined ? config.required : baseFieldData.required,
          validate: {
            ...baseFieldData.validate,
            required: config.required !== undefined ? config.required : baseFieldData.validate?.required,
            min: config.min !== undefined ? config.min : baseFieldData.validate?.min,
            max: config.max !== undefined ? config.max : baseFieldData.validate?.max,
          },
          // Use 'values' for select-based fields, 'options' for others
          ...(config.options && isSelectBased
            ? { values: config.options }
            : config.options && !isSelectBased
            ? { options: config.options }
            : {}),
        };
      },
    };

    CustomFieldComponent.config = customConfig;

    // Register with form fields
    this._formFields.register(type, CustomFieldComponent);

    // Verify registration was successful
    const registered = this._formFields.get(type);
    if (!registered) {
      console.error(`Failed to register custom type "${type}" in formFields registry`);
      throw new Error(`Failed to register custom type "${type}"`);
    }

    // Verify config is set correctly
    if (!registered.config || !registered.config.type) {
      console.error(`Custom type "${type}" registered but config is invalid:`, registered.config);
      throw new Error(`Custom type "${type}" has invalid config`);
    }

    // Verify config.type matches the type key
    if (registered.config.type !== type) {
      console.error(`Custom type "${type}" config.type mismatch: expected "${type}", got "${registered.config.type}"`);
      throw new Error(`Custom type "${type}" config.type mismatch`);
    }
  }

  /**
   * Unregister a custom type from the form fields registry.
   *
   * @private
   * @param {string} type
   */
  _unregisterType(type) {
    // Note: FormFields doesn't have an unregister method, so we can't fully remove it
    // The type will be replaced on next registration
  }
}

CustomTypeRegistry.$inject = ['eventBus', 'formFields'];

