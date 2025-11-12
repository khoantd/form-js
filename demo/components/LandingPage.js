import { useCallback } from 'preact/hooks';
import { navigate } from '../utils/router';
import { defaultTemplateRegistry } from '@bpmn-io/form-js-templates';
import { FileUpload } from './FileUpload';

/**
 * Landing page component
 * Displays "Open or create a form" message with options to create invoice form or upload file
 */
export function LandingPage() {
  const handleOpenI18nDemo = useCallback(() => {
    // Simple schema showcasing localized labels and select options
    const schema = {
      schemaVersion: 19,
      type: 'default',
      components: [
        {
          type: 'text',
          key: 'fullName',
          label: {
            en: 'Full name',
            de: 'Vollständiger Name'
          },
          description: {
            en: 'Please enter your full legal name.',
            de: 'Bitte geben Sie Ihren vollständigen Namen ein.'
          },
          validate: {
            required: true
          }
        },
        {
          type: 'select',
          key: 'language',
          label: {
            en: 'Preferred language',
            de: 'Bevorzugte Sprache'
          },
          values: [
            { value: 'en', label: { en: 'English', de: 'Englisch' } },
            { value: 'de', label: { en: 'German', de: 'Deutsch' } }
          ],
          validate: {
            required: true
          }
        }
      ]
    };

    // Store schema for playground and clear data
    sessionStorage.setItem('demo-schema', JSON.stringify(schema));
    sessionStorage.setItem('demo-data', JSON.stringify({}));

    // Provide a hint for initial locale; toolbar can override
    sessionStorage.setItem('demo-locale', 'en');

    navigate('/playground');
  }, []);

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

        <div class="demo-whats-new" aria-labelledby="whats-new-title">
          <h2 id="whats-new-title" class="demo-section-title">What’s new</h2>
          <div class="demo-whats-new-items">
            <div class="demo-card">
              <div class="demo-card-badge">i18n</div>
              <h3 class="demo-card-title">Localized labels and options</h3>
              <p class="demo-card-text">
                Try labels and select options localized to multiple languages.
              </p>
              <button
                type="button"
                class="demo-button demo-button-secondary"
                onClick={handleOpenI18nDemo}
              >
                Open i18n demo
              </button>
            </div>
            <div class="demo-card">
              <div class="demo-card-badge">Themes</div>
              <h3 class="demo-card-title">Theme presets</h3>
              <p class="demo-card-text">
                Switch between light, dark, Carbon and high-contrast in the playground toolbar.
              </p>
              <button
                type="button"
                class="demo-button demo-button-tertiary"
                onClick={handleCreateInvoice}
              >
                Start with invoice
              </button>
            </div>
            <div class="demo-card">
              <div class="demo-card-badge">Custom Types</div>
              <h3 class="demo-card-title">Custom Type Builder</h3>
              <p class="demo-card-text">
                Create your own form field types with a no-code builder. Design custom fields and use them immediately in your forms.
              </p>
              <button
                type="button"
                class="demo-button demo-button-secondary"
                onClick={handleCreateInvoice}
              >
                Try it now
              </button>
            </div>
          </div>
        </div>

        <div class="demo-landing-info">
          <p>
            You can drag and drop a form file anywhere on this page, or use the button above to select a file.
          </p>
          <p class="demo-landing-hint" aria-live="polite">
            Supports form JSON v19. You can drag &amp; drop a file anywhere.
          </p>
        </div>
      </div>
    </div>
  );
}

