import { ListGroup } from '@bpmn-io/properties-panel';
import { get } from 'min-dash';
import { I18nEntry } from '../entries';

/**
 * Creates a clean, serializable copy of an object to avoid circular references.
 * Uses JSON.parse/stringify to ensure the object is completely plain.
 * 
 * @param {any} obj - Object to clean
 * @returns {any} - Clean, serializable copy
 */
function createCleanCopy(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => createCleanCopy(item));
  }
  
  // For objects, use JSON to create a clean copy (this will fail if there are cycles)
  // If it fails, fall back to manual copying of string/number/boolean values only
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    // If JSON fails (circular reference), manually create a clean object
    // Only copy primitive values and recursively clean nested objects
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip internal properties that might cause cycles
      if (['_parent', '_path'].includes(key)) {
        continue;
      }
      
      // Only copy primitive values or recursively clean objects
      if (value === null || typeof value !== 'object') {
        cleaned[key] = value;
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(item => createCleanCopy(item));
      } else {
        // Recursively clean nested objects
        try {
          cleaned[key] = JSON.parse(JSON.stringify(value));
        } catch {
          // If nested object has cycles, create a shallow copy with only primitives
          const shallow = {};
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            if (['_parent', '_path'].includes(nestedKey)) {
              continue;
            }
            if (nestedValue === null || typeof nestedValue !== 'object') {
              shallow[nestedKey] = nestedValue;
            }
          }
          cleaned[key] = shallow;
        }
      }
    }
    return cleaned;
  }
}

/**
 * Common locales supported by the system.
 */
const COMMON_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

/**
 * I18n group for managing translations for label and description.
 * 
 * @param {Object} props
 * @param {Object} props.field - The form field
 * @param {Function} props.editField - Function to edit the field
 * @param {Function} props.getService - Function to get services
 * @returns {Object|null} Group configuration or null if not applicable
 */
export function I18nGroup(field, editField, getService) {
  // Don't show for default type
  if (field?.type === 'default') {
    return null;
  }

  // Get i18n service to determine current locale
  const i18n = getService('i18n', false);
  const currentLocale = i18n?.getLocale() || 'en';

  // Get current label and description values
  const labelValue = get(field, ['label'], '');
  const descriptionValue = get(field, ['description'], '');

  // Determine which locales are already in use
  const getLocalesInUse = (value) => {
    if (typeof value === 'string') {
      // Only count as locale if string is not empty
      return value.trim() ? [currentLocale] : [];
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return Object.keys(value).filter(key => value[key]);
    }
    return [];
  };

  const labelLocales = getLocalesInUse(labelValue);
  const descriptionLocales = getLocalesInUse(descriptionValue);
  const allLocalesInUse = [...new Set([...labelLocales, ...descriptionLocales])];

  // If no locales are in use yet, show empty list (user can add first locale)
  // Create items for each locale
  const items = allLocalesInUse.map((locale, index) => {
    const localeInfo = COMMON_LOCALES.find(l => l.code === locale) || { code: locale, name: locale.toUpperCase() };
    
    const id = `i18n-${field.id}-${locale}-${index}`;
    
    // Get entries for both label and description
    const labelEntries = I18nEntry({
      field,
      editField,
      getService,
      propertyPath: 'label',
      idPrefix: id,
      locale,
    });

    const descriptionEntries = I18nEntry({
      field,
      editField,
      getService,
      propertyPath: 'description',
      idPrefix: id,
      locale,
    });

    const removeEntry = (event) => {
      event.stopPropagation();
      
      // Remove locale from both label and description
      const currentLabel = get(field, ['label'], '');
      const currentDescription = get(field, ['description'], '');
      
      // Remove locale from label
      if (typeof currentLabel === 'object' && currentLabel !== null && !Array.isArray(currentLabel)) {
        // Create a clean copy to avoid circular references
        const cleanedLabel = createCleanCopy(currentLabel);
        const newLabel = { ...cleanedLabel };
        delete newLabel[locale];
        const remainingLocales = Object.keys(newLabel).filter(key => newLabel[key]);
        if (remainingLocales.length === 0) {
          editField(field, ['label'], '');
        } else if (remainingLocales.length === 1 && remainingLocales[0] === currentLocale) {
          editField(field, ['label'], newLabel[remainingLocales[0]]);
        } else {
          editField(field, ['label'], newLabel);
        }
      }
      
      // Remove locale from description
      if (typeof currentDescription === 'object' && currentDescription !== null && !Array.isArray(currentDescription)) {
        // Create a clean copy to avoid circular references
        const cleanedDescription = createCleanCopy(currentDescription);
        const newDescription = { ...cleanedDescription };
        delete newDescription[locale];
        const remainingLocales = Object.keys(newDescription).filter(key => newDescription[key]);
        if (remainingLocales.length === 0) {
          editField(field, ['description'], '');
        } else if (remainingLocales.length === 1 && remainingLocales[0] === currentLocale) {
          editField(field, ['description'], newDescription[remainingLocales[0]]);
        } else {
          editField(field, ['description'], newDescription);
        }
      }
    };

    return {
      id,
      label: `${localeInfo.name} (${locale})`,
      entries: [...labelEntries, ...descriptionEntries],
      remove: removeEntry,
    };
  });

  const addEntry = (event) => {
    event.stopPropagation();
    
    // Read current field state dynamically (don't rely on closure)
    const currentLabelValue = get(field, ['label'], '');
    const currentDescriptionValue = get(field, ['description'], '');
    
    // Recalculate locales in use from current field state
    const getCurrentLocalesInUse = (value) => {
      if (typeof value === 'string') {
        // Only count as locale if string is not empty
        return value.trim() ? [currentLocale] : [];
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return Object.keys(value).filter(key => value[key]);
      }
      return [];
    };
    
    const currentLabelLocales = getCurrentLocalesInUse(currentLabelValue);
    const currentDescriptionLocales = getCurrentLocalesInUse(currentDescriptionValue);
    const currentAllLocalesInUse = [...new Set([...currentLabelLocales, ...currentDescriptionLocales])];
    
    // Find first unused locale
    const usedLocales = new Set(currentAllLocalesInUse);
    const availableLocale = COMMON_LOCALES.find(l => !usedLocales.has(l.code));
    
    if (!availableLocale) {
      // If all common locales are used, allow custom locale
      const customLocale = prompt('Enter locale code (e.g., en, de, fr):', 'en');
      if (!customLocale || !/^[a-z]{2}$/i.test(customLocale)) {
        return;
      }
      const locale = customLocale.toLowerCase();
      
      // Prepare label and description updates
      let newLabel, newDescription;
      
      // Process label
      if (typeof currentLabelValue === 'string') {
        const currentLocale = i18n?.getLocale() || 'en';
        const labelObj = {};
        // Only add current locale if it has a value
        if (currentLabelValue.trim()) {
          labelObj[currentLocale] = currentLabelValue;
        }
        labelObj[locale] = '';
        newLabel = labelObj;
      } else if (typeof currentLabelValue === 'object' && currentLabelValue !== null) {
        // Create a clean copy to avoid circular references
        const cleanedLabel = createCleanCopy(currentLabelValue);
        newLabel = {
          ...cleanedLabel,
          [locale]: '',
        };
      } else {
        newLabel = { [locale]: '' };
      }
      
      // Process description
      if (typeof currentDescriptionValue === 'string') {
        const currentLocale = i18n?.getLocale() || 'en';
        const descObj = {};
        // Only add current locale if it has a value
        if (currentDescriptionValue.trim()) {
          descObj[currentLocale] = currentDescriptionValue;
        }
        descObj[locale] = '';
        newDescription = descObj;
      } else if (typeof currentDescriptionValue === 'object' && currentDescriptionValue !== null) {
        // Create a clean copy to avoid circular references
        const cleanedDescription = createCleanCopy(currentDescriptionValue);
        newDescription = {
          ...cleanedDescription,
          [locale]: '',
        };
      } else {
        newDescription = { [locale]: '' };
      }
      
      // Batch both edits in a single call to avoid multiple schema change events
      // Pass object as properties parameter (modeling.editFormField handles this)
      editField(field, {
        label: newLabel,
        description: newDescription,
      }, undefined);
      return;
    }
    
    // Add the first available common locale
    const locale = availableLocale.code;
    
    // Prepare label and description updates
    let newLabel, newDescription;
    
    // Process label
    if (typeof currentLabelValue === 'string') {
      const currentLocale = i18n?.getLocale() || 'en';
      const labelObj = {};
      // Only add current locale if it has a value
      if (currentLabelValue.trim()) {
        labelObj[currentLocale] = currentLabelValue;
      }
      labelObj[locale] = '';
      newLabel = labelObj;
    } else if (typeof currentLabelValue === 'object' && currentLabelValue !== null) {
      // Create a clean copy to avoid circular references
      const cleanedLabel = createCleanCopy(currentLabelValue);
      newLabel = {
        ...cleanedLabel,
        [locale]: '',
      };
    } else {
      newLabel = { [locale]: '' };
    }
    
    // Process description
    if (typeof currentDescriptionValue === 'string') {
      const currentLocale = i18n?.getLocale() || 'en';
      const descObj = {};
      // Only add current locale if it has a value
      if (currentDescriptionValue.trim()) {
        descObj[currentLocale] = currentDescriptionValue;
      }
      descObj[locale] = '';
      newDescription = descObj;
    } else if (typeof currentDescriptionValue === 'object' && currentDescriptionValue !== null) {
      // Create a clean copy to avoid circular references
      const cleanedDescription = createCleanCopy(currentDescriptionValue);
      newDescription = {
        ...cleanedDescription,
        [locale]: '',
      };
    } else {
      newDescription = { [locale]: '' };
    }
    
    // Batch both edits in a single call to avoid multiple schema change events
    // Pass object as properties parameter (modeling.editFormField handles this)
    editField(field, {
      label: newLabel,
      description: newDescription,
    }, undefined);
  };

  return {
    add: addEntry,
    component: ListGroup,
    id: 'i18n',
    items,
    label: 'Internationalization',
    tooltip: 'Manage translations for label and description in multiple languages. Add locales to provide multilingual support for your form fields.',
  };
}

