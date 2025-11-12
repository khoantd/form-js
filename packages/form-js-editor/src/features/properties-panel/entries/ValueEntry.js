import { get, isNil, set } from 'min-dash';

import { useService } from '../hooks';

import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useMemo } from 'preact/hooks';

export function ValueEntry(props) {
  const { editField, field, idPrefix, index, validateFactory, getService } = props;

  // Guard against invalid props
  if (!field || !idPrefix || typeof index !== 'number') {
    console.warn('ValueEntry: Invalid props', { field: !!field, idPrefix, index });
    return [];
  }

  try {
    // Create entry configuration objects
    // These will be used by the properties panel to render the entries
    const labelEntry = {
      component: Label,
      editField,
      field,
      id: idPrefix + '-label',
      idPrefix,
      index,
      validateFactory,
      getService,
    };

    const valueEntry = {
      component: Value,
      editField,
      field,
      id: idPrefix + '-value',
      idPrefix,
      index,
      validateFactory,
      getService,
    };

    // Validate that both entries are properly structured
    // An entry must be an object with at least 'id' and 'component' properties
    const entries = [labelEntry, valueEntry].filter(entry => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }
      // Must have id
      if (!entry.id || typeof entry.id !== 'string') {
        return false;
      }
      // Must have component function
      if (!entry.component || typeof entry.component !== 'function') {
        return false;
      }
      // Must not be a Preact element (which would have type, props, __)
      if (entry.type || entry.props || entry.__) {
        return false;
      }
      return true;
    });

    // Ensure we have at least one valid entry
    if (entries.length === 0) {
      console.warn('ValueEntry: No valid entries created', { idPrefix, index });
      return [];
    }

    return entries;
  } catch (e) {
    console.error('Error creating ValueEntry:', e);
    return [];
  }
}

function Label(props) {
  const { editField, field, id, index, validateFactory, getService } = props;

  // Guard: ensure we have required props
  if (!id || !field || typeof index !== 'number') {
    console.warn('Label component: Missing required props', { hasId: !!id, hasField: !!field, index });
    return null;
  }

  const debounce = useService('debounce');
  const i18n = getService ? getService('i18n', false) : null;

  // Match the pattern from IdEntry and CustomValueEntry - use plain functions, not useCallback
  const setValue = (value, error) => {
    if (error) {
      return;
    }

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

    const values = get(field, ['values']);
    return editField(field, 'values', set(values, [index, 'label'], parsedValue));
  };

  const getValue = () => {
    const label = get(field, ['values', index, 'label']);
    // If label is a localized object, return a string representation for editing
    // Users can edit it as JSON or we could provide a better UI later
    if (label && typeof label === 'object' && !Array.isArray(label)) {
      // For now, return JSON string for editing localized labels
      // In the future, we could provide a better UI for editing localized labels
      return JSON.stringify(label);
    }
    return label || '';
  };

  // Use useMemo for validate - validateFactory(key, getValue) returns a validator function
  // key is the current value, getValue is a function to extract value from entry for comparison
  const validate = useMemo(() => {
    try {
      const currentLabel = get(field, ['values', index, 'label']);
      if (!validateFactory) {
        return () => undefined; // Return no-op validator if validateFactory is missing
      }
      // validateFactory(key, getValue) where:
      // - key: current value to validate
      // - getValue: function to extract value from entry object for comparison
      return validateFactory(currentLabel, (entry) => {
        if (!entry || typeof entry !== 'object') return '';
        return entry.label || '';
      });
    } catch (e) {
      console.warn('Error creating validate function for label entry:', e);
      return () => undefined; // Return no-op validator on error
    }
  }, [field, index, validateFactory]);

  // Guard: ensure id is valid before calling TextFieldEntry
  if (!id || typeof id !== 'string') {
    console.warn('Label component: Invalid id before calling TextFieldEntry', { id, idType: typeof id });
    return null;
  }

  // Call TextFieldEntry directly and return it (like IdEntry and CustomValueEntry do)
  // Don't validate or filter - let the properties panel handle the return value
  return TextFieldEntry({
    debounce,
    element: field,
    getValue,
    id,
    label: 'Label',
    setValue,
    validate,
  });
}

function Value(props) {
  const { editField, field, id, index, validateFactory } = props;

  // Guard: ensure we have required props
  if (!id || !field || typeof index !== 'number') {
    console.warn('Value component: Missing required props', { hasId: !!id, hasField: !!field, index });
    return null;
  }

  const debounce = useService('debounce');

  // Match the pattern from IdEntry and CustomValueEntry - use plain functions, not useCallback
  const setValue = (value, error) => {
    if (error) {
      return;
    }

    const { defaultValue } = field;
    const values = get(field, ['values']);
    const previousValue = get(field, ['values', index, 'value']);

    if (!isNil(defaultValue) && defaultValue === previousValue) {
      set(field, ['defaultValue'], value);
    }

    return editField(field, 'values', set(values, [index, 'value'], value));
  };

  const getValue = () => {
    return get(field, ['values', index, 'value']);
  };

  // Use useMemo for validate - validateFactory(key, getValue) returns a validator function
  // key is the current value, getValue is a function to extract value from entry for comparison
  const validate = useMemo(() => {
    try {
      const currentValue = get(field, ['values', index, 'value']);
      if (!validateFactory) {
        return () => undefined; // Return no-op validator if validateFactory is missing
      }
      // validateFactory(key, getValue) where:
      // - key: current value to validate
      // - getValue: function to extract value from entry object for comparison
      return validateFactory(currentValue, (entry) => {
        if (!entry || typeof entry !== 'object') return '';
        return entry.value || '';
      });
    } catch (e) {
      console.warn('Error creating validate function for value entry:', e);
      return () => undefined; // Return no-op validator on error
    }
  }, [field, index, validateFactory]);

  // Guard: ensure id is valid before calling TextFieldEntry
  if (!id || typeof id !== 'string') {
    console.warn('Value component: Invalid id before calling TextFieldEntry', { id, idType: typeof id });
    return null;
  }

  // Call TextFieldEntry directly and return it (like IdEntry and CustomValueEntry do)
  // Don't validate or filter - let the properties panel handle the return value
  return TextFieldEntry({
    debounce,
    element: field,
    getValue,
    id,
    label: 'Value',
    setValue,
    validate,
  });
}
