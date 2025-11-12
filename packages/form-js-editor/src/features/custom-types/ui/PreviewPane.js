import { useEffect, useRef } from 'preact/hooks';
import { Form } from '@bpmn-io/form-js-viewer';

/**
 * Preview pane component that shows a live preview of the custom type.
 */
export function PreviewPane({ definition, formFields }) {
  const containerRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (!definition || !containerRef.current) {
      if (formRef.current) {
        formRef.current.destroy();
        formRef.current = null;
      }
      return;
    }

    // For preview, use the base type directly
    // The custom type will be available after publishing
    const baseType = definition.baseType || 'textfield';

    // Check if this is a select-based field type
    const selectBasedTypes = ['select', 'checklist', 'taglist', 'radio'];
    const isSelectBased = selectBasedTypes.includes(baseType);

    // Create a minimal schema with the base type (preview mode)
    // Note: This shows how the field will look, using the base type
    const schema = {
      type: 'default',
      components: [
        {
          type: baseType,
          key: 'preview',
          label: definition.config.label || definition.name,
          description: definition.config.description,
          helper: definition.config.helper,
          defaultValue: definition.config.defaultValue,
          required: definition.config.required,
          validate: {
            required: definition.config.required,
            min: definition.config.min,
            max: definition.config.max,
          },
          // Use 'values' for select-based fields, keep 'options' for others if needed
          ...(definition.config.options && isSelectBased
            ? { values: definition.config.options }
            : definition.config.options && !isSelectBased
            ? { options: definition.config.options }
            : {}),
        },
      ],
    };

    // Initialize form data with default value if provided
    const initialData = definition.config.defaultValue
      ? { preview: definition.config.defaultValue }
      : {};

    // Create form viewer instance with viewerProperties for i18n support
    const form = new Form({
      container: containerRef.current,
      viewerProperties: {
        locale: 'en',
        fallbackLocale: 'en',
        translations: {
          en: { 'select.placeholder': 'Select' },
        },
      },
    });

    formRef.current = form;

    // Import schema with initial data
    form.importSchema(schema, initialData).catch((error) => {
      console.error('Failed to import schema in preview:', error);
    });

    return () => {
      if (formRef.current) {
        formRef.current.destroy();
        formRef.current = null;
      }
    };
  }, [definition, formFields]);

  if (!definition) {
    return (
      <div class="fjs-custom-type-preview-empty">
        <p>Configure your custom type to see a preview</p>
      </div>
    );
  }

  return <div ref={containerRef} class="fjs-custom-type-preview-container" />;
}

