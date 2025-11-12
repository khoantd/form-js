/**
 * Schema validator for form-js schemas.
 * Validates schemas against the JSON schema definition.
 *
 * Note: This validator requires @bpmn-io/form-json-schema, ajv, and ajv-errors
 * to be available. If these are not available, validation will be skipped.
 */
export class SchemaValidator {
  constructor(config = {}) {
    // Lazy load AJV and schema to avoid issues if dependencies are not available
    this._validator = null;
    this._initialized = false;

    /**
     * Optional list of custom field type strings to allow during validation.
     * These will be merged into the component type enum at compile time.
     */
    this._customFieldTypes =
      (config && config.customFieldTypes && Array.isArray(config.customFieldTypes) && config.customFieldTypes) || [];
  }

  /**
   * Initialize the validator (lazy loading).
   *
   * @private
   */
  async _initialize() {
    if (this._initialized) {
      return;
    }

    try {
      // Try to dynamically import dependencies
      // Using dynamic import for optional dependencies
      const [ajvModule, ajvErrorsModule, schemaModule] = await Promise.all([
        import('ajv').catch(() => null),
        import('ajv-errors').catch(() => null),
        import('@bpmn-io/form-json-schema/resources/schema.json').catch(() => null),
      ]);

      if (!ajvModule || !ajvErrorsModule || !schemaModule) {
        // Dependencies not available, skip validation
        this._initialized = true;
        return;
      }

      const Ajv = ajvModule.default || ajvModule;
      const AjvErrors = ajvErrorsModule.default || ajvErrorsModule;
      const schema = schemaModule.default || schemaModule;

      const ajv = new Ajv({
        allErrors: true,
        strict: false,
      });

      AjvErrors(ajv);

      const schemaWithCustomTypes = this._extendSchemaWithCustomTypes(schema);

      this._validator = ajv.compile(schemaWithCustomTypes);
      this._initialized = true;
    } catch (error) {
      // If dependencies are not available, validator will be null
      // This allows graceful degradation
      this._initialized = true;
    }
  }

  /**
   * Validate a schema against the JSON schema definition.
   *
   * @param {any} schemaToValidate - The schema to validate
   * @returns {{ valid: boolean, errors: Array<Object> }} Validation result with errors
   */
  validate(schemaToValidate) {
    // Synchronous validation - initialize if needed
    if (!this._initialized) {
      // For synchronous validation, we'll use a synchronous approach
      // This requires dependencies to be available at build time
      try {
        // Try to use require for CommonJS environments (Node.js, bundlers)
        // eslint-disable-next-line no-undef
        if (typeof require !== 'undefined') {
          let Ajv, AjvErrors, schema;

          try {
            Ajv = require('ajv');
            if (Ajv.default) {
              Ajv = Ajv.default;
            }
          } catch (e) {
            // AJV not available
          }

          try {
            AjvErrors = require('ajv-errors');
            if (AjvErrors.default) {
              AjvErrors = AjvErrors.default;
            }
          } catch (e) {
            // ajv-errors not available
          }

          try {
            schema = require('@bpmn-io/form-json-schema/resources/schema.json');
            if (schema.default) {
              schema = schema.default;
            }
          } catch (e) {
            // Schema not available
          }

          if (Ajv && AjvErrors && schema) {
            const ajv = new Ajv({
              allErrors: true,
              strict: false,
            });

            AjvErrors(ajv);

            const schemaWithCustomTypes = this._extendSchemaWithCustomTypes(schema);
            this._validator = ajv.compile(schemaWithCustomTypes);
          }
        }
      } catch (error) {
        // Dependencies not available, skip validation
      }
      this._initialized = true;
    }

    // If validator is not available, skip validation
    if (!this._validator) {
      return {
        valid: true,
        errors: [],
      };
    }

    const valid = this._validator(schemaToValidate);
    const errors = this._validator.errors || [];

    return {
      valid,
      errors: errors.map((error) => ({
        instancePath: error.instancePath,
        schemaPath: error.schemaPath,
        keyword: error.keyword,
        params: error.params,
        message: error.message,
      })),
    };
  }

  /**
   * Create a shallow-cloned schema with custom component types merged into the enum.
   * The schema structure is known: the component type enum lives at
   * properties.components.items.properties.type.enum
   *
   * If the structure changes in the future, this will safely no-op.
   *
   * @param {any} schema
   * @returns {any}
   * @private
   */
  _extendSchemaWithCustomTypes(schema) {
    if (!Array.isArray(this._customFieldTypes) || this._customFieldTypes.length === 0) {
      return schema;
    }

    // Defensive cloning at the few levels we modify to avoid mutating the import
    try {
      const s = { ...schema };
      const props = s.properties && { ...s.properties };
      if (!props || !props.components) {
        return schema;
      }

      const components = { ...props.components };
      const items = components.items && { ...components.items };
      const itemProps = items.properties && { ...items.properties };
      const typeProp = itemProps && itemProps.type && { ...itemProps.type };

      const enumList = typeProp && Array.isArray(typeProp.enum) ? [...typeProp.enum] : null;
      if (!enumList) {
        return schema;
      }

      const toAdd = this._customFieldTypes.filter(
        (t) => typeof t === 'string' && t && !enumList.includes(t),
      );
      if (toAdd.length === 0) {
        return schema;
      }

      typeProp.enum = [...enumList, ...toAdd];
      itemProps.type = typeProp;
      items.properties = itemProps;
      components.items = items;
      props.components = components;
      s.properties = props;
      return s;
    } catch (e) {
      // On any unexpected structure, keep original schema
      return schema;
    }
  }
}

SchemaValidator.$inject = ['config'];

