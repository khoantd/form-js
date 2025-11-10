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
  const [schema, setSchema] = useState();
  const [data, setData] = useState();
  const [fileDropError, setFileDropError] = useState(null);
  const [inputDataError, setInputDataError] = useState(null);

  const load = useCallback(async (schema, data) => {
    // Import schema (this is async and will fire import.done event)
    await formEditorRef.current.importSchema(schema);
    
    setSchema(schema);
    
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
  }, []);

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

    const formViewer = (formViewerRef.current = new Form({
      container: viewerContainerRef.current,
      additionalModules: [...(additionalModules || []), ...(viewerAdditionalModules || [])],
      properties: {
        ...(viewerProperties || {}),
        ariaLabel: 'Form Preview',
      },
    }));

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
      properties: {
        ...(editorProperties || {}),
        ariaLabel: 'Form Definition',
      },
      additionalModules: [...(additionalModules || []), ...(editorAdditionalModules || [])],
    }));

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
      setSchema(formEditor.getSchema());
    });

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

    load(config.initialSchema, config.initialData || {});
  }, [config.initialSchema, config.initialData, load]);

  useEffect(() => {
    schema && formViewerRef.current.importSchema(schema, data);
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

    apiLinkTarget.api = {
      attachDataContainer: (node) => inputDataRef.current.attachTo(node),
      attachResultContainer: (node) => outputDataRef.current.attachTo(node),
      attachFormContainer: (node) => formViewerRef.current.attachTo(node),
      attachEditorContainer: (node) => formEditorRef.current.attachTo(node),
      attachPaletteContainer: (node) => formEditorRef.current.get('palette').attachTo(node),
      attachPropertiesPanelContainer: (node) => formEditorRef.current.get('propertiesPanel').attachTo(node),
      get: (name, strict) => formEditorRef.current.get(name, strict),
      getDataEditor: () => inputDataRef.current,
      getEditor: () => formEditorRef.current,
      getForm: () => formViewerRef.current,
      getResultView: () => outputDataRef.current,
      getSchema: () => formEditorRef.current.getSchema(),
      saveSchema: () => formEditorRef.current.saveSchema(),
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
