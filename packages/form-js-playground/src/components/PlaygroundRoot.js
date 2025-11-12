import { useRef, useEffect, useState, useCallback } from 'preact/hooks';
import { isFunction } from 'min-dash';
import download from 'downloadjs';

import classNames from 'classnames';

import { Form, getSchemaVariables } from '@bpmn-io/form-js-viewer';

import { FormEditor } from '@bpmn-io/form-js-editor';

import { EmbedModal } from './EmbedModal';
import { ErrorNotification } from './ErrorNotification';
import { ExportMenu } from './ExportMenu';
import { JSONEditor } from './JSONEditor';
import { Section } from './Section';
import { TemplatePicker } from './TemplatePicker';
import { generateDemoDataForField } from '../util/generateDemoData';

import './FileDrop.css';
import './PlaygroundRoot.css';

/**
 * Convert custom type definitions to form field definitions for the viewer.
 *
 * @param {Array} customTypes - Array of custom type definitions
 * @param {Object} formFields - Form fields registry from editor
 * @param {Object} customTypeRegistry - Custom type registry from editor
 * @returns {Array} Array of form field definitions for viewer
 */
function convertCustomTypesForViewer(customTypes, formFields, customTypeRegistry) {
  if (!customTypes || !Array.isArray(customTypes) || customTypes.length === 0) {
    return [];
  }

  return customTypes
    .map((customType) => {
      const { type } = customType;

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
 * Register custom types with the viewer Form instance.
 *
 * @param {Object} formViewer - Viewer Form instance
 * @param {Object} formEditor - Editor FormEditor instance
 */
function registerCustomTypesWithViewer(formViewer, formEditor) {
  if (!formViewer || !formEditor) {
    return;
  }

  try {
    const customTypeRegistry = formEditor.get('customTypeRegistry', false);
    const formFields = formEditor.get('formFields', false);

    if (!customTypeRegistry || !formFields) {
      return;
    }

    // Ensure all custom types are registered in the editor first
    try {
      customTypeRegistry.ensureRegistered();
    } catch (error) {
      console.warn('Failed to ensure custom types are registered before syncing to viewer:', error);
    }

    // Get all custom types
    const customTypes = customTypeRegistry.list();
    if (!customTypes || customTypes.length === 0) {
      return;
    }

    // Convert and register each custom type with the viewer
    customTypes.forEach((customType) => {
      const { type } = customType;
      const registeredField = formFields.get(type, false);

      if (registeredField) {
        // Register the custom type with the viewer using the same form field definition
        formViewer.registerFormFieldType(registeredField);
      }
    });
  } catch (error) {
    console.warn('Failed to register custom types with viewer:', error);
  }
}

export function PlaygroundRoot(config) {
  const {
    additionalModules, // goes into both editor + viewer
    actions: actionsConfig,
    emit,
    exporter: exporterConfig,
    viewerProperties,
    editorProperties,
    viewerAdditionalModules,
    editorAdditionalModules,
    propertiesPanel: propertiesPanelConfig,
    apiLinkTarget,
    onInit,
  } = config;

  const { display: displayActions = true } = actionsConfig || {};

  const editorContainerRef = useRef();
  const paletteContainerRef = useRef();
  const propertiesPanelContainerRef = useRef();
  const viewerContainerRef = useRef();
  const inputDataContainerRef = useRef();
  const outputDataContainerRef = useRef();

  const formEditorRef = useRef();
  const formViewerRef = useRef();
  const inputDataRef = useRef();
  const outputDataRef = useRef();

  const [showEmbed, setShowEmbed] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [schema, setSchemaState] = useState();
  const [data, setData] = useState();
  const [fileDropError, setFileDropError] = useState(null);
  const [inputDataError, setInputDataError] = useState(null);

  // Validate and clean schema before setting it
  const validateAndCleanSchema = useCallback((schema) => {
    if (!schema || typeof schema !== 'object') {
      return null;
    }
    
    // Check for required properties
    if (!schema.type || !schema.components) {
      return null;
    }
    
    // Validate components array
    if (!Array.isArray(schema.components)) {
      return null;
    }
    
    // Filter out any undefined/null components and create a clean copy
    const cleanedComponents = schema.components.filter(component => component != null);
    
    // Return cleaned schema (don't mutate original)
    return {
      ...schema,
      components: cleanedComponents
    };
  }, []);

  // Wrapper for setSchema that validates and cleans
  const setSchema = useCallback((newSchema) => {
    try {
      const cleanedSchema = validateAndCleanSchema(newSchema);
      if (cleanedSchema) {
        setSchemaState(cleanedSchema);
      } else {
        console.warn('Invalid schema provided to setSchema:', newSchema);
      }
    } catch (error) {
      console.error('Error validating schema in setSchema:', error);
    }
  }, [validateAndCleanSchema]);

  const load = useCallback(async (schema, data) => {
    try {
      // Validate schema before importing
      const cleanedSchema = validateAndCleanSchema(schema);
      if (!cleanedSchema) {
        throw new Error('Invalid schema: missing required properties or malformed components array');
      }

      // Import schema (this is async and will fire import.done event)
      await formEditorRef.current.importSchema(cleanedSchema);
      
      setSchemaState(cleanedSchema);
      
      // Only set input editor value if data is not empty
      // Otherwise, let import.done handler generate demo data
      if (data && Object.keys(data).length > 0) {
        inputDataRef.current.setValue(toString(data));
        setData(data);
      } else {
        // Clear the editor to show placeholder initially
        // The import.done handler will populate it with demo data
        // Don't set data to {} here - let import.done handler set it with demo data
        inputDataRef.current.setValue('');
      }
    } catch (error) {
      console.error('Error in load function:', error);
      throw error;
    }
  }, [validateAndCleanSchema]);

  // initialize and link the editors
  useEffect(() => {
    const inputDataEditor = (inputDataRef.current = new JSONEditor({
      contentAttributes: { 'aria-label': 'Form Input', tabIndex: 0 },
      placeholder: createDataEditorPlaceholder(),
    }));

    const outputDataEditor = (outputDataRef.current = new JSONEditor({
      readonly: true,
      contentAttributes: { 'aria-label': 'Form Output', tabIndex: 0 },
    }));

    // Extract i18n config from viewerProperties (locale, fallbackLocale, translations)
    // These should be at the top level, not in properties
    const {
      locale: viewerLocale,
      fallbackLocale: viewerFallbackLocale,
      translations: viewerTranslations,
      ...viewerProps
    } = viewerProperties || {};

    const formViewer = (formViewerRef.current = new Form({
      container: viewerContainerRef.current,
      additionalModules: [...(additionalModules || []), ...(viewerAdditionalModules || [])],
      locale: viewerLocale,
      fallbackLocale: viewerFallbackLocale,
      translations: viewerTranslations,
      properties: {
        ...viewerProps,
        ariaLabel: 'Form Preview',
      },
    }));

    // Extract i18n config from editorProperties (locale, fallbackLocale, translations)
    // These should be at the top level, not in properties
    const {
      locale: editorLocale,
      fallbackLocale: editorFallbackLocale,
      translations: editorTranslations,
      ...editorProps
    } = editorProperties || {};

    const formEditor = (formEditorRef.current = new FormEditor({
      container: editorContainerRef.current,
      renderer: {
        compact: true,
      },
      palette: {
        parent: paletteContainerRef.current,
      },
      propertiesPanel: {
        parent: propertiesPanelContainerRef.current,
        ...(propertiesPanelConfig || {}),
      },
      exporter: exporterConfig,
      locale: editorLocale,
      fallbackLocale: editorFallbackLocale,
      translations: editorTranslations,
      properties: {
        ...editorProps,
        ariaLabel: 'Form Definition',
      },
      additionalModules: [...(additionalModules || []), ...(editorAdditionalModules || [])],
    }));

    // Register custom types with viewer after editor is initialized
    // Use setTimeout to ensure editor services are fully initialized
    setTimeout(() => {
      registerCustomTypesWithViewer(formViewer, formEditor);
    }, 0);

    // Handle formField.add events (when fields are added via commands, e.g., from palette)
    formEditor.on('formField.add', ({ formField }) => {
      const formFields = formEditor.get('formFields');
      const { config } = formFields.get(formField.type);
      const { generateInitialDemoData } = config;
      const { id } = formField;

      if (!id) {
        return;
      }

      let initialDemoData;

      // First, try to use field's own generateInitialDemoData function
      if (isFunction(generateInitialDemoData)) {
        initialDemoData = generateInitialDemoData(formField);
      } else {
        // Fallback to our utility function for common field types
        initialDemoData = generateDemoDataForField(formField);
      }

      // Only update if we have valid demo data
      if (initialDemoData === undefined) {
        return;
      }

      setData((currentData) => {
        const newData = {
          ...currentData,
          [id]: initialDemoData,
        };

        inputDataRef.current.setValue(toString(newData));

        return newData;
      });
    });

    // Handle import.done events (when schema is imported, e.g., from template)
    // Generate demo data for all fields after import
    formEditor.on('import.done', () => {
      // Use setTimeout to ensure this runs after load function completes
      // This ensures the editor is ready and state is properly initialized
      setTimeout(() => {
        const formFieldRegistry = formEditor.get('formFieldRegistry');
        const formFields = formEditor.get('formFields');
        const allFields = formFieldRegistry.getAll();
        
        const demoData = {};
        let hasDemoData = false;

        allFields.forEach((formField) => {
          const { id, type, key } = formField;

          // Skip non-keyed fields (text, html, button, spacer, separator, etc.)
          if (!id || !key) {
            return;
          }

          const { config } = formFields.get(type);
          const { generateInitialDemoData } = config;

          let initialDemoData;

          // First, try to use field's own generateInitialDemoData function
          if (isFunction(generateInitialDemoData)) {
            initialDemoData = generateInitialDemoData(formField);
          } else {
            // Fallback to our utility function for common field types
            initialDemoData = generateDemoDataForField(formField);
          }

          // Only add if we have valid demo data
          if (initialDemoData !== undefined) {
            demoData[id] = initialDemoData;
            hasDemoData = true;
          }
        });

        // Update data if we generated any demo data
        if (hasDemoData) {
          // Always set demo data directly (don't merge with existing empty data)
          setData(demoData);
          
          // Always update the input editor with the new data
          if (inputDataRef.current) {
            inputDataRef.current.setValue(toString(demoData));
          }
        }
      }, 0);
    });

    formEditor.on('changed', () => {
      try {
        const newSchema = formEditor.getSchema();
        // Use the validated setSchema wrapper
        setSchema(newSchema);
      } catch (error) {
        console.error('Error getting schema in changed event:', error);
        // Don't update schema if getSchema fails - keep current schema
      }
    });

    // Listen for custom type changes and sync them to the viewer
    // This ensures the viewer always has the latest custom types
    const handleCustomTypesChanged = () => {
      registerCustomTypesWithViewer(formViewer, formEditor);
    };

    // Listen for custom type lifecycle events
    formEditor.on('customTypes.changed', handleCustomTypesChanged);
    formEditor.on('customTypes.added', handleCustomTypesChanged);
    formEditor.on('customTypes.updated', handleCustomTypesChanged);

    formEditor.on('formEditor.rendered', () => {
      // notify interested parties after render
      emit('formPlayground.rendered');
    });

    const updateOutputData = () => {
      const submitData = formViewer._getSubmitData();
      outputDataEditor.setValue(toString(submitData));
    };

    // pipe viewer changes to output data editor
    formViewer.on('changed', updateOutputData);
    formViewer.on('formFieldInstance.added', updateOutputData);
    formViewer.on('formFieldInstance.removed', updateOutputData);

    inputDataEditor.on('changed', (event) => {
      const value = event.value.trim();
      
      // Handle empty or whitespace-only input - treat as empty object
      if (!value) {
        setData({});
        setInputDataError(null);
        emit('formPlayground.inputDataError', null);
        return;
      }
      
      try {
        const parsedData = JSON.parse(value);
        setData(parsedData);
        // Clear error on successful parse
        setInputDataError(null);
        emit('formPlayground.inputDataError', null);
      } catch (error) {
        // Set error state and notify interested parties
        setInputDataError(error);
        emit('formPlayground.inputDataError', error);
      }
    });

    inputDataEditor.attachTo(inputDataContainerRef.current);
    outputDataEditor.attachTo(outputDataContainerRef.current);

    return () => {
      inputDataEditor.destroy();
      outputDataEditor.destroy();
      formViewer.destroy();
      formEditor.destroy();
    };
  }, [
    additionalModules,
    editorAdditionalModules,
    editorProperties,
    emit,
    exporterConfig,
    propertiesPanelConfig,
    viewerAdditionalModules,
    viewerProperties,
  ]);

  // initialize data through props
  useEffect(() => {
    if (!config.initialSchema) {
      return;
    }

    load(config.initialSchema, config.initialData || {}).catch((error) => {
      console.error('Error loading initial schema:', error);
      // Don't re-throw - just log the error to prevent unhandled promise rejection
    });
  }, [config.initialSchema, config.initialData, load]);

  useEffect(() => {
    if (!schema || !formViewerRef.current) {
      return;
    }

    // Ensure custom types are registered before importing schema
    // This is critical because the schema might contain custom type fields
    if (formEditorRef.current) {
      registerCustomTypesWithViewer(formViewerRef.current, formEditorRef.current);
    }

    // Import schema into viewer
    formViewerRef.current.importSchema(schema, data).catch((error) => {
      console.error('Failed to import schema into viewer:', error);
    });
  }, [schema, data]);

  useEffect(() => {
    if (schema && inputDataContainerRef.current) {
      const variables = getSchemaVariables(schema);
      inputDataRef.current.setVariables(variables);
    }
  }, [schema]);

  // exposes api to parent
  useEffect(() => {
    if (!apiLinkTarget) {
      return;
    }

    // Guard against undefined refs
    if (!formEditorRef.current || !formViewerRef.current || !inputDataRef.current || !outputDataRef.current) {
      console.warn('PlaygroundRoot: Some refs are not initialized yet, delaying API setup');
      return;
    }

    apiLinkTarget.api = {
      attachDataContainer: (node) => {
        if (inputDataRef.current) {
          inputDataRef.current.attachTo(node);
        }
      },
      attachResultContainer: (node) => {
        if (outputDataRef.current) {
          outputDataRef.current.attachTo(node);
        }
      },
      attachFormContainer: (node) => {
        if (formViewerRef.current) {
          formViewerRef.current.attachTo(node);
        }
      },
      attachEditorContainer: (node) => {
        if (formEditorRef.current) {
          formEditorRef.current.attachTo(node);
        }
      },
      attachPaletteContainer: (node) => {
        if (formEditorRef.current) {
          const palette = formEditorRef.current.get('palette', false);
          if (palette) {
            palette.attachTo(node);
          }
        }
      },
      attachPropertiesPanelContainer: (node) => {
        if (formEditorRef.current) {
          const propertiesPanel = formEditorRef.current.get('propertiesPanel', false);
          if (propertiesPanel) {
            propertiesPanel.attachTo(node);
          }
        }
      },
      get: (name, strict) => {
        if (formEditorRef.current) {
          return formEditorRef.current.get(name, strict);
        }
        return undefined;
      },
      getDataEditor: () => inputDataRef.current,
      getEditor: () => formEditorRef.current,
      getForm: () => formViewerRef.current,
      getResultView: () => outputDataRef.current,
      getSchema: () => {
        if (!formEditorRef.current) {
          return null;
        }
        try {
          return formEditorRef.current.getSchema();
        } catch (error) {
          console.error('Error getting schema:', error);
          return null;
        }
      },
      saveSchema: () => {
        if (!formEditorRef.current) {
          return null;
        }
        try {
          return formEditorRef.current.saveSchema();
        } catch (error) {
          console.error('Error saving schema:', error);
          return null;
        }
      },
      setSchema: setSchema,
      setData: setData,
    };

    onInit();
  }, [apiLinkTarget, onInit]);

  // separate effect for state to avoid re-creating the api object every time
  useEffect(() => {
    if (!apiLinkTarget) {
      return;
    }

    apiLinkTarget.api.getState = () => ({ schema, data });
    apiLinkTarget.api.load = load;
  }, [apiLinkTarget, schema, data, load]);

  // Listen for file drop errors from parent Playground instance
  useEffect(() => {
    if (!apiLinkTarget || !apiLinkTarget.on) {
      return;
    }

    const handleFileDropError = (error) => {
      setFileDropError(error);
    };

    apiLinkTarget.on('formPlayground.fileDropError', handleFileDropError);

    return () => {
      if (apiLinkTarget.off) {
        apiLinkTarget.off('formPlayground.fileDropError', handleFileDropError);
      }
    };
  }, [apiLinkTarget]);

  const handleDownload = useCallback(() => {
    download(JSON.stringify(schema, null, '  '), 'form.json', 'text/json');
  }, [schema]);

  const hideEmbedModal = useCallback(() => {
    setShowEmbed(false);
  }, []);

  const showEmbedModal = useCallback(() => {
    setShowEmbed(true);
  }, []);

  const showTemplatePickerModal = useCallback(() => {
    setShowTemplatePicker(true);
  }, []);

  const hideTemplatePickerModal = useCallback(() => {
    setShowTemplatePicker(false);
  }, []);

  const handleTemplateSelect = useCallback(
    (templateSchema) => {
      load(templateSchema, {});
    },
    [load],
  );

  return (
    <div class={classNames('fjs-container', 'fjs-pgl-root')}>
      <div class="fjs-pgl-modals">
        {showEmbed ? <EmbedModal schema={schema} data={data} onClose={hideEmbedModal} /> : null}
        {showTemplatePicker ? <TemplatePicker onSelect={handleTemplateSelect} onClose={hideTemplatePickerModal} /> : null}
      </div>
      <div class="fjs-pgl-palette-container" ref={paletteContainerRef} />
      <div class="fjs-pgl-main">
        <Section name="Form Definition">
          {displayActions && (
            <Section.HeaderItem>
              <button type="button" class="fjs-pgl-button" title="Load a form template" onClick={showTemplatePickerModal}>
                Templates
              </button>
            </Section.HeaderItem>
          )}

          {displayActions && (
            <Section.HeaderItem>
              <ExportMenu schema={schema} data={data} onExportJSON={handleDownload} />
            </Section.HeaderItem>
          )}

          {displayActions && (
            <Section.HeaderItem>
              <button type="button" class="fjs-pgl-button" onClick={showEmbedModal}>
                Embed
              </button>
            </Section.HeaderItem>
          )}

          {fileDropError && (
            <ErrorNotification
              error={fileDropError}
              context="file"
              onDismiss={() => setFileDropError(null)}
            />
          )}

          <div ref={editorContainerRef} class="fjs-pgl-form-container"></div>
        </Section>
        <Section name="Form Preview">
          <div ref={viewerContainerRef} class="fjs-pgl-form-container"></div>
        </Section>
        <Section name="Form Input">
          {inputDataError && (
            <ErrorNotification
              error={inputDataError}
              context="input"
              onDismiss={() => {
                setInputDataError(null);
                emit('formPlayground.inputDataError', null);
              }}
            />
          )}
          <div ref={inputDataContainerRef} class="fjs-pgl-text-container"></div>
        </Section>
        <Section name="Form Output">
          <div ref={outputDataContainerRef} class="fjs-pgl-text-container"></div>
        </Section>
      </div>
      <div class="fjs-pgl-properties-container" ref={propertiesPanelContainerRef} />
    </div>
  );
}

// helpers ///////////////

function toString(obj) {
  return JSON.stringify(obj, null, '  ');
}

function createDataEditorPlaceholder() {
  const element = document.createElement('p');

  element.innerHTML =
    'Use this panel to simulate the form input, such as process variables.\nThis helps to test the form by populating the preview.\n\n' +
    'Follow the JSON format like this:\n\n' +
    '{\n  "variable": "value"\n}';

  return element;
}
