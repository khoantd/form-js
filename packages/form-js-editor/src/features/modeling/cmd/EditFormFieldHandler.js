export class EditFormFieldHandler {
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
    const { formField, properties } = context;

    let { schema } = this._formEditor._getState();

    const oldProperties = {};

    for (let key in properties) {
      oldProperties[key] = formField[key];

      const property = properties[key];

      if (key === 'id') {
        if (property !== formField.id) {
          this._formFieldRegistry.updateId(formField, property);
        }
      } else {
        formField[key] = property;
      }
    }

    context.oldProperties = oldProperties;

    // Schema state is automatically updated by SchemaUpdater

    return formField;
  }

  revert(context) {
    const { formField, oldProperties } = context;

    let { schema } = this._formEditor._getState();

    for (let key in oldProperties) {
      const property = oldProperties[key];

      if (key === 'id') {
        if (property !== formField.id) {
          this._formFieldRegistry.updateId(formField, property);
        }
      } else {
        formField[key] = property;
      }
    }

    // Schema state is automatically updated by SchemaUpdater

    return formField;
  }
}

EditFormFieldHandler.$inject = ['formEditor', 'formFieldRegistry'];
