import { get } from 'min-dash';

import { arrayAdd, arrayRemove, updatePath } from './Util';

export class AddFormFieldHandler {
  /**
   * @constructor
   * @param { import('../../../FormEditor').FormEditor } formEditor
   * @param { import('../../../core/FormFieldRegistry').FormFieldRegistry } formFieldRegistry
   */
  constructor(formEditor, formFieldRegistry) {
    this._formEditor = formEditor;
    this._formFieldRegistry = formFieldRegistry;
  }

  execute(context) {
    const { formField, targetFormField, targetIndex } = context;

    const { schema } = this._formEditor._getState();

    const targetPath = [...targetFormField._path, 'components'];

    // Set parent relationship (registry will maintain object graph)
    formField._parent = targetFormField.id;

    // (1) Add new form field
    arrayAdd(get(schema, targetPath), targetIndex, formField);

    // (2) Update internal paths of new form field and its siblings (and their children)
    get(schema, targetPath).forEach((formField, index) => updatePath(this._formFieldRegistry, formField, index));

    // (3) Add new form field to form field registry (establishes parent-child relationship)
    this._formFieldRegistry.add(formField);

    // Schema state is automatically updated by SchemaUpdater
  }

  revert(context) {
    const { formField, targetFormField, targetIndex } = context;

    const { schema } = this._formEditor._getState();

    const targetPath = [...targetFormField._path, 'components'];

    // (1) Remove new form field
    arrayRemove(get(schema, targetPath), targetIndex);

    // (2) Update internal paths of new form field and its siblings (and their children)
    get(schema, targetPath).forEach((formField, index) => updatePath(this._formFieldRegistry, formField, index));

    // (3) Remove new form field from form field registry
    this._formFieldRegistry.remove(formField);

    // Schema state is automatically updated by SchemaUpdater
  }
}

AddFormFieldHandler.$inject = ['formEditor', 'formFieldRegistry'];
