import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { FormPlayground } from '@bpmn-io/form-js';
import { navigate } from '../utils/router';
import { FileUpload } from './FileUpload';

/**
 * Playground page component
 * Wraps FormPlayground with error handling and file upload support
 */
export function PlaygroundPage() {
  const containerRef = useRef(null);
  const playgroundRef = useRef(null);
  const [schema, setSchema] = useState(null);
  const [data, setData] = useState(null);
  const [importError, setImportError] = useState(null);
  const [fileDropError, setFileDropError] = useState(null);

  // Load schema and data from sessionStorage on mount
  useEffect(() => {
    const storedSchema = sessionStorage.getItem('demo-schema');
    const storedData = sessionStorage.getItem('demo-data');

    if (storedSchema) {
      try {
        const parsedSchema = JSON.parse(storedSchema);
        const parsedData = storedData ? JSON.parse(storedData) : {};
        setSchema(parsedSchema);
        setData(parsedData);
      } catch (error) {
        setImportError(error);
      }
    } else {
      // No schema found, redirect to landing page
      navigate('/start');
    }
  }, []);

  // Initialize playground when schema is available
  useEffect(() => {
    if (!schema || !containerRef.current) {
      return;
    }

    // Create playground instance
    const playground = new FormPlayground({
      container: containerRef.current,
      schema,
      data,
    });

    playgroundRef.current = playground;

    // Listen for file drop errors
    const handleFileDropError = (error) => {
      setFileDropError(error);
    };

    const handleInit = () => {
      setImportError(null);
    };

    playground.on('formPlayground.fileDropError', handleFileDropError);
    playground.on('formPlayground.init', handleInit);

    // Cleanup on unmount
    return () => {
      if (playgroundRef.current) {
        playgroundRef.current.off('formPlayground.fileDropError', handleFileDropError);
        playgroundRef.current.off('formPlayground.init', handleInit);
        playgroundRef.current.destroy();
        playgroundRef.current = null;
      }
    };
  }, [schema, data]);

  const handleFileLoad = useCallback((newSchema) => {
    setSchema(newSchema);
    setData({});
    setImportError(null);
    setFileDropError(null);
    
    // Update sessionStorage
    sessionStorage.setItem('demo-schema', JSON.stringify(newSchema));
    sessionStorage.setItem('demo-data', JSON.stringify({}));
    
    // Reload playground with new schema
    if (playgroundRef.current) {
      playgroundRef.current.setSchema(newSchema);
    }
  }, []);

  const handleFileError = useCallback((error) => {
    setFileDropError(error);
  }, []);

  const handleBackToStart = useCallback(() => {
    navigate('/start');
  }, []);

  const handleDismissError = useCallback(() => {
    setImportError(null);
    setFileDropError(null);
  }, []);

  if (!schema) {
    return (
      <div class="demo-loading">
        <p>Loading form...</p>
      </div>
    );
  }

  return (
    <div class="demo-playground-page">
      <div class="demo-playground-header">
        <button
          type="button"
          class="demo-button demo-button-secondary"
          onClick={handleBackToStart}
        >
          ← Back to start
        </button>

        <div class="demo-playground-actions">
          <FileUpload
            onFileLoad={handleFileLoad}
            onError={handleFileError}
            showButton={true}
          />
        </div>
      </div>

      {(importError || fileDropError) && (
        <div class="demo-error-banner" role="alert">
          <div class="demo-error-banner-content">
            <div class="demo-error-banner-icon">⚠️</div>
            <div class="demo-error-banner-text">
              <div class="demo-error-banner-title">
                {importError ? 'Import Error' : 'File Error'}
              </div>
              <div class="demo-error-banner-message">
                {(importError || fileDropError)?.message || 'An error occurred'}
              </div>
            </div>
            <button
              type="button"
              class="demo-error-banner-dismiss"
              onClick={handleDismissError}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div ref={containerRef} class="demo-playground-container"></div>
    </div>
  );
}

