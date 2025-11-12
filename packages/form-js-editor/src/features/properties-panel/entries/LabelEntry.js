import { INPUTS, LABELED_NON_INPUTS } from '../Util';
import { DATETIME_SUBTYPES, DATE_LABEL_PATH, TIME_LABEL_PATH } from '@bpmn-io/form-js-viewer';
import { useService, useVariables } from '../hooks';
import { FeelTemplatingEntry, isFeelEntryEdited } from '@bpmn-io/properties-panel';
import { get } from 'min-dash';

export function LabelEntry(props) {
  const { field, editField, getService } = props;

  const entries = [];

  entries.push({
    id: 'date-label',
    component: DateLabel,
    editField,
    field,
    getService,
    isEdited: isFeelEntryEdited,
    isDefaultVisible: function (field) {
      return (
        field.type === 'datetime' &&
        (field.subtype === DATETIME_SUBTYPES.DATE || field.subtype === DATETIME_SUBTYPES.DATETIME)
      );
    },
  });

  entries.push({
    id: 'time-label',
    component: TimeLabel,
    editField,
    field,
    getService,
    isEdited: isFeelEntryEdited,
    isDefaultVisible: function (field) {
      return (
        field.type === 'datetime' &&
        (field.subtype === DATETIME_SUBTYPES.TIME || field.subtype === DATETIME_SUBTYPES.DATETIME)
      );
    },
  });

  const isSimplyLabeled = (field) => {
    return [...INPUTS.filter((input) => input !== 'datetime'), ...LABELED_NON_INPUTS].includes(field.type);
  };

  entries.push({
    id: 'label',
    component: Label,
    editField,
    field,
    getService,
    isEdited: isFeelEntryEdited,
    isDefaultVisible: isSimplyLabeled,
  });

  return entries;
}

function Label(props) {
  const { editField, field, id, getService } = props;

  // Guard against undefined field
  if (!field || !field.type) {
    return null;
  }

  const debounce = useService('debounce');
  const variables = useVariables().map((name) => ({ name }));

  const path = ['label'];

  const getValue = () => {
    const labelValue = get(field, path, '');
    
    // Guard: ensure we have a valid value
    if (!labelValue) {
      return '';
    }
    
    // Guard: only process objects, not arrays or primitives
    if (typeof labelValue !== 'object' || Array.isArray(labelValue)) {
      return String(labelValue);
    }
    
    // Guard: check if this is the field object itself (circular reference)
    if (labelValue === field) {
      console.warn('LabelEntry: label value is the field object itself, returning empty string');
      return '';
    }
    
    // Try to stringify first - this will fail fast if there are circular references
    // We catch the error and handle it gracefully
    try {
      // Attempt to stringify - this will throw if there are circular references
      const stringified = JSON.stringify(labelValue);
      
      // If stringification succeeded, check if it looks like a localized object
      // A localized object should be a JSON object with locale keys
      try {
        const parsed = JSON.parse(stringified);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          // Safely check if it has locale-like keys (2-letter strings)
          // Use try-catch around Object.keys in case of any issues
          let keys;
          try {
            keys = Object.keys(parsed);
          } catch (keyError) {
            // If we can't get keys, it's not a valid localized object
            return stringified;
          }
          
          if (keys.length === 0) {
            return stringified;
          }
          
          // Check for common locale keys
          const commonLocales = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko'];
          let hasLocaleKeys = false;
          try {
            hasLocaleKeys = commonLocales.some(locale => {
              try {
                return locale in parsed && typeof parsed[locale] === 'string';
              } catch {
                return false;
              }
            });
          } catch {
            // If checking locale keys fails, continue with other checks
          }
          
          // Check if all keys are 2-letter strings (locale-like)
          let allKeysAreLocales = false;
          try {
            allKeysAreLocales = keys.every(key => {
              try {
                return typeof key === 'string' && key.length === 2 && typeof parsed[key] === 'string';
              } catch {
                return false;
              }
            });
          } catch {
            // If checking fails, assume it's not a localized object
            allKeysAreLocales = false;
          }
          
          if (hasLocaleKeys || allKeysAreLocales) {
            // It's a localized object, return the stringified version
            return stringified;
          }
        }
      } catch (parseError) {
        // If we can't parse it back, it's not a valid localized object
        // Return the stringified version anyway (might be a complex object)
        return stringified;
      }
      
      // If we got here, stringification worked but it might not be a localized object
      // Return the stringified version
      return stringified;
    } catch (e) {
      // Handle circular reference or other JSON.stringify errors
      const errorMessage = e?.message || String(e);
      if (errorMessage.includes('cyclic') || errorMessage.includes('circular')) {
        // Silently return empty string for circular references - this is expected
        return '';
      }
      // For other errors, log and return empty string
      console.warn('LabelEntry: Error stringifying label value:', errorMessage);
      return '';
    }
  };

  const setValue = (value) => {
    // Try to parse JSON if it looks like a localized object
    let parsedValue = value;
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        // Only use parsed value if it's an object (localized label)
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          parsedValue = parsed;
        }
      } catch (e) {
        // Not valid JSON, use as string
        parsedValue = value;
      }
    }
    return editField(field, path, parsedValue || '');
  };

  const label = getLabelText(field.type);

  return FeelTemplatingEntry({
    debounce,
    element: field,
    getValue,
    id,
    label,
    singleLine: true,
    setValue,
    variables,
  });
}

function DateLabel(props) {
  const { editField, field, id, getService } = props;

  // Guard against undefined field
  if (!field || !field.type) {
    return null;
  }

  const debounce = useService('debounce');
  const variables = useVariables().map((name) => ({ name }));

  const path = DATE_LABEL_PATH;

  const getValue = () => {
    const labelValue = get(field, path, '');
    
    // Guard: ensure we have a valid value
    if (!labelValue) {
      return '';
    }
    
    // Guard: only process objects, not arrays or primitives
    if (typeof labelValue !== 'object' || Array.isArray(labelValue)) {
      return String(labelValue);
    }
    
    // Guard: check if this is the field object itself (circular reference)
    if (labelValue === field) {
      console.warn('DateLabel: label value is the field object itself, returning empty string');
      return '';
    }
    
    // Try to stringify first - this will fail fast if there are circular references
    try {
      const stringified = JSON.stringify(labelValue);
      
      // Check if it looks like a localized object
      try {
        const parsed = JSON.parse(stringified);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          const keys = Object.keys(parsed);
          const commonLocales = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko'];
          const hasLocaleKeys = keys.length > 0 && commonLocales.some(locale => locale in parsed);
          
          if (hasLocaleKeys || (keys.length > 0 && keys.every(key => typeof key === 'string' && key.length === 2))) {
            return stringified;
          }
        }
      } catch (parseError) {
        return stringified;
      }
      
      return stringified;
    } catch (e) {
      if (e.message && (e.message.includes('cyclic') || e.message.includes('circular'))) {
        console.warn('DateLabel: Circular reference detected, returning empty string');
        return '';
      }
      console.warn('DateLabel: Error stringifying label value:', e.message);
      return '';
    }
  };

  const setValue = (value) => {
    // Try to parse JSON if it looks like a localized object
    let parsedValue = value;
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          parsedValue = parsed;
        }
      } catch (e) {
        parsedValue = value;
      }
    }
    return editField(field, path, parsedValue || '');
  };

  return FeelTemplatingEntry({
    debounce,
    element: field,
    getValue,
    id,
    label: 'Date label',
    singleLine: true,
    setValue,
    variables,
  });
}

function TimeLabel(props) {
  const { editField, field, id, getService } = props;

  // Guard against undefined field
  if (!field || !field.type) {
    return null;
  }

  const debounce = useService('debounce');
  const variables = useVariables().map((name) => ({ name }));

  const path = TIME_LABEL_PATH;

  const getValue = () => {
    const labelValue = get(field, path, '');
    
    // Guard: ensure we have a valid value
    if (!labelValue) {
      return '';
    }
    
    // Guard: only process objects, not arrays or primitives
    if (typeof labelValue !== 'object' || Array.isArray(labelValue)) {
      return String(labelValue);
    }
    
    // Guard: check if this is the field object itself (circular reference)
    if (labelValue === field) {
      console.warn('TimeLabel: label value is the field object itself, returning empty string');
      return '';
    }
    
    // Try to stringify first - this will fail fast if there are circular references
    try {
      const stringified = JSON.stringify(labelValue);
      
      // Check if it looks like a localized object
      try {
        const parsed = JSON.parse(stringified);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          const keys = Object.keys(parsed);
          const commonLocales = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko'];
          const hasLocaleKeys = keys.length > 0 && commonLocales.some(locale => locale in parsed);
          
          if (hasLocaleKeys || (keys.length > 0 && keys.every(key => typeof key === 'string' && key.length === 2))) {
            return stringified;
          }
        }
      } catch (parseError) {
        return stringified;
      }
      
      return stringified;
    } catch (e) {
      if (e.message && (e.message.includes('cyclic') || e.message.includes('circular'))) {
        console.warn('TimeLabel: Circular reference detected, returning empty string');
        return '';
      }
      console.warn('TimeLabel: Error stringifying label value:', e.message);
      return '';
    }
  };

  const setValue = (value) => {
    // Try to parse JSON if it looks like a localized object
    let parsedValue = value;
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          parsedValue = parsed;
        }
      } catch (e) {
        parsedValue = value;
      }
    }
    return editField(field, path, parsedValue || '');
  };

  return FeelTemplatingEntry({
    debounce,
    element: field,
    getValue,
    id,
    label: 'Time label',
    singleLine: true,
    setValue,
    variables,
  });
}

// helpers //////////

/**
 * @param {string} type
 * @returns {string}
 */
function getLabelText(type) {
  switch (type) {
    case 'group':
    case 'dynamiclist':
      return 'Group label';
    case 'table':
      return 'Table label';
    case 'iframe':
    case 'documentPreview':
      return 'Title';
    default:
      return 'Field label';
  }
}
