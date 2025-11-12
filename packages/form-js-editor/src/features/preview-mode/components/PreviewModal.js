import { Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Form } from '@bpmn-io/form-js-viewer';
import { useService } from '../../../render/hooks/useService';

/**
 * Convert custom type definitions to form field definitions for the viewer.
 *
 * @param {Array} customTypes - Array of custom type definitions
 * @param {Object} formFields - Form fields registry from editor
 * @returns {Array} Array of form field definitions for viewer
 */
function convertCustomTypesForViewer(customTypes, formFields, customTypeRegistry) {
  if (!customTypes || !Array.isArray(customTypes) || customTypes.length === 0) {
    return [];
  }

  return customTypes
    .map((customType) => {
      const { type, baseType } = customType;

      // Ensure the custom type is registered before trying to get it
      if (customTypeRegistry) {
        try {
          customTypeRegistry.ensureRegistered();
        } catch (error) {
          console.warn(`Failed to ensure custom type "${type}" is registered:`, error);
        }
      }

      // Get the registered form field from editor (which includes custom types)
      const registeredField = formFields.get(type, false);
      if (!registeredField) {
        console.warn(`Custom type "${type}" not found in formFields registry`);
        return null;
      }

      // Return the form field definition as-is (it's already in the correct format)
      return registeredField;
    })
    .filter(Boolean);
}

/**
 * Preview modal component that displays the form in preview mode.
 */
export function PreviewModal() {
  const previewMode = useService('previewMode');
  const formEditor = useService('formEditor');
  const eventBus = useService('eventBus');
  const customTypeRegistry = useService('customTypeRegistry', false);
  const formFields = useService('formFields', false);
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const [isActive, setIsActive] = useState(previewMode.isActive());

  useEffect(() => {
    function handlePreviewModeChanged(event) {
      setIsActive(event.active);
    }

    eventBus.on('previewMode.changed', handlePreviewModeChanged);

    return () => {
      eventBus.off('previewMode.changed', handlePreviewModeChanged);
    };
  }, [eventBus]);

  // Initialize form viewer when entering preview mode
  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // Clean up form when exiting preview mode
      if (formRef.current) {
        formRef.current.destroy();
        formRef.current = null;
      }
      return;
    }

    const { schema } = formEditor._getState();

    if (!schema) {
      return;
    }

        // Get custom types and convert them for the viewer
        let customFormFieldTypes = [];
        if (customTypeRegistry && formFields) {
          // Ensure all custom types are registered before converting
          try {
            customTypeRegistry.ensureRegistered();
          } catch (error) {
            console.warn('Failed to ensure custom types are registered before preview:', error);
          }
          const customTypes = customTypeRegistry.list();
          customFormFieldTypes = convertCustomTypesForViewer(customTypes, formFields, customTypeRegistry);
        }

    // Create form viewer instance with custom types
    const form = new Form({
      container: containerRef.current,
      customFormFieldTypes,
    });

    formRef.current = form;

    // Import schema with empty data initially
    form.importSchema(schema, {}).catch((error) => {
      console.error('Failed to import schema in preview mode:', error);
    });

    // Listen for schema changes
    function handleSchemaChanged(newState) {
      if (form && formRef.current && newState.schema) {
        // Preserve current form data when schema updates
        const currentData = form._getState()?.data || {};
        form.importSchema(newState.schema, currentData).catch((error) => {
          console.error('Failed to update schema in preview mode:', error);
        });
      }
    }

    // Listen for custom types changes - recreate form with updated custom types
    function handleCustomTypesChanged() {
      if (!formRef.current || !containerRef.current) {
        return;
      }

      const { schema: currentSchema } = formEditor._getState();
      if (!currentSchema) {
        return;
      }

      // Preserve current form data
      const currentData = formRef.current._getState()?.data || {};

      // Destroy old form
      formRef.current.destroy();
      formRef.current = null;

          // Get updated custom types
          let updatedCustomFormFieldTypes = [];
          if (customTypeRegistry && formFields) {
            // Ensure all custom types are registered before converting
            try {
              customTypeRegistry.ensureRegistered();
            } catch (error) {
              console.warn('Failed to ensure custom types are registered before preview update:', error);
            }
            const customTypes = customTypeRegistry.list();
            updatedCustomFormFieldTypes = convertCustomTypesForViewer(customTypes, formFields, customTypeRegistry);
          }

      // Create new form with updated custom types
      const newForm = new Form({
        container: containerRef.current,
        customFormFieldTypes: updatedCustomFormFieldTypes,
      });

      formRef.current = newForm;

      // Re-import schema with preserved data
      newForm.importSchema(currentSchema, currentData).catch((error) => {
        console.error('Failed to re-import schema after custom types change:', error);
      });
    }

    eventBus.on('changed', handleSchemaChanged);
    if (customTypeRegistry) {
      eventBus.on('customTypes.changed', handleCustomTypesChanged);
    }

    return () => {
      eventBus.off('changed', handleSchemaChanged);
      if (customTypeRegistry) {
        eventBus.off('customTypes.changed', handleCustomTypesChanged);
      }
      if (formRef.current) {
        formRef.current.destroy();
        formRef.current = null;
      }
    };
  }, [isActive, formEditor, eventBus, customTypeRegistry, formFields]);

  // Handle escape key to exit preview mode
  useEffect(() => {
    if (!isActive) {
      return;
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        previewMode.exit();
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isActive, previewMode]);

  if (!isActive) {
    return null;
  }

  return (
    <Fragment>
      <div class="fjs-preview-modal-overlay" onClick={() => previewMode.exit()} />
      <div class="fjs-preview-modal">
        <div class="fjs-preview-modal-header">
          <h2 class="fjs-preview-modal-title">Form Preview</h2>
          <button
            type="button"
            class="fjs-preview-modal-close"
            onClick={() => previewMode.exit()}
            aria-label="Close preview">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="fjs-preview-modal-content">
          <div ref={containerRef} class="fjs-preview-modal-form-container" />
        </div>
      </div>
    </Fragment>
  );
}

