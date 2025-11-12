/**
 * Simple i18n service.
 *
 * Supports:
 * - Localizing string-or-dictionary values from schema
 *   - String: returned as-is
 *   - Object: map of locale -> string, resolved by current/fallback locale
 * - Translating built-in UI keys via provided dictionaries
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
    this._translations = translations || {};
  }

  /**
   * Get current locale.
   */
  getLocale() {
    return this._locale;
  }

  /**
   * Set current locale at runtime.
   * @param {string} locale
   */
  setLocale(locale) {
    this._locale = locale || this._locale;
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


