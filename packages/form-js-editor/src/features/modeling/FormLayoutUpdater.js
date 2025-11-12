import { updateRow } from './cmd/Util';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import { clone } from '@bpmn-io/form-js-viewer';

export class FormLayoutUpdater extends CommandInterceptor {
  constructor(eventBus, formLayouter, modeling, formEditor) {
    super(eventBus);

    this._eventBus = eventBus;
    this._formLayouter = formLayouter;
    this._modeling = modeling;
    this._formEditor = formEditor;

    // @ts-ignore
    this.preExecute(['formField.add', 'formField.remove', 'formField.move', 'id.updateClaim'], (event) =>
      this.updateRowIds(event),
    );

    // we need that as the state got updates
    // on the next tick (not in post execute)
    eventBus.on('changed', (context) => {
      const { schema } = context;
      this.updateLayout(schema);
    });
  }

  updateLayout(schema) {
    this._formLayouter.clear();
    // Use replacer to filter out internal properties that may cause cyclic references
    this._formLayouter.calculateLayout(clone(schema, (name, value) => {
      if (['_parent', '_path'].includes(name)) {
        return undefined;
      }

      return value;
    }));
  }

  updateRowIds(event) {
    const { schema } = this._formEditor._getState();

    const setRowIds = (parent) => {
      if (!parent.components || !parent.components.length) {
        return;
      }

      parent.components.forEach((formField) => {
        const row = this._formLayouter.getRowForField(formField);

        // Layout may not be calculated yet (happens in 'changed' event after state update)
        // Only update row ID if row exists
        if (row) {
          updateRow(formField, row.id);
        }

        // handle children recursively
        setRowIds(formField);
      });
    };

    // make sure rows are persisted in schema (e.g. for migration case)
    setRowIds(schema);
  }
}

FormLayoutUpdater.$inject = ['eventBus', 'formLayouter', 'modeling', 'formEditor'];
