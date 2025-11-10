/**
 * Service for managing preview mode state.
 */
export class PreviewMode {
  constructor(eventBus) {
    this._eventBus = eventBus;
    this._isPreviewMode = false;
  }

  /**
   * Check if preview mode is active.
   *
   * @returns {boolean}
   */
  isActive() {
    return this._isPreviewMode;
  }

  /**
   * Toggle preview mode.
   */
  toggle() {
    this.set(!this._isPreviewMode);
  }

  /**
   * Set preview mode state.
   *
   * @param {boolean} active
   */
  set(active) {
    if (this._isPreviewMode === active) {
      return;
    }

    this._isPreviewMode = active;

    this._eventBus.fire('previewMode.changed', {
      active: this._isPreviewMode,
    });
  }

  /**
   * Enter preview mode.
   */
  enter() {
    this.set(true);
  }

  /**
   * Exit preview mode.
   */
  exit() {
    this.set(false);
  }
}

PreviewMode.$inject = ['eventBus'];

