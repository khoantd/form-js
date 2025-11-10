/**
 * @typedef { import('./EventBus').EventBus } EventBus
 * @typedef { import('../types').Theme } Theme
 * @typedef { import('../types').ThemePreset } ThemePreset
 */

/**
 * Theme manager service for applying and managing form themes.
 */
export class ThemeManager {
  /**
   * @constructor
   * @param {EventBus} eventBus
   * @param {Element} container
   */
  constructor(eventBus, container) {
    /**
     * @private
     * @type {EventBus}
     */
    this._eventBus = eventBus;

    /**
     * @private
     * @type {Element}
     */
    this._container = container;

    /**
     * @private
     * @type {Theme|null}
     */
    this._currentTheme = null;

    /**
     * @private
     * @type {Theme}
     */
    this._defaultTheme = this._getDefaultTheme();

    /**
     * @private
     * @type {Map<string, Theme>}
     */
    this._presets = new Map();

    // Register default presets
    this._registerDefaultPresets();
  }

  /**
   * Apply a theme to the form container.
   *
   * @param {Theme|string} theme - Theme object or preset name
   * @param {boolean} [merge=true] - Whether to merge with current theme
   */
  applyTheme(theme, merge = true) {
    let themeToApply;

    if (typeof theme === 'string') {
      // Preset name
      const preset = this._presets.get(theme);
      if (!preset) {
        throw new Error(`Theme preset "${theme}" not found`);
      }
      themeToApply = preset;
    } else if (theme && typeof theme === 'object') {
      // Theme object
      themeToApply = merge && this._currentTheme ? this._mergeTheme(this._currentTheme, theme) : theme;
    } else {
      throw new Error('Invalid theme: must be a theme object or preset name');
    }

    this._applyThemeToContainer(themeToApply);
    this._currentTheme = { ...themeToApply };

    this._eventBus.fire('theme.changed', { theme: this._currentTheme });
  }

  /**
   * Get the current theme.
   *
   * @returns {Theme}
   */
  getTheme() {
    return this._currentTheme ? { ...this._currentTheme } : { ...this._defaultTheme };
  }

  /**
   * Reset theme to default.
   */
  resetTheme() {
    this.applyTheme(this._defaultTheme, false);
  }

  /**
   * Register a theme preset.
   *
   * @param {string} name - Preset name
   * @param {Theme} theme - Theme object
   */
  registerPreset(name, theme) {
    if (!name || typeof name !== 'string') {
      throw new Error('Preset name must be a non-empty string');
    }
    if (!theme || typeof theme !== 'object') {
      throw new Error('Theme must be an object');
    }

    this._presets.set(name, { ...theme });
    this._eventBus.fire('theme.preset.registered', { name, theme });
  }

  /**
   * Get a theme preset.
   *
   * @param {string} name - Preset name
   * @returns {Theme|null}
   */
  getPreset(name) {
    const preset = this._presets.get(name);
    return preset ? { ...preset } : null;
  }

  /**
   * Get all registered presets.
   *
   * @returns {Array<{name: string, theme: Theme}>}
   */
  getPresets() {
    return Array.from(this._presets.entries()).map(([name, theme]) => ({
      name,
      theme: { ...theme },
    }));
  }

  /**
   * Update a specific theme property.
   *
   * @param {string} property - CSS variable name (e.g., '--color-text')
   * @param {string} value - CSS value
   */
  setProperty(property, value) {
    if (!property || typeof property !== 'string') {
      throw new Error('Property must be a non-empty string');
    }

    const theme = this.getTheme();
    if (!theme.variables) {
      theme.variables = {};
    }

    theme.variables[property] = value;
    this.applyTheme(theme, false);
  }

  /**
   * Get a specific theme property.
   *
   * @param {string} property - CSS variable name
   * @returns {string|null}
   */
  getProperty(property) {
    const theme = this.getTheme();
    return theme.variables?.[property] || null;
  }

  /**
   * Apply theme to container element.
   *
   * @private
   * @param {Theme} theme
   */
  _applyThemeToContainer(theme) {
    if (!this._container) {
      return;
    }

    // Find the .fjs-container element (it might be the container itself or a child)
    let targetContainer = this._container;
    if (!this._container.classList.contains('fjs-container')) {
      const fjsContainer = this._container.querySelector('.fjs-container');
      if (fjsContainer) {
        targetContainer = fjsContainer;
      }
    }

    // Apply CSS variables
    if (theme.variables) {
      Object.entries(theme.variables).forEach(([property, value]) => {
        targetContainer.style.setProperty(property, value);
      });
    }

    // Apply CSS classes
    if (theme.classes) {
      // Remove previous theme classes
      const previousClasses = Array.from(targetContainer.classList).filter((cls) => cls.startsWith('fjs-theme-'));
      previousClasses.forEach((cls) => targetContainer.classList.remove(cls));

      // Add new theme classes
      theme.classes.forEach((cls) => {
        if (typeof cls === 'string') {
          targetContainer.classList.add(cls);
        }
      });
    }

    // Apply custom styles
    if (theme.styles) {
      Object.entries(theme.styles).forEach(([property, value]) => {
        targetContainer.style.setProperty(property, value);
      });
    }
  }

  /**
   * Merge two themes.
   *
   * @private
   * @param {Theme} baseTheme
   * @param {Theme} overrideTheme
   * @returns {Theme}
   */
  _mergeTheme(baseTheme, overrideTheme) {
    return {
      variables: {
        ...(baseTheme.variables || {}),
        ...(overrideTheme.variables || {}),
      },
      classes: [...(baseTheme.classes || []), ...(overrideTheme.classes || [])],
      styles: {
        ...(baseTheme.styles || {}),
        ...(overrideTheme.styles || {}),
      },
    };
  }

  /**
   * Get default theme.
   *
   * @private
   * @returns {Theme}
   */
  _getDefaultTheme() {
    return {
      variables: {},
      classes: [],
      styles: {},
    };
  }

  /**
   * Register default theme presets.
   *
   * @private
   */
  _registerDefaultPresets() {
    // Light theme (default)
    this.registerPreset('light', {
      variables: {},
      classes: [],
      styles: {},
    });

    // Dark theme
    this.registerPreset('dark', {
      variables: {
        '--color-grey-225-10-15': 'hsl(225, 10%, 85%)',
        '--color-grey-225-10-35': 'hsl(225, 10%, 65%)',
        '--color-grey-225-10-45': 'hsl(225, 10%, 55%)',
        '--color-grey-225-10-55': 'hsl(225, 10%, 45%)',
        '--color-grey-225-10-75': 'hsl(225, 10%, 25%)',
        '--color-grey-225-10-80': 'hsl(225, 10%, 20%)',
        '--color-grey-225-10-85': 'hsl(225, 10%, 15%)',
        '--color-grey-225-10-90': 'hsl(225, 10%, 10%)',
        '--color-grey-225-10-93': 'hsl(225, 10%, 7%)',
        '--color-grey-225-10-95': 'hsl(225, 10%, 5%)',
        '--color-grey-225-10-97': 'hsl(225, 10%, 3%)',
        '--color-white': 'hsl(0, 0%, 10%)',
        '--color-black': 'hsl(0, 0%, 90%)',
        '--color-background': 'hsl(0, 0%, 10%)',
        '--color-background-disabled': 'hsl(225, 10%, 15%)',
        '--color-background-readonly': 'hsl(225, 10%, 15%)',
        '--color-text': 'hsl(225, 10%, 85%)',
        '--color-text-light': 'hsl(225, 10%, 65%)',
        '--color-text-lighter': 'hsl(225, 10%, 55%)',
        '--color-text-lightest': 'hsl(225, 10%, 45%)',
        '--color-borders': 'hsl(225, 10%, 25%)',
        '--color-borders-group': 'hsl(225, 10%, 15%)',
        '--color-borders-disabled': 'hsl(225, 10%, 20%)',
        '--color-layer': 'hsl(0, 0%, 12%)',
        '--color-layer-accent': 'hsl(225, 10%, 20%)',
      },
      classes: ['fjs-theme-dark'],
      styles: {},
    });

    // High contrast theme
    this.registerPreset('high-contrast', {
      variables: {
        '--color-background': 'hsl(0, 0%, 100%)',
        '--color-text': 'hsl(0, 0%, 0%)',
        '--color-text-light': 'hsl(0, 0%, 20%)',
        '--color-text-lighter': 'hsl(0, 0%, 30%)',
        '--color-text-lightest': 'hsl(0, 0%, 40%)',
        '--color-borders': 'hsl(0, 0%, 0%)',
        '--color-borders-group': 'hsl(0, 0%, 20%)',
        '--color-borders-disabled': 'hsl(0, 0%, 50%)',
        '--color-accent': 'hsl(240, 100%, 50%)',
        '--color-warning': 'hsl(0, 100%, 50%)',
        '--outline-definition': '3px solid hsl(240, 100%, 50%)',
      },
      classes: ['fjs-theme-high-contrast'],
      styles: {},
    });

    // Carbon theme (uses Carbon Design System variables)
    this.registerPreset('carbon', {
      variables: {},
      classes: [],
      styles: {},
    });
  }
}

ThemeManager.$inject = ['eventBus', 'config.renderer.container'];

