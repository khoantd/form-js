/**
 * @typedef { import('../types').Schema } Schema
 * @typedef { import('../types').FormEditorProperties } FormEditorProperties
 * @typedef { import('../FormEditor').FormEditor } FormEditor
 * @typedef { import('./EventBus').EventBus } EventBus
 */
/**
 * @typedef { {
 *   id: string;
 *   label?: string;
 *   author?: string;
 *   metadata?: Record<string, any>;
 *   createdAt: string;
 *   state: {
 *     schema: Schema | null;
 *     properties: FormEditorProperties;
 *   };
 * } } VersionEntry
 */
/**
 * In-memory version control for editor state (schema + properties).
 * Consumers may persist exported history externally if desired.
 */
export class VersionControl {
  /**
   * @param {EventBus} eventBus
   * @param {FormEditor} formEditor
   */
  constructor(eventBus, formEditor) {
    this._eventBus = eventBus;
    this._formEditor = formEditor;
    /** @type {VersionEntry[]} */
    this._versions = [];
    /** @type {string|null} */
    this._currentVersionId = null;
    this._dirty = false;
    // track changes to know unsaved edits exist
    this._onChanged = () => {
      this._dirty = true;
      this._eventBus.fire('versionControl.dirty', { dirty: true });
    };
    this._eventBus.on('changed', this._onChanged);
    this._eventBus.on('form.destroy', () => {
      this._eventBus.off('changed', this._onChanged);
    });
  }
  /**
   * Save a new version from current editor state.
   * @param {{ label?: string, author?: string, metadata?: Record<string, any> }} [options]
   * @returns {VersionEntry}
   */
  saveVersion(options = {}) {
    const snapshot = this._snapshotState();
    const id = this._generateId();
    const entry = {
      id,
      label: options.label,
      author: options.author,
      metadata: options.metadata,
      createdAt: new Date().toISOString(),
      state: snapshot,
    };
    this._versions.push(entry);
    this._currentVersionId = id;
    this._dirty = false;
    this._eventBus.fire('versionControl.saved', { version: entry });
    return entry;
  }
  /**
   * Restore a version by id. Emits changed after restore.
   * @param {string} id
   * @returns {boolean}
   */
  restoreVersion(id) {
    const entry = this._versions.find((v) => v.id === id);
    if (!entry) {
      return false;
    }
    const { schema, properties } = entry.state;
    // import schema through importer if available to keep consistency
    try {
      const importer = this._formEditor.get('importer', false);
      if (importer && schema) {
        importer.importSchema(schema);
      } else {
        // fallback: update state directly
        const current = this._formEditor._getState();
        this._formEditor._update({
          ...current,
          schema,
          properties: properties || current.properties,
        });
      }
      this._currentVersionId = id;
      this._dirty = false;
      this._eventBus.fire('versionControl.restored', { version: entry });
      return true;
    } catch (err) {
      this._eventBus.fire('versionControl.error', { action: 'restore', error: err });
      return false;
    }
  }
  /**
   * Delete a version by id.
   * @param {string} id
   * @returns {boolean}
   */
  deleteVersion(id) {
    const idx = this._versions.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    const [removed] = this._versions.splice(idx, 1);
    if (this._currentVersionId === id) {
      this._currentVersionId = this._versions.length ? this._versions[this._versions.length - 1].id : null;
    }
    this._eventBus.fire('versionControl.deleted', { version: removed });
    return true;
  }
  /**
   * Clear all versions.
   */
  clear() {
    this._versions = [];
    this._currentVersionId = null;
    this._eventBus.fire('versionControl.cleared');
  }
  /**
   * @returns {VersionEntry[]}
   */
  listVersions() {
    return this._versions.slice();
  }
  /**
   * @returns {string|null}
   */
  getCurrentVersionId() {
    return this._currentVersionId;
  }
  /**
   * @returns {boolean}
   */
  isDirty() {
    return !!this._dirty;
  }
  /**
   * Export the version history for persistence.
   * @returns {{ versions: VersionEntry[], currentVersionId: string|null }}
   */
  exportHistory() {
    const payload = {
      versions: this._versions.map((v) => ({
        ...v,
        state: {
          schema: this._deepClone(v.state.schema),
          properties: this._deepClone(v.state.properties),
        },
      })),
      currentVersionId: this._currentVersionId,
    };
    this._eventBus.fire('versionControl.exported', { payload });
    return payload;
  }
  /**
   * Import a previously exported history payload.
   * @param {{ versions: VersionEntry[], currentVersionId?: string|null }} payload
   */
  importHistory(payload) {
    if (!payload || !Array.isArray(payload.versions)) {
      throw new Error('Invalid history payload');
    }
    // sanitize and clone
    this._versions = payload.versions.map((v) => ({
      id: String(v.id),
      label: v.label,
      author: v.author,
      metadata: v.metadata,
      createdAt: v.createdAt || new Date().toISOString(),
      state: {
        schema: this._deepClone(v.state && v.state.schema),
        properties: this._deepClone(v.state && v.state.properties),
      },
    }));
    this._currentVersionId = payload.currentVersionId || (this._versions[0] && this._versions[0].id) || null;
    this._eventBus.fire('versionControl.imported', { count: this._versions.length });
  }
  /**
   * @private
   */
  _snapshotState() {
    const { schema, properties } = this._formEditor._getState();
    return {
      schema: this._deepClone(schema),
      properties: this._deepClone(properties),
    };
  }
  /**
   * @private
   * @param {any} obj
   */
  _deepClone(obj) {
    if (obj == null) return obj;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      // fallback shallow copy
      if (Array.isArray(obj)) return obj.slice();
      if (typeof obj === 'object') return { ...obj };
      return obj;
    }
  }
  /**
   * @private
   */
  _generateId() {
    // simple unique id
    return 'v_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
  }
}
VersionControl.$inject = ['eventBus', 'formEditor'];


