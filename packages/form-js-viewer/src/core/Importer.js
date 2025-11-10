import { clone } from '../util';
import { SchemaValidator } from './SchemaValidator';

export class Importer {
  /**
   * @constructor
   * @param { import('./FormFieldRegistry').FormFieldRegistry } formFieldRegistry
   * @param { import('./PathRegistry').PathRegistry } pathRegistry
   * @param { import('./FieldFactory').FieldFactory } fieldFactory
   * @param { import('./FormLayouter').FormLayouter } formLayouter
   * @param { import('./SchemaValidator').SchemaValidator } [schemaValidator]
   */
  constructor(formFieldRegistry, pathRegistry, fieldFactory, formLayouter, schemaValidator) {
    this._formFieldRegistry = formFieldRegistry;
    this._pathRegistry = pathRegistry;
    this._fieldFactory = fieldFactory;
    this._formLayouter = formLayouter;
    this._schemaValidator = schemaValidator;
  }

  /**
   * Import schema creating rows, fields, attaching additional
   * information to each field and adding fields to the
   * field registry.
   *
   * Additional information attached:
   *
   *   * `id` (unless present)
   *   * `_parent`
   *   * `_path`
   *
   * @param {any} schema
   *
   * @typedef {{ warnings: Error[], schema: any }} ImportResult
   * @returns {ImportResult}
   */
  importSchema(schema) {
    const warnings = [];

    // Validate schema structure before importing
    if (this._schemaValidator) {
      try {
        const validationResult = this._schemaValidator.validate(schema);

        if (!validationResult.valid && validationResult.errors.length > 0) {
          // Create warnings for validation errors
          // Only create warnings for non-critical errors (type errors, etc.)
          // Critical errors (missing required fields) will be caught during import
          validationResult.errors.forEach((error) => {
            // Check if this is a critical error that should throw
            const isCritical =
              error.keyword === 'required' ||
              (error.keyword === 'type' && error.instancePath === '' && error.params?.type === 'object');

            if (!isCritical) {
              const warning = new Error(`Schema validation warning: ${error.message || 'Invalid schema property'}`);
              warning.instancePath = error.instancePath;
              warning.schemaPath = error.schemaPath;
              warning.keyword = error.keyword;
              warnings.push(warning);
            }
          });

          // If there are critical errors, throw an error with warnings attached
          const criticalErrors = validationResult.errors.filter(
            (error) =>
              error.keyword === 'required' ||
              (error.keyword === 'type' && error.instancePath === '' && error.params?.type === 'object'),
          );

          if (criticalErrors.length > 0) {
            const error = new Error(
              `Schema validation failed: ${criticalErrors.map((e) => e.message || 'Invalid schema').join(', ')}`,
            );
            error.warnings = warnings;
            throw error;
          }
        }
      } catch (err) {
        // If validation itself fails, add as warning but continue
        if (err.warnings) {
          warnings.push(...err.warnings);
        } else {
          warnings.push(new Error(`Schema validation error: ${err.message || 'Unknown validation error'}`));
        }
      }
    }

    try {
      this._cleanup();

      // Basic schema structure validation
      if (!schema || typeof schema !== 'object') {
        const error = new Error('Invalid schema: schema must be an object');
        error.warnings = warnings;
        throw error;
      }

      // Default components to empty array if not provided
      if (schema.components === undefined) {
        schema.components = [];
      }

      if (!Array.isArray(schema.components)) {
        const error = new Error('Invalid schema: components must be an array');
        error.warnings = warnings;
        throw error;
      }

      const importedSchema = this.importFormField(clone(schema));
      this._formLayouter.calculateLayout(clone(importedSchema));

      return {
        schema: importedSchema,
        warnings,
      };
    } catch (err) {
      this._cleanup();
      err.warnings = warnings;
      throw err;
    }
  }

  _cleanup() {
    this._formLayouter.clear();
    this._formFieldRegistry.clear();
    this._pathRegistry.clear();
  }

  /**
   * @param {{[x: string]: any}} fieldAttrs
   * @param {String} [parentId]
   * @param {number} [index]
   *
   * @return {any} field
   */
  importFormField(fieldAttrs, parentId, index) {
    const { components } = fieldAttrs;

    let parent, path;

    if (parentId) {
      parent = this._formFieldRegistry.get(parentId);
    }

    // set form field path
    path = parent ? [...parent._path, 'components', index] : [];

    const field = this._fieldFactory.create(
      {
        ...fieldAttrs,
        _path: path,
        _parent: parentId,
      },
      false,
    );

    this._formFieldRegistry.add(field);

    if (components) {
      field.components = this.importFormFields(components, field.id);
    }

    return field;
  }

  /**
   * @param {Array<any>} components
   * @param {string} parentId
   *
   * @return {Array<any>} imported components
   */
  importFormFields(components, parentId) {
    return components.map((component, index) => {
      return this.importFormField(component, parentId, index);
    });
  }
}

Importer.$inject = ['formFieldRegistry', 'pathRegistry', 'fieldFactory', 'formLayouter', 'schemaValidator'];
