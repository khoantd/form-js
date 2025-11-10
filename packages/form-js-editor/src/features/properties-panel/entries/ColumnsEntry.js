import { get, set } from 'min-dash';

import { useService } from '../hooks';

import { isSelectEntryEdited, SelectEntry } from '@bpmn-io/properties-panel';

import { MIN_COLUMNS } from '../../../core/FormLayoutValidator';
import { useCallback } from 'preact/hooks';

export const AUTO_OPTION_VALUE = '';

export function ColumnsEntry(props) {
  const { editField, field } = props;

  const entries = [
    {
      id: 'columns',
      component: Columns,
      field,
      editField,
      isEdited: isSelectEntryEdited,
    },
  ];

  return entries;
}

function Columns(props) {
  const { field, editField, id } = props;

  const debounce = useService('debounce');
  const formLayoutValidator = useService('formLayoutValidator');

  const validate = useCallback(
    (value) => {
      return formLayoutValidator.validateField(field, value ? parseInt(value) : null);
    },
    [field, formLayoutValidator],
  );

  const setValue = (value, error) => {
    if (error) {
      return;
    }

    const layout = get(field, ['layout'], {});

    const newValue = value ? parseInt(value) : null;

    editField(field, ['layout'], set(layout, ['columns'], newValue));
  };

  const getValue = () => {
    return get(field, ['layout', 'columns']);
  };

  const getOptions = useCallback(() => {
    const options = [
      {
        label: 'Auto',
        value: AUTO_OPTION_VALUE,
      },
    ];

    // Field types that don't support columns (e.g., containers, buttons)
    const nonColumnTypes = ['group', 'dynamiclist', 'button', 'default', 'iframe', 'table', 'documentPreview'];

    if (nonColumnTypes.includes(field.type)) {
      return options;
    }

    // For other field types, provide column options based on field type constraints
    // Most input fields can use the full range, but some may have specific constraints
    const maxColumns = field.type === 'textarea' ? 16 : 16; // Can be customized per type if needed

    return [
      ...options,
      ...asArray(maxColumns)
        .filter((i) => i >= MIN_COLUMNS)
        .map(asOption),
    ];
  }, [field.type]);

  return SelectEntry({
    debounce,
    element: field,
    id,
    label: 'Columns',
    getOptions,
    getValue,
    setValue,
    validate,
  });
}

// helper /////////

function asOption(number) {
  return {
    value: number,
    label: number.toString(),
  };
}

function asArray(length) {
  return Array.from({ length }).map((_, i) => i + 1);
}
