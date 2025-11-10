import { Plugin } from '../Plugin';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from '../../../render/hooks';
import { get } from 'min-dash';

/**
 * Example plugin that adds a custom properties panel provider.
 *
 * @class CustomPropertiesPlugin
 * @extends Plugin
 */
export class CustomPropertiesPlugin extends Plugin {
  constructor() {
    super({
      name: 'custom-properties-plugin',
      version: '1.0.0',
      description: 'Adds custom properties panel entries',
    });
  }

  getPropertiesPanelProviders() {
    return [
      {
        getGroups(field, editField) {
          return (groups) => {
            if (!field) {
              return groups;
            }

            // Add a custom group
            groups.push({
              id: 'custom',
              label: 'Custom Properties',
              entries: [
                {
                  id: 'customProperty',
                  label: 'Custom Property',
                  component: CustomPropertyEntry,
                  editField,
                  field,
                },
              ],
            });

            return groups;
          };
        },
      },
    ];
  }
}

/**
 * Example custom property entry component.
 * Uses the same pattern as other properties panel entries.
 */
function CustomPropertyEntry(props) {
  const { editField, field, id } = props;

  const debounce = useService('debounce');

  const path = ['customProperty'];

  const getValue = () => {
    return get(field, path, '');
  };

  const setValue = (value) => {
    return editField(field, path, value || '');
  };

  return TextFieldEntry({
    debounce,
    element: field,
    getValue,
    id,
    label: 'Custom Property',
    setValue,
  });
}

