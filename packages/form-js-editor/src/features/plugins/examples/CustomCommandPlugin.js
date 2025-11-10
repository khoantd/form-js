import { Plugin } from '../Plugin';

/**
 * Example plugin that adds a custom command handler.
 *
 * @class CustomCommandPlugin
 * @extends Plugin
 */
export class CustomCommandPlugin extends Plugin {
  constructor() {
    super({
      name: 'custom-command-plugin',
      version: '1.0.0',
      description: 'Adds a custom command handler',
    });
  }

  getCommandHandlers() {
    return {
      'custom.command': CustomCommandHandler,
    };
  }
}

/**
 * Example custom command handler.
 */
class CustomCommandHandler {
  constructor(eventBus, formFieldRegistry) {
    this._eventBus = eventBus;
    this._formFieldRegistry = formFieldRegistry;
  }

  /**
   * Execute the command.
   *
   * @param {Object} context - Command context
   * @returns {Object} - Command result
   */
  execute(context) {
    const { fieldId, data } = context;

    const field = this._formFieldRegistry.get(fieldId);

    if (!field) {
      throw new Error(`Field with id "${fieldId}" not found`);
    }

    // Store original data
    this._originalData = { ...field };

    // Apply changes
    Object.assign(field, data);

    return {
      field,
    };
  }

  /**
   * Revert the command.
   *
   * @param {Object} context - Command context
   */
  revert(context) {
    const { fieldId } = context;

    const field = this._formFieldRegistry.get(fieldId);

    if (!field) {
      return;
    }

    // Restore original data
    Object.assign(field, this._originalData);
  }
}

CustomCommandHandler.$inject = ['eventBus', 'formFieldRegistry'];

