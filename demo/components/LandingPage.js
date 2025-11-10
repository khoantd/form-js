import { useCallback } from 'preact/hooks';
import { navigate } from '../utils/router';
import { defaultTemplateRegistry } from '@bpmn-io/form-js-templates';
import { FileUpload } from './FileUpload';

/**
 * Landing page component
 * Displays "Open or create a form" message with options to create invoice form or upload file
 */
export function LandingPage() {
  const handleCreateInvoice = useCallback(() => {
    const invoiceTemplate = defaultTemplateRegistry.getTemplate('invoice');
    if (invoiceTemplate) {
      // Store schema in sessionStorage to pass to playground
      sessionStorage.setItem('demo-schema', JSON.stringify(invoiceTemplate.schema));
      sessionStorage.setItem('demo-data', JSON.stringify({}));
      navigate('/playground');
    }
  }, []);

  const handleFileLoad = useCallback((schema) => {
    // Store schema in sessionStorage to pass to playground
    sessionStorage.setItem('demo-schema', JSON.stringify(schema));
    sessionStorage.setItem('demo-data', JSON.stringify({}));
    navigate('/playground');
  }, []);

  const handleFileError = useCallback((error) => {
    // Error is displayed by FileUpload component
    console.error('File upload error:', error);
  }, []);

  return (
    <div class="demo-landing-page">
      <div class="demo-landing-content">
        <h1 class="demo-landing-title">Open or create a form</h1>
        <p class="demo-landing-subtitle">
          Use form-js to create forms and embed them into any webpage.
        </p>

        <div class="demo-landing-actions">
          <button
            type="button"
            class="demo-button demo-button-primary demo-button-large"
            onClick={handleCreateInvoice}
          >
            Create a simple invoice form
          </button>

          <FileUpload
            onFileLoad={handleFileLoad}
            onError={handleFileError}
            showButton={true}
          />
        </div>

        <div class="demo-landing-info">
          <p>
            You can drag and drop a form file anywhere on this page, or use the button above to select a file.
          </p>
        </div>
      </div>
    </div>
  );
}

