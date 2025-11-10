import { Plugin } from '../Plugin';

/**
 * Example plugin that hooks into editor events.
 *
 * @class EventHookPlugin
 * @extends Plugin
 */
export class EventHookPlugin extends Plugin {
  constructor() {
    super({
      name: 'event-hook-plugin',
      version: '1.0.0',
      description: 'Demonstrates event hooking capabilities',
    });

    /**
     * @private
     * @type {Array<Function>}
     */
    this._eventHandlers = [];
  }

  registerEventListeners() {
    const eventBus = this.getEventBus();

    // Hook into form initialization
    const initHandler = () => {
      console.log('Form initialized via plugin');
    };
    eventBus.on('form.init', initHandler);
    this._eventHandlers.push(() => eventBus.off('form.init', initHandler));

    // Hook into schema import
    const importHandler = (event) => {
      console.log('Schema imported via plugin', event);
    };
    eventBus.on('import.done', importHandler);
    this._eventHandlers.push(() => eventBus.off('import.done', importHandler));

    // Hook into field selection
    const selectionHandler = (event) => {
      console.log('Field selected via plugin', event);
    };
    eventBus.on('selection.changed', selectionHandler);
    this._eventHandlers.push(() => eventBus.off('selection.changed', selectionHandler));
  }

  destroy() {
    // Clean up event listeners
    this._eventHandlers.forEach((cleanup) => cleanup());
    this._eventHandlers = [];
  }
}

