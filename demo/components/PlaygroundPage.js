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
  const [locale, setLocale] = useState(sessionStorage.getItem('demo-locale') || 'en');
  const [themePreset, setThemePreset] = useState(sessionStorage.getItem('demo-theme') || 'light');
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [customTypes, setCustomTypes] = useState([]);
  const [importError, setImportError] = useState(null);
  const [fileDropError, setFileDropError] = useState(null);
  const errorRef = useRef(null);

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

  // Focus error banner when it appears
  useEffect(() => {
    if (importError || fileDropError) {
      errorRef.current?.focus();
    }
  }, [importError, fileDropError]);

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
      viewerProperties: {
        locale,
        fallbackLocale: 'en',
        translations: {
          en: { 'select.placeholder': 'Select' },
          de: { 'select.placeholder': 'Auswählen' },
        },
      },
      editorProperties: {
        locale,
        fallbackLocale: 'en',
        translations: {
          en: {},
          de: {},
        },
      },
    });

    playgroundRef.current = playground;

    // Listen for file drop errors
    const handleFileDropError = (error) => {
      setFileDropError(error);
    };

    const handleInit = () => {
      setImportError(null);
      // Apply initial theme preset
      try {
        playground.applyTheme({ preset: themePreset }, false);
      } catch (e) {
        // ignore if theme API not available
      }
      // Initialize versions list
      try {
        const editor = playground.getEditor();
        const versionControl = editor.get('versionControl', false);
        if (versionControl) {
          setVersions(versionControl.listVersions());
          setSelectedVersionId(versionControl.getCurrentVersionId());
        }
        // Initialize custom types list
        const customTypeRegistry = editor.get('customTypeRegistry', false);
        if (customTypeRegistry) {
          setCustomTypes(customTypeRegistry.list());
        }
      } catch (e) {
        // ignore
      }
    };

    playground.on('formPlayground.fileDropError', handleFileDropError);
    playground.on('formPlayground.init', handleInit);

    // update versions and custom types on change
    let offChanged, offCustomTypesChanged;
    try {
      // Use a small delay to ensure editor is fully initialized
      setTimeout(() => {
    try {
      const editor = playground.getEditor();
      const eventBus = editor && editor.get('eventBus', false);
      if (eventBus) {
        const onChanged = () => {
          const vc = editor.get('versionControl', false);
          if (vc) {
            setVersions(vc.listVersions());
            setSelectedVersionId(vc.getCurrentVersionId());
          }
              const customTypeRegistry = editor.get('customTypeRegistry', false);
              if (customTypeRegistry) {
                setCustomTypes(customTypeRegistry.list());
              }
        };
        eventBus.on('changed', onChanged);
        offChanged = () => eventBus.off('changed', onChanged);

            // Listen for custom types changes
            const onCustomTypesChanged = () => {
              const customTypeRegistry = editor.get('customTypeRegistry', false);
              if (customTypeRegistry) {
                setCustomTypes(customTypeRegistry.list());
              }
            };
            eventBus.on('customTypes.changed', onCustomTypesChanged);
            offCustomTypesChanged = () => eventBus.off('customTypes.changed', onCustomTypesChanged);
          }
        } catch (e) {
          // ignore
        }
      }, 100);
    } catch (e) {
      // ignore
    }

    // Cleanup on unmount
    return () => {
      if (playgroundRef.current) {
        playgroundRef.current.off('formPlayground.fileDropError', handleFileDropError);
        playgroundRef.current.off('formPlayground.init', handleInit);
        if (offChanged) offChanged();
        if (offCustomTypesChanged) offCustomTypesChanged();
        playgroundRef.current.destroy();
        playgroundRef.current = null;
      }
    };
  }, [schema, data, locale, themePreset]);

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

  const handleLocaleChange = useCallback((e) => {
    const newLocale = e.target.value;
    setLocale(newLocale);
    sessionStorage.setItem('demo-locale', newLocale);
  }, []);

  const handleThemeChange = useCallback((e) => {
    const newTheme = e.target.value;
    setThemePreset(newTheme);
    sessionStorage.setItem('demo-theme', newTheme);
    if (playgroundRef.current) {
      try {
        playgroundRef.current.applyTheme({ preset: newTheme }, false);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSaveVersion = useCallback(() => {
    if (!playgroundRef.current) return;
    try {
      const editor = playgroundRef.current.getEditor();
      const versionControl = editor.get('versionControl', false);
      if (!versionControl) return;
      const label = new Date().toLocaleString();
      const saved = versionControl.saveVersion({ label });
      setVersions(versionControl.listVersions());
      setSelectedVersionId(saved.id);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleRestoreVersion = useCallback(() => {
    if (!playgroundRef.current || !selectedVersionId) return;
    try {
      const editor = playgroundRef.current.getEditor();
      const versionControl = editor.get('versionControl', false);
      if (!versionControl) return;
      versionControl.restoreVersion(selectedVersionId);
      setVersions(versionControl.listVersions());
    } catch (e) {
      // ignore
    }
  }, [selectedVersionId]);

  const handleExportHistory = useCallback(() => {
    if (!playgroundRef.current) return;
    try {
      const editor = playgroundRef.current.getEditor();
      const versionControl = editor.get('versionControl', false);
      if (!versionControl) return;
      const payload = versionControl.exportHistory();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'versions.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleImportHistory = useCallback((e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !playgroundRef.current) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        const editor = playgroundRef.current.getEditor();
        const versionControl = editor.get('versionControl', false);
        if (!versionControl) return;
        versionControl.importHistory(payload);
        setVersions(versionControl.listVersions());
        setSelectedVersionId(versionControl.getCurrentVersionId());
      } catch (err) {
        setImportError(err instanceof Error ? err : new Error('Invalid history file'));
      }
    };
    reader.onerror = () => {
      setImportError(new Error('Failed to read history file'));
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleExportCustomTypes = useCallback(() => {
    if (!playgroundRef.current) return;
    try {
      const editor = playgroundRef.current.getEditor();
      const json = editor.exportCustomTypes();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'custom-types.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export custom types:', e);
    }
  }, []);

  const handleImportCustomTypes = useCallback((e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !playgroundRef.current) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = String(reader.result);
        const editor = playgroundRef.current.getEditor();
        const merge = confirm('Merge with existing custom types? (Cancel to replace all)');
        editor.importCustomTypes(json, merge);
        const customTypeRegistry = editor.get('customTypeRegistry', false);
        if (customTypeRegistry) {
          setCustomTypes(customTypeRegistry.list());
        }
      } catch (err) {
        setImportError(err instanceof Error ? err : new Error('Invalid custom types file'));
      }
    };
    reader.onerror = () => {
      setImportError(new Error('Failed to read custom types file'));
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleOpenCustomTypeBuilder = useCallback(() => {
    if (!playgroundRef.current) {
      setImportError(new Error('Playground not ready. Please wait a moment and try again.'));
      return;
    }
    try {
      const editor = playgroundRef.current.getEditor();
      if (!editor) {
        setImportError(new Error('Editor not ready. Please wait a moment and try again.'));
        return;
      }
      const eventBus = editor.get('eventBus', false);
      if (eventBus) {
        eventBus.fire('customTypes.openBuilder');
        // Clear any previous errors on success
        setImportError(null);
      } else {
        setImportError(new Error('Custom type builder is not available. Please refresh the page.'));
      }
    } catch (e) {
      console.error('Failed to open custom type builder:', e);
      setImportError(new Error('Failed to open custom type builder: ' + (e.message || 'Unknown error')));
    }
  }, []);

  const handleExportSchemaJSON = useCallback(() => {
    const current = playgroundRef.current && playgroundRef.current.getSchema && playgroundRef.current.getSchema();
    if (!current) return;
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportDataJSON = useCallback(() => {
    const state = playgroundRef.current && playgroundRef.current.getState && playgroundRef.current.getState();
    const out = (state && state.data) || {};
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
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
          <div class="demo-toolbar">
            <label class="demo-toolbar-field">
              <span class="demo-toolbar-label">Language</span>
              <select class="demo-select" value={locale} onChange={handleLocaleChange} aria-label="Language">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </label>
            <label class="demo-toolbar-field">
              <span class="demo-toolbar-label">Theme</span>
              <select class="demo-select" value={themePreset} onChange={handleThemeChange} aria-label="Theme">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="carbon">Carbon</option>
                <option value="high-contrast">High contrast</option>
              </select>
            </label>
            <div class="demo-toolbar-group">
              <button type="button" class="demo-button demo-button-secondary" onClick={handleExportSchemaJSON}>
                Export schema (JSON)
              </button>
              <button type="button" class="demo-button demo-button-secondary" onClick={handleExportDataJSON}>
                Export data (JSON)
              </button>
            </div>
            <div class="demo-toolbar-group">
              <button type="button" class="demo-button demo-button-secondary" onClick={handleSaveVersion}>
                Save version
              </button>
              <label class="sr-only" for="version-select">Versions</label>
              <select
                id="version-select"
                class="demo-select"
                value={selectedVersionId || ''}
                onChange={(e) => setSelectedVersionId(e.target.value || null)}
                aria-label="Versions"
              >
                <option value="">Select version…</option>
                {versions.map((v) => (
                  <option value={v.id}>
                    {(v.label || new Date(v.createdAt).toLocaleString())}
                  </option>
                ))}
              </select>
              <button type="button" class="demo-button demo-button-secondary" onClick={handleRestoreVersion} disabled={!selectedVersionId}>
                Restore
              </button>
              <button type="button" class="demo-button demo-button-secondary" onClick={handleExportHistory}>
                Export history
              </button>
              <label class="demo-button demo-button-secondary">
                Import history
                <input type="file" accept=".json" class="sr-only" onChange={handleImportHistory} />
              </label>
            </div>
            <div class="demo-toolbar-group">
              <button
                type="button"
                class="demo-button demo-button-primary demo-button-small"
                onClick={handleOpenCustomTypeBuilder}
                title="Create a new custom form field type"
              >
                + New Custom Type
              </button>
            </div>
            {customTypes.length > 0 && (
              <div class="demo-toolbar-group">
                <div class="demo-custom-types-info">
                  <span class="demo-custom-types-count">
                    {customTypes.length} custom type{customTypes.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    class="demo-button demo-button-secondary demo-button-small"
                    onClick={handleExportCustomTypes}
                    title="Export custom types"
                  >
                    Export types
                  </button>
                  <label class="demo-button demo-button-secondary demo-button-small">
                    Import types
                <input
                      type="file"
                      accept=".json"
                      class="sr-only"
                      onChange={handleImportCustomTypes}
                    />
              </label>
            </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(importError || fileDropError) && (
        <div ref={errorRef} class="demo-error-banner" role="alert" tabIndex={-1}>
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

