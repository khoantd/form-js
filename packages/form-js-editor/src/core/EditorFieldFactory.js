import { FieldFactory } from '@bpmn-io/form-js-viewer';

/**
 * Editor-specific FieldFactory that ensures custom types are registered
 * before creating form fields.
 *
 * This wrapper ensures that custom types are always available when
 * FieldFactory.create() is called, treating custom types exactly like built-in types.
 * 
 * Key features:
 * - Proactively ensures custom types are registered on initialization
 * - Listens for customTypes.changed events to refresh awareness
 * - Always checks for custom types before field creation
 * - Treats built-in and custom components identically
 */
export class EditorFieldFactory extends FieldFactory {
  /**
   * @constructor
   * @param {import('@bpmn-io/form-js-viewer').FormFieldRegistry} formFieldRegistry
   * @param {import('@bpmn-io/form-js-viewer').PathRegistry} pathRegistry
   * @param {import('@bpmn-io/form-js-viewer').FormFields} formFields
   * @param {import('../core/EventBus').EventBus} eventBus
   * @param {import('didi').Injector} injector
   */
  constructor(formFieldRegistry, pathRegistry, formFields, eventBus, injector) {
    super(formFieldRegistry, pathRegistry, formFields);
    this._eventBus = eventBus;
    this._injector = injector;
    this._customTypeRegistry = null;

    // Get customTypeRegistry reference (non-strict to avoid errors if not available)
    try {
      this._customTypeRegistry = this._injector.get('customTypeRegistry', false);
    } catch (error) {
      // CustomTypeRegistry might not be available yet, that's okay
      this._customTypeRegistry = null;
    }

    // Proactively ensure all custom types are registered on initialization
    // This ensures custom types are available immediately, just like built-in types
    this._ensureCustomTypesRegistered();

    // Store handler references for cleanup
    this._onCustomTypesChanged = () => {
      this._ensureCustomTypesRegistered();
    };

    // Listen for custom type changes to proactively refresh awareness
    // When a custom type is added/updated/removed, ensure all are still registered
    eventBus.on('customTypes.changed', this._onCustomTypesChanged);

    // Also listen for customTypes.added to ensure immediate registration
    eventBus.on('customTypes.added', this._onCustomTypesChanged);

    // Listen for form.init to ensure custom types are available after form initialization
    eventBus.on('form.init', this._onCustomTypesChanged);
  }

  /**
   * Ensure all custom types are registered in formFields.
   * This makes custom types available immediately, just like built-in types.
   *
   * @private
   */
  _ensureCustomTypesRegistered() {
    if (!this._customTypeRegistry) {
      // Try to get it again in case it wasn't available during construction
      try {
        this._customTypeRegistry = this._injector.get('customTypeRegistry', false);
      } catch (error) {
        // Still not available, that's okay
        return;
      }
    }

    if (this._customTypeRegistry) {
      try {
        // Ensure all custom types are registered synchronously
        // This treats them exactly like built-in types
        this._customTypeRegistry.ensureRegistered();
      } catch (error) {
        // Log but don't throw - we'll check again in create()
        console.warn('Failed to ensure custom types are registered in EditorFieldFactory:', error);
      }
    }
  }

  /**
   * Create a form field, ensuring custom types are registered first.
   * This method treats custom types exactly like built-in types.
   *
   * @override
   * @param {Object} attrs
   * @param {boolean} isNewField
   * @returns {Object}
   */
  create(attrs, isNewField = true) {
    const { type } = attrs;

    // Always ensure custom types are registered before creating any field
    // This ensures custom types are treated exactly like built-in types
    // No special handling needed - they're all in formFields now
    this._ensureCustomTypesRegistered();

    // Check if the field type exists (works for both built-in and custom types)
    const fieldDefinition = this._formFields.get(type, false);
    if (!fieldDefinition && this._customTypeRegistry) {
      // Field not found - try one more time to ensure custom types are registered
      // This handles edge cases where a custom type was just added
      try {
        this._customTypeRegistry.ensureRegistered();
      } catch (error) {
        // Continue - parent class will throw appropriate error if type doesn't exist
        console.warn(`Failed to ensure custom type "${type}" is registered:`, error);
      }
    }

    // Call parent implementation - it will work for both built-in and custom types
    // because they're all registered in formFields the same way
    return super.create(attrs, isNewField);
  }

  /**
   * Cleanup event listeners on destroy.
   */
  destroy() {
    if (this._eventBus && this._onCustomTypesChanged) {
      this._eventBus.off('customTypes.changed', this._onCustomTypesChanged);
      this._eventBus.off('customTypes.added', this._onCustomTypesChanged);
      this._eventBus.off('form.init', this._onCustomTypesChanged);
    }
  }
}

EditorFieldFactory.$inject = ['formFieldRegistry', 'pathRegistry', 'formFields', 'eventBus', 'injector'];

