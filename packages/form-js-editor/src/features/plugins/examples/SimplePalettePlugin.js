import { Plugin } from '../Plugin';

/**
 * Example plugin that adds a custom palette entry.
 *
 * @class SimplePalettePlugin
 * @extends Plugin
 */
export class SimplePalettePlugin extends Plugin {
  constructor() {
    super({
      name: 'simple-palette-plugin',
      version: '1.0.0',
      description: 'Adds a custom palette entry example',
    });
  }

  getPaletteEntries() {
    return [
      {
        label: 'Custom Field',
        type: 'custom-field',
        group: 'basic-input',
        // Note: This is a standalone palette entry that doesn't correspond to a form field.
        // To actually use it, you would need to also register a form field type.
      },
    ];
  }
}

