import { Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Form } from '@bpmn-io/form-js-viewer';
import { useService } from '../../../render/hooks/useService';

/**
 * Preview modal component that displays the form in preview mode.
 */
export function PreviewModal() {
  const previewMode = useService('previewMode');
  const formEditor = useService('formEditor');
  const eventBus = useService('eventBus');
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

    // Create form viewer instance
    const form = new Form({
      container: containerRef.current,
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

    eventBus.on('changed', handleSchemaChanged);

    return () => {
      eventBus.off('changed', handleSchemaChanged);
      if (formRef.current) {
        formRef.current.destroy();
        formRef.current = null;
      }
    };
  }, [isActive, formEditor, eventBus]);

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

