/**
 * Schema validator for form-js schemas.
 * Validates schemas against the JSON schema definition.
 *
 * Note: This validator requires @bpmn-io/form-json-schema, ajv, and ajv-errors
 * to be available. If these are not available, validation will be skipped.
 */
export class SchemaValidator {
  constructor() {
    // Lazy load AJV and schema to avoid issues if dependencies are not available
    this._validator = null;
    this._initialized = false;
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

      this._validator = ajv.compile(schema);
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

            this._validator = ajv.compile(schema);
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
}

SchemaValidator.$inject = [];

