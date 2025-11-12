import { ListGroup } from '@bpmn-io/properties-panel';

import { has, get } from 'min-dash';

import { CustomValueEntry } from '../entries';

export function CustomPropertiesGroup(field, editField) {
  const { properties = {}, type } = field;

  if (type === 'default') {
    return null;
  }

  const addEntry = (event) => {
    event.stopPropagation();

    // Read current properties from field dynamically
    const currentProperties = get(field, ['properties'], {});
    let index = Object.keys(currentProperties).length + 1;

    while (`key${index}` in currentProperties) {
      index++;
    }

    const newProperties = { ...currentProperties, [`key${index}`]: 'value' };
    editField(field, 'properties', newProperties);
  };

  const validateFactory = (key) => {
    return (value) => {
      if (value === key) {
        return;
      }

      if (typeof value !== 'string' || value.length === 0) {
        return 'Must not be empty.';
      }

      // Read current properties from field dynamically
      const currentProperties = get(field, ['properties'], {});
      if (has(currentProperties, value)) {
        return 'Must be unique.';
      }
    };
  };

  const items = Object.keys(properties).map((key, index) => {
    const removeEntry = (event) => {
      event.stopPropagation();

      // Read current properties from field dynamically
      const currentProperties = get(field, ['properties'], {});
      return editField(field, 'properties', removeKey(currentProperties, key));
    };

    const id = `property-${field.id}-${index}`;

    return {
      autoFocusEntry: id + '-key',
      entries: CustomValueEntry({
        editField,
        field,
        idPrefix: id,
        index,
        validateFactory,
      }),
      id,
      label: key || '',
      remove: removeEntry,
    };
  });

  return {
    add: addEntry,
    component: ListGroup,
    id: 'custom-values',
    items,
    label: 'Custom properties',
    tooltip:
      'Add properties directly to the form schema, useful to configure functionality in custom-built task applications and form renderers.',
  };
}

// helpers //////////

/**
 * Returns copy of object without key.
 *
 * @param {Object} properties
 * @param {string} oldKey
 *
 * @returns {Object}
 */
export function removeKey(properties, oldKey) {
  return Object.entries(properties).reduce((newProperties, entry) => {
    const [key, value] = entry;

    if (key === oldKey) {
      return newProperties;
    }

    return {
      ...newProperties,
      [key]: value,
    };
  }, {});
}
