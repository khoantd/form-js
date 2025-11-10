import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

/**
 * Automatically updates schema state after command execution.
 * This eliminates the need for manual `_setState({ schema })` calls in command handlers.
 *
 * @class SchemaUpdater
 * @extends CommandInterceptor
 */
export class SchemaUpdater extends CommandInterceptor {
  /**
   * @constructor
   * @param { import('../../core/EventBus').EventBus } eventBus
   * @param { import('../../FormEditor').FormEditor } formEditor
   */
  constructor(eventBus, formEditor) {
    super(eventBus);

    this._formEditor = formEditor;

    // Automatically update schema state after commands that modify the schema
    this.postExecute(
      ['formField.add', 'formField.remove', 'formField.move', 'formField.edit'],
      () => {
        const { schema } = this._formEditor._getState();
        this._formEditor._setState({ schema });
      },
    );
  }
}

SchemaUpdater.$inject = ['eventBus', 'formEditor'];

