import { Fragment } from 'preact';

/**
 * Palette provider for custom types.
 */
export class CustomTypesPaletteProvider {
  /**
   * @constructor
   * @param {import('../../core/EventBus').EventBus} eventBus
   * @param {import('./CustomTypeRegistry').CustomTypeRegistry} customTypeRegistry
   */
  constructor(eventBus, customTypeRegistry) {
    /**
     * @private
     * @type {import('../../core/EventBus').EventBus}
     */
    this._eventBus = eventBus;

    /**
     * @private
     * @type {import('./CustomTypeRegistry').CustomTypeRegistry}
     */
    this._registry = customTypeRegistry;

    /**
     * @private
     * @type {Array}
     */
    this._entries = [];

    // Listen for custom types changes
    eventBus.on('customTypes.changed', () => {
      this._updateEntries();
    });

    // Initial update
    this._updateEntries();
  }

  /**
   * Get palette entries for custom types.
   *
   * @returns {Array}
   */
  getPaletteEntries() {
    return this._entries;
  }

  /**
   * Update palette entries from registry.
   *
   * @private
   */
  _updateEntries() {
    const types = this._registry.list();
    this._entries = types.map((type) => ({
      label: type.name,
      type: type.type,
      group: 'custom',
      icon: type.icon ? () => {
        // Simple icon component if icon string provided
        return <span class="fjs-custom-type-icon" style={{ color: type.color || '#000' }}>{type.icon}</span>;
      } : null,
      iconUrl: null,
    }));
  }
}

CustomTypesPaletteProvider.$inject = ['eventBus', 'customTypeRegistry'];

