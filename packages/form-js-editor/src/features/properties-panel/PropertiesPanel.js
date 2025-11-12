import { PropertiesPanel as BasePropertiesPanel } from '@bpmn-io/properties-panel';

import { useCallback, useMemo, useState, useLayoutEffect, useRef } from 'preact/hooks';

import { reduce, isArray, get } from 'min-dash';

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

  // Track schema version to force recalculation when properties change
  const [schemaVersion, setSchemaVersion] = useState(0);

  // Use ref to track current selection without causing re-renders
  const selectedFormFieldRef = useRef(selectedFormField);
  selectedFormFieldRef.current = selectedFormField;

  // Only update selected field when selection actually changes
  const handleSelectionChanged = useCallback(
    (event) => {
      try {
        const newSelection = selectionModule.get() || formEditor._getState().schema;
        
      // Guard against undefined/null selection
      if (!newSelection) {
        const schema = formEditor._getState().schema;
        if (schema) {
          setSelectedFormField(schema);
        }
        return;
      }
        
        setSelectedFormField((prev) => {
          // Only update if selection actually changed
          if (prev === newSelection || (prev && newSelection && prev.id === newSelection.id)) {
            return prev;
          }
          return newSelection;
        });
      } catch (error) {
        // Fallback to schema if selection fails
        try {
          const schema = formEditor._getState().schema;
          if (schema) {
            setSelectedFormField(schema);
          }
        } catch (e) {
          // Silently handle fallback error
        }
      }
    },
    [formEditor, selectionModule],
  );

  // Handle schema changes - update when the selected field was modified
  const handleSchemaChanged = useCallback(
    (event) => {
      // Get schema from event or fallback to current state
      const schema = event?.schema || formEditor._getState().schema;
      if (!schema) {
        return;
      }

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
      
      if (updatedField) {
        // Always update to force re-render, even if reference is the same
        // This is necessary because fields are mutated in place
        setSelectedFormField((prev) => {
          // Force update by returning the found field
          // This ensures groups are recalculated when properties change
          return updatedField;
        });
        // Increment schema version to force groups recalculation
        setSchemaVersion((prev) => prev + 1);
        eventBus.fire('propertiesPanel.updated', {
          formField: updatedField,
        });
      }
    },
    [eventBus, formEditor],
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

  const editField = useCallback((formField, key, value) => {
    try {
      return modeling.editFormField(formField, key, value);
    } catch (error) {
      throw error;
    }
  }, [modeling]);

  // Guard against undefined selectedFormField
  const safeSelectedFormField = selectedFormField || formEditor._getState().schema;

  // Create a key based on field properties to force recalculation when properties change
  // This is necessary because fields are mutated in place, so reference equality doesn't detect changes
  // We use schemaVersion to force recalculation when schema changes
  const fieldPropertiesKey = useMemo(() => {
    if (!safeSelectedFormField || !safeSelectedFormField.id) {
      return '';
    }
    try {
      const properties = get(safeSelectedFormField, ['properties'], {});
      const key = `${schemaVersion}:${JSON.stringify(properties)}`;
      // Include schemaVersion to force recalculation
      return key;
    } catch (e) {
      // Fallback if JSON.stringify fails (e.g., circular references)
      const fallbackKey = `${schemaVersion}:${Date.now()}`;
      return fallbackKey;
    }
  }, [safeSelectedFormField, schemaVersion]);

  // retrieve groups for selected form field
  const providers = getProviders(safeSelectedFormField);

  const groups = useMemo(() => {
    // Guard against undefined/null selectedFormField
    if (!safeSelectedFormField) {
      return [];
    }

    try {
      const result = reduce(
        providers,
        function (groups, provider) {
          // do not collect groups for multi element state
          if (isArray(safeSelectedFormField)) {
            return [];
          }

          // Guard against undefined provider or getGroups method
          if (!provider || typeof provider.getGroups !== 'function') {
            return groups;
          }

          try {
            const updater = provider.getGroups(safeSelectedFormField, editField);
            
            // Guard against undefined updater
            if (typeof updater !== 'function') {
              return groups;
            }

            const updatedGroups = updater(groups);
            return updatedGroups;
          } catch (error) {
            return groups;
          }
        },
        [],
      );
      
      return result.filter((group) => {
        return group.items || (group.entries && group.entries.length);
      });
    } catch (error) {
      return [];
    }
  }, [providers, safeSelectedFormField, editField, fieldPropertiesKey]);

  const formFields = getService('formFields');

  const PropertiesPanelHeaderProvider = useMemo(
    () =>
      getPropertiesPanelHeaderProvider({
        getDocumentationRef: propertiesPanelConfig.getDocumentationRef,
        formFields,
      }),
    [formFields, propertiesPanelConfig],
  );

  // Guard against undefined selectedFormField before rendering
  if (!safeSelectedFormField) {
    return (
      <div
        class="fjs-properties-panel"
        onFocusCapture={onFocus}
        onBlurCapture={onBlur}>
        <FormPropertiesPanelContext.Provider value={propertiesPanelContext}>
          <BasePropertiesPanel
            element={null}
            eventBus={eventBus}
            groups={[]}
            headerProvider={PropertiesPanelHeaderProvider}
            placeholderProvider={PropertiesPanelPlaceholderProvider}
            feelPopupContainer={feelPopupContainer}
          />
        </FormPropertiesPanelContext.Provider>
      </div>
    );
  }

  return (
    <div
      class="fjs-properties-panel"
      data-field={safeSelectedFormField && safeSelectedFormField.id}
      onFocusCapture={onFocus}
      onBlurCapture={onBlur}>
      <FormPropertiesPanelContext.Provider value={propertiesPanelContext}>
        <BasePropertiesPanel
          element={safeSelectedFormField}
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
