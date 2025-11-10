import { PropertiesPanel as BasePropertiesPanel } from '@bpmn-io/properties-panel';

import { useCallback, useMemo, useState, useLayoutEffect, useRef } from 'preact/hooks';

import { reduce, isArray } from 'min-dash';

import { FormPropertiesPanelContext } from './context';

import { getPropertiesPanelHeaderProvider } from './PropertiesPanelHeaderProvider';
import { PropertiesPanelPlaceholderProvider } from './PropertiesPanelPlaceholderProvider';

const EMPTY = {};

export function PropertiesPanel(props) {
  const { eventBus, getProviders, injector } = props;

  const formEditor = injector.get('formEditor');
  const modeling = injector.get('modeling');
  const selectionModule = injector.get('selection');
  const propertiesPanelConfig = injector.get('config.propertiesPanel') || EMPTY;

  const { feelPopupContainer } = propertiesPanelConfig;

  const [selectedFormField, setSelectedFormField] = useState(
    () => selectionModule.get() || formEditor._getState().schema,
  );

  // Use ref to track current selection without causing re-renders
  const selectedFormFieldRef = useRef(selectedFormField);
  selectedFormFieldRef.current = selectedFormField;

  // Only update selected field when selection actually changes
  const handleSelectionChanged = useCallback(
    (event) => {
      const newSelection = selectionModule.get() || formEditor._getState().schema;
      setSelectedFormField((prev) => {
        // Only update if selection actually changed
        if (prev === newSelection || (prev && newSelection && prev.id === newSelection.id)) {
          return prev;
        }
        return newSelection;
      });
    },
    [formEditor, selectionModule],
  );

  // Handle schema changes - only update if the selected field was modified
  const handleSchemaChanged = useCallback(
    (event) => {
      // Handle case where event might be undefined or not have schema property
      if (!event || !event.schema) {
        return;
      }

      const { schema } = event;
      const currentField = selectedFormFieldRef.current;
      if (!currentField || !currentField.id) {
        return;
      }

      // Find the updated field in the new schema
      const findFieldInSchema = (components, targetId) => {
        if (!components) return null;
        for (const component of components) {
          if (component.id === targetId) {
            return component;
          }
          if (component.components) {
            const found = findFieldInSchema(component.components, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const updatedField = findFieldInSchema(schema.components, currentField.id);
      if (updatedField && updatedField !== currentField) {
        setSelectedFormField(updatedField);
        eventBus.fire('propertiesPanel.updated', {
          formField: updatedField,
        });
      }
    },
    [eventBus],
  );

  useLayoutEffect(() => {
    eventBus.on('selection.changed', handleSelectionChanged);
    eventBus.on('changed', handleSchemaChanged);
    eventBus.on('import.done', handleSelectionChanged);

    return () => {
      eventBus.off('selection.changed', handleSelectionChanged);
      eventBus.off('changed', handleSchemaChanged);
      eventBus.off('import.done', handleSelectionChanged);
    };
  }, [eventBus, handleSelectionChanged, handleSchemaChanged]);

  const getService = (type, strict = true) => injector.get(type, strict);

  const propertiesPanelContext = { getService };

  const onFocus = () => eventBus.fire('propertiesPanel.focusin');

  const onBlur = () => eventBus.fire('propertiesPanel.focusout');

  const editField = useCallback((formField, key, value) => modeling.editFormField(formField, key, value), [modeling]);

  // retrieve groups for selected form field
  const providers = getProviders(selectedFormField);

  const groups = useMemo(() => {
    return reduce(
      providers,
      function (groups, provider) {
        // do not collect groups for multi element state
        if (isArray(selectedFormField)) {
          return [];
        }

        const updater = provider.getGroups(selectedFormField, editField);

        return updater(groups);
      },
      [],
    );
  }, [providers, selectedFormField, editField]);

  const formFields = getService('formFields');

  const PropertiesPanelHeaderProvider = useMemo(
    () =>
      getPropertiesPanelHeaderProvider({
        getDocumentationRef: propertiesPanelConfig.getDocumentationRef,
        formFields,
      }),
    [formFields, propertiesPanelConfig],
  );

  return (
    <div
      class="fjs-properties-panel"
      data-field={selectedFormField && selectedFormField.id}
      onFocusCapture={onFocus}
      onBlurCapture={onBlur}>
      <FormPropertiesPanelContext.Provider value={propertiesPanelContext}>
        <BasePropertiesPanel
          element={selectedFormField}
          eventBus={eventBus}
          groups={groups}
          headerProvider={PropertiesPanelHeaderProvider}
          placeholderProvider={PropertiesPanelPlaceholderProvider}
          feelPopupContainer={feelPopupContainer}
        />
      </FormPropertiesPanelContext.Provider>
    </div>
  );
}
