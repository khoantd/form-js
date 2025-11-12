/**
 * Simple i18n service.
 *
 * Supports:
 * - Localizing string-or-dictionary values from schema
 *   - String: returned as-is
 *   - Object: map of locale -> string, resolved by current/fallback locale
 * - Translating built-in UI keys via provided dictionaries
 * - Runtime locale switching
 * - Default translations for common UI strings
 *
 * Configuration via injected config:
 * {
 *   locale?: string,
 *   fallbackLocale?: string,
 *   translations?: { [locale: string]: { [key: string]: string } }
 * }
 */
export class I18n {
  /**
   * @param {any} config
   */
  constructor(config = {}) {
    const { locale = 'en', fallbackLocale = 'en', translations = {} } = config || {};

    this._locale = locale;
    this._fallbackLocale = fallbackLocale || 'en';
    this._translations = { ...this._getDefaultTranslations(), ...translations };
  }

  /**
   * Get default translations for common UI strings.
   * @private
   * @returns {Record<string, Record<string, string>>}
   */
  _getDefaultTranslations() {
    return {
      en: {
        'select.placeholder': 'Select',
        'search.placeholder': 'Search',
        'editor.text.empty': 'Text view is empty',
        'editor.text.expression': 'Text view is populated by an expression',
        'editor.text.templated': 'Text view is templated',
        'editor.palette.create': 'Create {article} {label} element',
        'editor.palette.article.a': 'a',
        'editor.palette.article.an': 'an',
        'editor.properties.remove': 'Remove',
        'editor.preview.button': 'Preview',
        'editor.preview.title': 'Form Preview',
        'editor.preview.close': 'Close Preview',
      },
      de: {
        'select.placeholder': 'Auswählen',
        'search.placeholder': 'Suchen',
        'editor.text.empty': 'Textansicht ist leer',
        'editor.text.expression': 'Textansicht wird durch einen Ausdruck gefüllt',
        'editor.text.templated': 'Textansicht ist vorlagenbasiert',
        'editor.palette.create': '{article} {label} Element erstellen',
        'editor.palette.article.a': 'ein',
        'editor.palette.article.an': 'eine',
        'editor.properties.remove': 'Entfernen',
        'editor.preview.button': 'Vorschau',
        'editor.preview.title': 'Formularvorschau',
        'editor.preview.close': 'Vorschau schließen',
      },
      fr: {
        'select.placeholder': 'Sélectionner',
        'search.placeholder': 'Rechercher',
        'editor.text.empty': 'La vue texte est vide',
        'editor.text.expression': 'La vue texte est remplie par une expression',
        'editor.text.templated': 'La vue texte est basée sur un modèle',
        'editor.palette.create': 'Créer un élément {label}',
        'editor.palette.article.a': 'un',
        'editor.palette.article.an': 'une',
        'editor.properties.remove': 'Supprimer',
        'editor.preview.button': 'Aperçu',
        'editor.preview.title': 'Aperçu du formulaire',
        'editor.preview.close': 'Fermer l\'aperçu',
      },
      es: {
        'select.placeholder': 'Seleccionar',
        'search.placeholder': 'Buscar',
        'editor.text.empty': 'La vista de texto está vacía',
        'editor.text.expression': 'La vista de texto está poblada por una expresión',
        'editor.text.templated': 'La vista de texto está basada en plantilla',
        'editor.palette.create': 'Crear un elemento {label}',
        'editor.palette.article.a': 'un',
        'editor.palette.article.an': 'una',
        'editor.properties.remove': 'Eliminar',
        'editor.preview.button': 'Vista previa',
        'editor.preview.title': 'Vista previa del formulario',
        'editor.preview.close': 'Cerrar vista previa',
      },
    };
  }

  /**
   * Get current locale.
   * @returns {string}
   */
  getLocale() {
    return this._locale;
  }

  /**
   * Set current locale at runtime.
   * @param {string} locale
   */
  setLocale(locale) {
    if (locale && typeof locale === 'string') {
      this._locale = locale;
    }
  }

  /**
   * Get fallback locale.
   * @returns {string}
   */
  getFallbackLocale() {
    return this._fallbackLocale;
  }

  /**
   * Set fallback locale.
   * @param {string} locale
   */
  setFallbackLocale(locale) {
    if (locale && typeof locale === 'string') {
      this._fallbackLocale = locale;
    }
  }

  /**
   * Add or update translations for a locale.
   * @param {string} locale - Locale code
   * @param {Record<string, string>} translations - Translation dictionary
   */
  addTranslations(locale, translations) {
    if (!this._translations[locale]) {
      this._translations[locale] = {};
    }
    this._translations[locale] = { ...this._translations[locale], ...translations };
  }

  /**
   * Get all translations for a locale.
   * @param {string} [locale] - Locale code, defaults to current locale
   * @returns {Record<string, string>}
   */
  getTranslations(locale) {
    const targetLocale = locale || this._locale;
    return this._translations[targetLocale] || {};
  }

  /**
   * Translate a key using provided dictionaries.
   * @param {string} key
   * @param {Record<string, any>} [params]
   * @returns {string}
   */
  t(key, params) {
    const str =
      (this._translations[this._locale] && this._translations[this._locale][key]) ||
      (this._translations[this._fallbackLocale] && this._translations[this._fallbackLocale][key]) ||
      key;

    if (!params) {
      return str;
    }

    return str.replace(/\{(\w+)\}/g, (_, token) => {
      return Object.prototype.hasOwnProperty.call(params, token) ? String(params[token]) : `{${token}}`;
    });
  }

  /**
   * Localize a schema-provided string which may be:
   * - string: returned as-is
   * - object: { [locale]: string }
   * @param {any} value
   * @returns {string}
   */
  localize(value) {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      const byLocale = /** @type {{ [locale: string]: string }} */ (value);
      return byLocale[this._locale] || byLocale[this._fallbackLocale] || '';
    }

    return String(value);
  }
}

I18n.$inject = ['config'];


