/**
 * Registry for custom validation functions.
 *
 * Custom validators can be registered to extend the built-in validation system.
 * Validators can be synchronous or asynchronous.
 *
 * @typedef {Object} ValidationContext
 * @property {Object} field - The field definition
 * @property {Object} fieldInstance - The field instance
 * @property {any} value - The value to validate
 * @property {Object} form - The form instance
 * @property {Object} data - The current form data
 * @property {Object} properties - The form properties
 *
 * @typedef {string|Object} ValidationError
 * @property {string} message - Error message
 * @property {string} [code] - Error code for programmatic handling
 * @property {string} [severity] - Error severity: 'error' | 'warning' | 'info'
 * @property {Object} [params] - Parameters for i18n message interpolation
 *
 * @typedef {(context: ValidationContext) => ValidationError|ValidationError[]|Promise<ValidationError|ValidationError[]>|null|undefined} ValidatorFunction
 */

export class ValidationRegistry {
  constructor() {
    /**
     * @private
     * @type {Map<string, ValidatorFunction>}
     */
    this._validators = new Map();
  }

  /**
   * Register a custom validator.
   *
   * @param {string} name - Validator name (must be unique)
   * @param {ValidatorFunction} validator - Validation function
   * @throws {Error} If validator name is already registered
   */
  register(name, validator) {
    if (this._validators.has(name)) {
      throw new Error(`Validator "${name}" is already registered`);
    }

    if (typeof validator !== 'function') {
      throw new Error(`Validator "${name}" must be a function`);
    }

    this._validators.set(name, validator);
  }

  /**
   * Unregister a custom validator.
   *
   * @param {string} name - Validator name
   * @returns {boolean} True if validator was removed
   */
  unregister(name) {
    return this._validators.delete(name);
  }

  /**
   * Get a validator by name.
   *
   * @param {string} name - Validator name
   * @returns {ValidatorFunction|undefined} The validator function
   */
  get(name) {
    return this._validators.get(name);
  }

  /**
   * Check if a validator is registered.
   *
   * @param {string} name - Validator name
   * @returns {boolean} True if validator is registered
   */
  has(name) {
    return this._validators.has(name);
  }

  /**
   * Get all registered validator names.
   *
   * @returns {string[]} Array of validator names
   */
  getAll() {
    return Array.from(this._validators.keys());
  }

  /**
   * Clear all registered validators.
   */
  clear() {
    this._validators.clear();
  }
}

ValidationRegistry.$inject = [];

