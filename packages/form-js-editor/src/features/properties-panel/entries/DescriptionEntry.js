import { get } from 'min-dash';

import { INPUTS } from '../Util';

import { useService, useVariables } from '../hooks';

import { FeelTemplatingEntry, isFeelEntryEdited } from '@bpmn-io/properties-panel';

export function DescriptionEntry(props) {
  const { editField, field, getService } = props;

  const entries = [];

  entries.push({
    id: 'description',
    component: Description,
    editField: editField,
    field: field,
    getService,
    isEdited: isFeelEntryEdited,
    isDefaultVisible: (field) => field.type !== 'filepicker' && INPUTS.includes(field.type),
  });

  return entries;
}

function Description(props) {
  const { editField, field, id, getService } = props;

  const debounce = useService('debounce');
  const variables = useVariables().map((name) => ({ name }));

  const path = ['description'];

  const getValue = () => {
    const descriptionValue = get(field, path, '');
    
    // Guard: ensure we have a valid value
    if (!descriptionValue) {
      return '';
    }
    
    // Guard: only process objects, not arrays or primitives
    if (typeof descriptionValue !== 'object' || Array.isArray(descriptionValue)) {
      return String(descriptionValue);
    }
    
    // Guard: check if this is the field object itself (circular reference)
    if (descriptionValue === field) {
      console.warn('DescriptionEntry: description value is the field object itself, returning empty string');
      return '';
    }
    
    // Try to stringify first - this will fail fast if there are circular references
    try {
      const stringified = JSON.stringify(descriptionValue);
      
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
      // Handle circular reference or other JSON.stringify errors
      if (e.message && (e.message.includes('cyclic') || e.message.includes('circular'))) {
        console.warn('DescriptionEntry: Circular reference detected in description value, returning empty string');
        return '';
      }
      console.warn('DescriptionEntry: Error stringifying description value:', e.message);
      return '';
    }
  };

  const setValue = (value) => {
    // Try to parse JSON if it looks like a localized object
    let parsedValue = value;
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        // Only use parsed value if it's an object (localized description)
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          parsedValue = parsed;
        }
      } catch (e) {
        // Not valid JSON, use as string
        parsedValue = value;
      }
    }
    return editField(field, path, parsedValue);
  };

  return FeelTemplatingEntry({
    debounce,
    element: field,
    getValue,
    id,
    label: 'Field description',
    singleLine: true,
    setValue,
    variables,
  });
}
