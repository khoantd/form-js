import { without } from 'min-dash';
import { arrayAdd } from '../Util';
import { ValueEntry } from './ValueEntry';
import { OPTIONS_SOURCES, OPTIONS_SOURCES_PATHS } from '@bpmn-io/form-js-viewer';

export function StaticOptionsSourceEntry(props) {
  const { editField, field, id: idPrefix, getService } = props;

  const { values } = field;
  
  // Get i18n service for localizing option labels
  const i18n = getService ? getService('i18n', false) : null;
  
  // Helper to localize a label value (string or object)
  const localizeLabel = (label) => {
    if (!label) return '';
    if (typeof label === 'string') return label;
    if (typeof label === 'object' && i18n) {
      return i18n.localize(label);
    }
    // Fallback: if it's an object but no i18n, try to get a string representation
    if (typeof label === 'object') {
      // Try to get the first available locale value
      const locales = Object.keys(label);
      return locales.length > 0 ? label[locales[0]] : '';
    }
    return String(label);
  };

  const addEntry = (e) => {
    e.stopPropagation();

    const index = values.length + 1;

    const entry = getIndexedEntry(index, values);

    editField(field, OPTIONS_SOURCES_PATHS[OPTIONS_SOURCES.STATIC], arrayAdd(values, values.length, entry));
  };

  const removeEntry = (entry) => {
    if (field.defaultValue === entry.value) {
      editField(field, {
        values: without(values, entry),
        defaultValue: undefined,
      });
    } else {
      editField(field, OPTIONS_SOURCES_PATHS[OPTIONS_SOURCES.STATIC], without(values, entry));
    }
  };

  const validateFactory = (key, getValue) => {
    return (value) => {
      // Guard against undefined/null values
      if (value === undefined || value === null) {
        value = '';
      }
      if (key === undefined || key === null) {
        key = '';
      }

      // Normalize the key for comparison (handle localized objects)
      let normalizedKey;
      if (typeof key === 'object' && key !== null && !Array.isArray(key)) {
        try {
          normalizedKey = JSON.stringify(key);
        } catch (e) {
          normalizedKey = String(key);
        }
      } else {
        normalizedKey = String(key);
      }

      let normalizedValue;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        try {
          normalizedValue = JSON.stringify(value);
        } catch (e) {
          normalizedValue = String(value);
        }
      } else {
        normalizedValue = String(value);
      }
      
      if (normalizedValue === normalizedKey) {
        return;
      }

      // For localized labels, we accept JSON strings
      const isEmpty = (typeof value !== 'string' || value.length === 0) && 
                      !(typeof value === 'object' && value !== null && !Array.isArray(value));
      if (isEmpty) {
        return 'Must not be empty.';
      }

      // Normalize entry values for comparison - guard against undefined entries
      if (!Array.isArray(values)) {
        return;
      }

      const isValueAssigned = values.find((entry) => {
        if (!entry || typeof entry !== 'object') {
          return false;
        }
        try {
          const entryValue = getValue(entry);
          // Handle both string and object comparisons
          if (typeof entryValue === 'object' && entryValue !== null && !Array.isArray(entryValue)) {
            try {
              return JSON.stringify(entryValue) === normalizedValue;
            } catch (e) {
              return false;
            }
          }
          return String(entryValue || '') === normalizedValue;
        } catch (e) {
          // If getValue throws, skip this entry
          return false;
        }
      });

      if (isValueAssigned) {
        return 'Must be unique.';
      }
    };
  };

  const items = values
    .map((entry, index) => {
      // Guard against undefined/null entries
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const id = idPrefix + '-' + index;

      // Get entries from ValueEntry and filter out any undefined/null entries
      let valueEntries;
      try {
        valueEntries = ValueEntry({
          editField,
          field,
          idPrefix: id,
          index,
          validateFactory,
          getService,
        });
      } catch (e) {
        console.warn('Error creating ValueEntry for item:', e);
        return null;
      }

      // Ensure entries is an array - filter out only null/undefined entries
      // Let the properties panel handle Preact elements if TextFieldEntry returns them
      // This matches the pattern used in CustomPropertiesGroup which doesn't filter Preact elements
      const validEntries = Array.isArray(valueEntries) 
        ? valueEntries.filter(entry => entry != null) // Only filter out null/undefined
        : [];

      // If we have no valid entries, skip this item to avoid issues
      // Empty entries arrays cause ListGroup to fail when accessing entry properties
      if (validEntries.length === 0) {
        console.warn('StaticOptionsSourceEntry: Item has no valid entries, skipping', { id, index, valueEntriesLength: Array.isArray(valueEntries) ? valueEntries.length : 'not-array' });
        return null;
      }

      // Ensure we have a valid label (string)
      const itemLabel = localizeLabel(entry.label);
      const finalLabel = typeof itemLabel === 'string' ? itemLabel : String(itemLabel || '');

      return {
        id,
        label: finalLabel,
        entries: validEntries,
        autoFocusEntry: id + '-label',
        remove: () => removeEntry(entry),
      };
    })
    .filter(item => {
      // Additional validation: ensure item has all required properties
      // CRITICAL: Invalid items cause "can't access property 'is', d2 is undefined" errors in ListGroup
      if (!item || typeof item !== 'object') {
        return false;
      }
      // Item must have id (string)
      if (!item.id || typeof item.id !== 'string') {
        return false;
      }
      // Item must have label (string or can be empty)
      if (item.label === null || item.label === undefined) {
        return false;
      }
      // Item must have entries array with at least one valid entry
      if (!Array.isArray(item.entries)) {
        return false;
      }
      if (item.entries.length === 0) {
        return false;
      }
      // Ensure all entries in the array are valid (no null/undefined entries)
      const hasInvalidEntries = item.entries.some(entry => 
        !entry || 
        typeof entry !== 'object' || 
        !entry.id || 
        !entry.component
      );
      if (hasInvalidEntries) {
        console.warn('StaticOptionsSourceEntry: Item has invalid entries, filtering them out', { id: item.id });
        // Filter out invalid entries from the item
        item.entries = item.entries.filter(entry => 
          entry && 
          typeof entry === 'object' && 
          entry.id && 
          entry.component
        );
        // If no valid entries remain, skip this item
        if (item.entries.length === 0) {
          return false;
        }
      }
      return true;
    }); // Remove any null or invalid items

  return {
    items,
    add: addEntry,
  };
}

// helper

function getIndexedEntry(index, values) {
  const entry = {
    label: 'Value',
    value: 'value',
  };

  while (labelOrValueIsAlreadyAssignedForIndex(index, values)) {
    index++;
  }

  if (index > 1) {
    entry.label += ` ${index}`;
    entry.value += `${index}`;
  }

  return entry;
}

function labelOrValueIsAlreadyAssignedForIndex(index, values) {
  return values.some(
    (existingEntry) => existingEntry.label === `Value ${index}` || existingEntry.value === `value${index}`,
  );
}
