import { isNil, get, set } from 'min-dash';
import { countDecimals } from '../render/components/util/numberFieldUtil';
import { runExpressionEvaluation } from '../util/expressions';
import Big from 'big.js';

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const PHONE_PATTERN =
  /(\+|00)(297|93|244|1264|358|355|376|971|54|374|1684|1268|61|43|994|257|32|229|226|880|359|973|1242|387|590|375|501|1441|591|55|1246|673|975|267|236|1|61|41|56|86|225|237|243|242|682|57|269|238|506|53|5999|61|1345|357|420|49|253|1767|45|1809|1829|1849|213|593|20|291|212|34|372|251|358|679|500|33|298|691|241|44|995|44|233|350|224|590|220|245|240|30|1473|299|502|594|1671|592|852|504|385|509|36|62|44|91|246|353|98|964|354|972|39|1876|44|962|81|76|77|254|996|855|686|1869|82|383|965|856|961|231|218|1758|423|94|266|370|352|371|853|590|212|377|373|261|960|52|692|389|223|356|95|382|976|1670|258|222|1664|596|230|265|60|262|264|687|227|672|234|505|683|31|47|977|674|64|968|92|507|64|51|63|680|675|48|1787|1939|850|351|595|970|689|974|262|40|7|250|966|249|221|65|500|4779|677|232|503|378|252|508|381|211|239|597|421|386|46|268|1721|248|963|1649|235|228|66|992|690|993|670|676|1868|216|90|688|886|255|256|380|598|1|998|3906698|379|1784|58|1284|1340|84|678|681|685|967|27|260|263)(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{4,20}$/;

const VALIDATE_FEEL_PROPERTIES = ['min', 'max', 'minLength', 'maxLength'];

/**
 * Normalize validation error to string format.
 *
 * @param {string|Object} error - Error message or error object
 * @param {Object} i18n - I18n service for localization
 * @returns {string} Normalized error message
 */
function normalizeError(error, i18n) {
  if (!error) {
    return null;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    const { message, code, params } = error;

    if (message) {
      // If message is a translation key, use i18n
      if (i18n && code && i18n.t) {
        const translated = i18n.t(code, params);
        // If translation was found (not just the key), use it
        if (translated !== code) {
          return translated;
        }
      }

      // If message has params and i18n is available, try to translate
      if (i18n && i18n.t && typeof message === 'string' && message.includes('{')) {
        return i18n.t(message, params || {});
      }

      return message;
    }

    // Fallback to code if message is not available
    if (code && i18n && i18n.t) {
      return i18n.t(code, params || {});
    }

    return code || String(error);
  }

  return String(error);
}

export class Validator {
  constructor(expressionLanguage, conditionChecker, form, formFieldRegistry, validationRegistry, i18n) {
    this._expressionLanguage = expressionLanguage;
    this._conditionChecker = conditionChecker;
    this._form = form;
    this._formFieldRegistry = formFieldRegistry;
    this._validationRegistry = validationRegistry;
    this._i18n = i18n;
  }

  /**
   * Validate against a field definition, does not support proper expression evaluation.
   *
   * @deprecated use validateFieldInstance instead
   */
  validateField(field, value) {
    const { type, validate } = field;

    let errors = [];

    if (type === 'number') {
      errors = [...errors, ...runNumberValidation(field, value, this._i18n)];
    }

    if (!validate) {
      return errors;
    }

    const evaluatedValidation = oldEvaluateFEELValues(
      validate,
      this._expressionLanguage,
      this._conditionChecker,
      this._form,
    );

    errors = [...errors, ...runPresetValidation(field, evaluatedValidation, value, this._i18n)];

    return errors;
  }

  /**
   * Validate a field instance.
   *
   * @param {Object} fieldInstance
   * @param {string} value
   *
   * @returns {Array<string>|Promise<Array<string>>}
   */
  validateFieldInstance(fieldInstance, value) {
    const { id, expressionContextInfo } = fieldInstance;

    const field = this._formFieldRegistry.get(id);

    if (!field) {
      return [];
    }

    const { type, validate } = field;

    let errors = [];

    // Run built-in number validation
    if (type === 'number') {
      errors = [...errors, ...runNumberValidation(field, value, this._i18n)];
    }

    // Run built-in preset validation
    if (validate) {
      const evaluatedValidation = evaluateFEELValues(validate, this._expressionLanguage, expressionContextInfo);
      errors = [...errors, ...runPresetValidation(field, evaluatedValidation, value, this._i18n)];
    }

    // Run custom validators if registered
    const customValidators = this._getCustomValidators(field);
    if (customValidators.length > 0) {
      const validationContext = this._createValidationContext(field, fieldInstance, value);
      const customErrors = this._runCustomValidators(customValidators, validationContext);

      // Handle async validators
      if (customErrors && typeof customErrors.then === 'function') {
        return customErrors.then((asyncErrors) => {
          return this._normalizeErrors([...errors, ...(asyncErrors || [])]);
        });
      }

      errors = [...errors, ...(customErrors || [])];
    }

    return this._normalizeErrors(errors);
  }

  /**
   * Get custom validators for a field.
   *
   * @private
   * @param {Object} field - Field definition
   * @returns {Array<Function>} Array of validator functions
   */
  _getCustomValidators(field) {
    if (!this._validationRegistry || !field.validate || !field.validate.customValidators) {
      return [];
    }

    const validatorNames = Array.isArray(field.validate.customValidators)
      ? field.validate.customValidators
      : [field.validate.customValidators];

    return validatorNames
      .map((name) => {
        if (typeof name === 'string') {
          return this._validationRegistry.get(name);
        }
        return null;
      })
      .filter((validator) => validator != null);
  }

  /**
   * Create validation context for custom validators.
   *
   * @private
   * @param {Object} field - Field definition
   * @param {Object} fieldInstance - Field instance
   * @param {any} value - Value to validate
   * @returns {Object} Validation context
   */
  _createValidationContext(field, fieldInstance, value) {
    const { data, properties } = this._form._getState();

    return {
      field,
      fieldInstance,
      value,
      form: this._form,
      data,
      properties,
    };
  }

  /**
   * Run custom validators.
   *
   * @private
   * @param {Array<Function>} validators - Array of validator functions
   * @param {Object} context - Validation context
   * @returns {Array|Promise<Array>} Array of errors or promise of errors
   */
  _runCustomValidators(validators, context) {
    const errors = [];
    const promises = [];

    for (const validator of validators) {
      try {
        const result = validator(context);

        // Handle async validators
        if (result && typeof result.then === 'function') {
          promises.push(result);
        } else if (result) {
          // Handle sync validators
          const normalized = Array.isArray(result) ? result : [result];
          errors.push(...normalized.filter((e) => e != null));
        }
      } catch (error) {
        console.error('Error in custom validator:', error);
        errors.push({
          message: 'Validation error occurred',
          code: 'validator.error',
        });
      }
    }

    // If there are async validators, wait for them
    if (promises.length > 0) {
      return Promise.all(promises).then((asyncResults) => {
        const asyncErrors = asyncResults.flat().filter((e) => e != null);
        return [...errors, ...asyncErrors];
      });
    }

    return errors;
  }

  /**
   * Normalize errors to string array.
   *
   * @private
   * @param {Array} errors - Array of error messages or error objects
   * @returns {Array<string>} Array of normalized error messages
   */
  _normalizeErrors(errors) {
    return errors
      .map((error) => normalizeError(error, this._i18n))
      .filter((error) => error != null);
  }
}

Validator.$inject = ['expressionLanguage', 'conditionChecker', 'form', 'formFieldRegistry', 'validationRegistry', 'i18n'];

// helpers //////////

function runNumberValidation(field, value, i18n) {
  const { decimalDigits, increment } = field;
  const errors = [];

  if (value === 'NaN') {
    const message = i18n && i18n.t ? i18n.t('validation.number.invalid', {}) : 'Value is not a number.';
    errors.push(message);
  } else if (value) {
    if (decimalDigits >= 0 && countDecimals(value) > decimalDigits) {
      const message =
        decimalDigits === 0
          ? i18n && i18n.t
            ? i18n.t('validation.number.integer', {})
            : 'Value is expected to be an integer.'
          : i18n && i18n.t
            ? i18n.t('validation.number.decimalDigits', { count: decimalDigits })
            : `Value is expected to have at most ${decimalDigits} decimal digit${decimalDigits > 1 ? 's' : ''}.`;
      errors.push(message);
    }

    if (increment) {
      const bigValue = Big(value);
      const bigIncrement = Big(increment);

      const offset = bigValue.mod(bigIncrement);

      if (offset.cmp(0) !== 0) {
        const previousValue = bigValue.minus(offset);
        const nextValue = previousValue.plus(bigIncrement);

        const message =
          i18n && i18n.t
            ? i18n.t('validation.number.increment', { previous: previousValue, next: nextValue })
            : `Please select a valid value, the two nearest valid values are ${previousValue} and ${nextValue}.`;
        errors.push(message);
      }
    }
  }

  return errors;
}

function runPresetValidation(field, validation, value, i18n) {
  const errors = [];

  // Pattern validation
  if (validation.pattern && value && !new RegExp(validation.pattern).test(value)) {
    const message = validation.patternErrorMessage
      ? normalizeError(validation.patternErrorMessage, i18n)
      : i18n && i18n.t
        ? i18n.t('validation.pattern', { pattern: validation.pattern })
        : `Field must match pattern ${validation.pattern}.`;
    errors.push(message);
  }

  // Required validation
  if (validation.required) {
    const isUncheckedCheckbox = field.type === 'checkbox' && value === false;
    const isUnsetValue = isNil(value) || value === '';
    const isEmptyMultiselect = Array.isArray(value) && value.length === 0;

    if (isUncheckedCheckbox || isUnsetValue || isEmptyMultiselect) {
      const requiredMessage = validation.requiredMessage
        ? normalizeError(validation.requiredMessage, i18n)
        : i18n && i18n.t
          ? i18n.t('validation.required', {})
          : 'Field is required.';
      errors.push(requiredMessage);
    }
  }

  // Min value validation
  if ('min' in validation && (value || value === 0) && value < validation.min) {
    const minMessage = validation.minMessage
      ? normalizeError(validation.minMessage, i18n)
      : i18n && i18n.t
        ? i18n.t('validation.min', { min: validation.min })
        : `Field must have minimum value of ${validation.min}.`;
    errors.push(minMessage);
  }

  // Max value validation
  if ('max' in validation && (value || value === 0) && value > validation.max) {
    const maxMessage = validation.maxMessage
      ? normalizeError(validation.maxMessage, i18n)
      : i18n && i18n.t
        ? i18n.t('validation.max', { max: validation.max })
        : `Field must have maximum value of ${validation.max}.`;
    errors.push(maxMessage);
  }

  // Min length validation
  if ('minLength' in validation && value && value.trim().length < validation.minLength) {
    const minLengthMessage = validation.minLengthMessage
      ? normalizeError(validation.minLengthMessage, i18n)
      : i18n && i18n.t
        ? i18n.t('validation.minLength', { minLength: validation.minLength })
        : `Field must have minimum length of ${validation.minLength}.`;
    errors.push(minLengthMessage);
  }

  // Max length validation
  if ('maxLength' in validation && value && value.trim().length > validation.maxLength) {
    const maxLengthMessage = validation.maxLengthMessage
      ? normalizeError(validation.maxLengthMessage, i18n)
      : i18n && i18n.t
        ? i18n.t('validation.maxLength', { maxLength: validation.maxLength })
        : `Field must have maximum length of ${validation.maxLength}.`;
    errors.push(maxLengthMessage);
  }

  // Phone validation
  if ('validationType' in validation && value && validation.validationType === 'phone' && !PHONE_PATTERN.test(value)) {
    const phoneMessage = validation.phoneMessage
      ? normalizeError(validation.phoneMessage, i18n)
      : i18n && i18n.t
        ? i18n.t('validation.phone', {})
        : 'Field must be a valid international phone number. (e.g. +4930664040900)';
    errors.push(phoneMessage);
  }

  // Email validation
  if ('validationType' in validation && value && validation.validationType === 'email' && !EMAIL_PATTERN.test(value)) {
    const emailMessage = validation.emailMessage
      ? normalizeError(validation.emailMessage, i18n)
      : i18n && i18n.t
        ? i18n.t('validation.email', {})
        : 'Field must be a valid email.';
    errors.push(emailMessage);
  }

  return errors;
}

function evaluateFEELValues(validate, expressionLanguage, expressionContextInfo) {
  const evaluatedValidate = { ...validate };

  VALIDATE_FEEL_PROPERTIES.forEach((property) => {
    const path = property.split('.');
    const value = get(evaluatedValidate, path);
    const evaluatedValue = runExpressionEvaluation(expressionLanguage, value, expressionContextInfo);
    set(evaluatedValidate, path, evaluatedValue === null ? undefined : evaluatedValue);
  });

  return evaluatedValidate;
}

function oldEvaluateFEELValues(validate, expressionLanguage, conditionChecker, form) {
  const evaluatedValidate = { ...validate };

  VALIDATE_FEEL_PROPERTIES.forEach((property) => {
    const path = property.split('.');

    const value = get(evaluatedValidate, path);

    // mirroring FEEL evaluation of our hooks
    if (!expressionLanguage || !expressionLanguage.isExpression(value)) {
      return value;
    }

    const { initialData, data } = form._getState();

    const newData = conditionChecker ? conditionChecker.applyConditions(data, data) : data;
    const filteredData = { ...initialData, ...newData };

    const evaluatedValue = expressionLanguage.evaluate(value, filteredData);

    // replace validate property with evaluated value
    if (evaluatedValue) {
      set(evaluatedValidate, path, evaluatedValue);
    }
  });

  return evaluatedValidate;
}
