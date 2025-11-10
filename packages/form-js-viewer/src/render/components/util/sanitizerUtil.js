import isEqual from 'lodash/isEqual';
import { DATETIME_SUBTYPES } from '../../../util/constants/DatetimeConstants';
import {
  isDateInputInformationMatching,
  isDateTimeInputInformationSufficient,
  isInvalidDateString,
  parseIsoTime,
} from './dateTimeUtil';
import { getSimpleOptionsData, normalizeOptionsData } from './optionsUtil';

const ALLOWED_IMAGE_SRC_PATTERN = /^(https?|data):.*/i;
const ALLOWED_IFRAME_SRC_PATTERN = /^(https):\/\/*/i;

export function sanitizeDateTimePickerValue(options) {
  const { formField, value } = options;

  const { subtype } = formField;

  if (typeof value !== 'string') return null;

  if (subtype === DATETIME_SUBTYPES.DATE && (isInvalidDateString(value) || !isDateInputInformationMatching(value)))
    return null;
  if (subtype === DATETIME_SUBTYPES.TIME && parseIsoTime(value) === null) return null;
  if (
    subtype === DATETIME_SUBTYPES.DATETIME &&
    (isInvalidDateString(value) || !isDateTimeInputInformationSufficient(value))
  )
    return null;

  return value;
}

export function hasEqualValue(value, array) {
  if (!Array.isArray(array)) {
    return false;
  }

  return array.some((element) => isEqual(value, element));
}

export function sanitizeSingleSelectValue(options) {
  const { formField, data, value, eventBus } = options;

  const { valuesExpression: optionsExpression } = formField;

  try {
    // if options are expression evaluated, we don't need to sanitize the value against the options
    // and defer to the field's internal validation
    if (optionsExpression) {
      return value;
    }

    const validValues = normalizeOptionsData(getSimpleOptionsData(formField, data)).map((v) => v.value);
    const sanitizedValue = hasEqualValue(value, validValues) ? value : null;

    // Emit warning if value was sanitized (removed)
    if (sanitizedValue === null && value != null && eventBus) {
      eventBus.fire('sanitization.warning', {
        field: formField,
        originalValue: value,
        reason: 'Value not found in valid options',
      });
    }

    return sanitizedValue;
  } catch (error) {
    // use default value in case of formatting error
    // Emit warning when sanitization fails
    if (eventBus) {
      eventBus.fire('sanitization.warning', {
        field: formField,
        originalValue: value,
        reason: `Sanitization error: ${error.message || 'Unknown error'}`,
        error,
      });
    }
    return null;
  }
}

export function sanitizeMultiSelectValue(options) {
  const { formField, data, value, eventBus } = options;

  const { valuesExpression: optionsExpression } = formField;

  try {
    // if options are expression evaluated, we don't need to sanitize the values against the options
    // and defer to the field's internal validation
    if (optionsExpression) {
      return value;
    }

    const validValues = normalizeOptionsData(getSimpleOptionsData(formField, data)).map((v) => v.value);
    const sanitizedValues = value.filter((v) => hasEqualValue(v, validValues));

    // Emit warning if values were sanitized (removed)
    if (sanitizedValues.length < value.length && eventBus) {
      const removedValues = value.filter((v) => !hasEqualValue(v, validValues));
      eventBus.fire('sanitization.warning', {
        field: formField,
        originalValue: value,
        sanitizedValue: sanitizedValues,
        removedValues,
        reason: 'Some values not found in valid options',
      });
    }

    return sanitizedValues;
  } catch (error) {
    // use default value in case of formatting error
    // Emit warning when sanitization fails
    if (eventBus) {
      eventBus.fire('sanitization.warning', {
        field: formField,
        originalValue: value,
        reason: `Sanitization error: ${error.message || 'Unknown error'}`,
        error,
      });
    }
    return [];
  }
}

/**
 * Sanitizes an image source to ensure we only allow for data URI and links
 * that start with http(s).
 *
 * Note: Most browsers anyway do not support script execution in <img> elements.
 *
 * @param {string} src
 * @returns {string}
 */
export function sanitizeImageSource(src) {
  const valid = ALLOWED_IMAGE_SRC_PATTERN.test(src);

  return valid ? src : '';
}

/**
 * Sanitizes an iframe source to ensure we only allow for links
 * that start with http(s).
 *
 * @param {string} src
 * @returns {string}
 */
export function sanitizeIFrameSource(src) {
  const valid = ALLOWED_IFRAME_SRC_PATTERN.test(src);

  return valid ? src : '';
}

/**
 * Escapes HTML and returns pure text.
 * @param {string} html
 * @returns {string}
 */
export function escapeHTML(html) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '{': '&#123;',
    '}': '&#125;',
    ':': '&#58;',
    ';': '&#59;',
  };

  return html.replace(/[&<>"'{};:]/g, (match) => escapeMap[match]);
}
