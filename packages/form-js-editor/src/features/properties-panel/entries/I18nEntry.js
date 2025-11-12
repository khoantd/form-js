import { TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { get } from 'min-dash';

/**
 * Creates entries for managing i18n translations for a field property (label or description).
 * 
 * @param {Object} props
 * @param {Object} props.field - The form field
 * @param {Function} props.editField - Function to edit the field
 * @param {Function} props.getService - Function to get services
 * @param {string} props.propertyPath - Path to the property ('label' or 'description')
 * @param {string} props.idPrefix - Prefix for entry IDs
 * @param {string} props.locale - The locale code (e.g., 'en', 'de')
 * @returns {Array} Array of entry objects
 */
export function I18nEntry(props) {
  const { field, editField, getService, propertyPath, idPrefix, locale } = props;

  if (!field || !propertyPath || !locale) {
    return [];
  }

  const debounce = getService('debounce');
  const i18n = getService('i18n', false);

  // Get current value (can be string or object with locale keys)
  const getValue = () => {
    const currentValue = get(field, [propertyPath], '');
    
    // If it's a string, return it for the current locale
    if (typeof currentValue === 'string') {
      // If we're editing a locale that's not the default, return empty
      // This allows users to add translations for other locales
      if (locale !== (i18n?.getLocale() || 'en')) {
        return '';
      }
      return currentValue;
    }
    
    // If it's an object (localized), return the value for this locale
    if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
      return currentValue[locale] || '';
    }
    
    return '';
  };

  // Set value for this locale
  const setValue = (value) => {
    const currentValue = get(field, [propertyPath], '');
    
    // If current value is a string, convert it to an object
    let localizedValue;
    if (typeof currentValue === 'string') {
      // Get current locale or default to 'en'
      const currentLocale = i18n?.getLocale() || 'en';
      localizedValue = {
        [currentLocale]: currentValue,
        [locale]: value || '',
      };
    } else if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
      // It's already an object, update the locale
      localizedValue = {
        ...currentValue,
        [locale]: value || '',
      };
      // Remove empty locale entries
      Object.keys(localizedValue).forEach(key => {
        if (!localizedValue[key]) {
          delete localizedValue[key];
        }
      });
    } else {
      // Fallback: create new object
      localizedValue = {
        [locale]: value || '',
      };
    }
    
    // If only one locale remains and it's the default, convert back to string
    const locales = Object.keys(localizedValue).filter(key => localizedValue[key]);
    if (locales.length === 1 && locales[0] === (i18n?.getLocale() || 'en')) {
      editField(field, [propertyPath], localizedValue[locales[0]]);
    } else {
      editField(field, [propertyPath], localizedValue);
    }
  };

  const propertyLabel = propertyPath === 'label' 
    ? 'Label' 
    : propertyPath === 'description' 
      ? 'Description' 
      : propertyPath;

  return [
    {
      id: `${idPrefix}-${propertyPath}-${locale}`,
      component: I18nTranslationInput,
      editField,
      field,
      debounce,
      getValue,
      setValue,
      locale,
      propertyPath,
      propertyLabel,
      isEdited: isTextFieldEntryEdited,
    },
  ];
}

/**
 * Input component for a single locale translation.
 */
function I18nTranslationInput(props) {
  const { getValue, setValue, locale, propertyLabel, debounce, id } = props;

  return TextFieldEntry({
    debounce,
    element: {},
    getValue,
    id,
    label: `${propertyLabel} (${locale.toUpperCase()})`,
    setValue,
  });
}

