/**
 * Analytics service for tracking form interactions and completion rates.
 *
 * Tracks:
 * - Form sessions (start/end times, duration)
 * - Field interactions (changes, focus, blur, validation errors)
 * - Form submissions (attempts, success/failure, completion rates)
 * - Field-level analytics (most changed fields, error rates)
 *
 * @typedef {Object} AnalyticsOptions
 * @property {boolean} [enabled=true] - Whether analytics is enabled
 * @property {boolean} [trackFieldInteractions=true] - Track individual field interactions
 * @property {boolean} [trackFocusBlur=true] - Track focus/blur events
 * @property {Function} [onEvent] - Callback for analytics events
 *
 * @typedef {Object} FormSession
 * @property {string} sessionId - Unique session identifier
 * @property {Date} startTime - Session start time
 * @property {Date} [endTime] - Session end time
 * @property {number} [duration] - Session duration in milliseconds
 * @property {boolean} completed - Whether form was submitted successfully
 * @property {number} submissionAttempts - Number of submission attempts
 * @property {number} fieldChanges - Total number of field value changes
 * @property {number} validationErrors - Total number of validation errors
 *
 * @typedef {Object} FieldAnalytics
 * @property {string} fieldId - Field identifier
 * @property {string} fieldKey - Field key
 * @property {string} fieldType - Field type
 * @property {number} changeCount - Number of times field was changed
 * @property {number} focusCount - Number of times field was focused
 * @property {number} blurCount - Number of times field was blurred
 * @property {number} errorCount - Number of validation errors
 * @property {Date} firstChangeTime - Time of first change
 * @property {Date} lastChangeTime - Time of last change
 *
 * @typedef {Object} AnalyticsData
 * @property {FormSession} session - Current form session
 * @property {Map<string, FieldAnalytics>} fields - Field-level analytics
 * @property {Array<Object>} submissions - Submission history
 * @property {Object} summary - Summary statistics
 */

export class Analytics {
  /**
   * @constructor
   * @param {import('./EventBus').EventBus} eventBus
   * @param {import('../Form').Form} form
   * @param {AnalyticsOptions} [options={}]
   */
  constructor(eventBus, form, options = {}) {
    this._eventBus = eventBus;
    this._form = form;
    this._options = {
      enabled: options.enabled !== false,
      trackFieldInteractions: options.trackFieldInteractions !== false,
      trackFocusBlur: options.trackFocusBlur !== false,
      onEvent: options.onEvent || null,
    };

    /**
     * @private
     * @type {FormSession}
     */
    this._session = null;

    /**
     * @private
     * @type {Map<string, FieldAnalytics>}
     */
    this._fieldAnalytics = new Map();

    /**
     * @private
     * @type {Array<Object>}
     */
    this._submissions = [];

    /**
     * @private
     * @type {boolean}
     */
    this._isTracking = false;

    if (this._options.enabled) {
      this._init();
    }
  }

  /**
   * Initialize analytics tracking.
   * @private
   */
  _init() {
    // Bind event handlers to preserve context
    this._boundHandlers = {
      startSession: () => this._startSession(),
      endSession: () => this._endSession(),
      resetSession: () => this._resetSession(),
      trackFieldChange: (event) => this._trackFieldChange(event),
      trackFieldAdded: (event) => this._trackFieldAdded(event),
      trackFieldRemoved: (event) => this._trackFieldRemoved(event),
      trackFieldFocus: (event) => this._trackFieldFocus(event),
      trackFieldBlur: (event) => this._trackFieldBlur(event),
      trackPresubmit: () => this._trackPresubmit(),
      trackSubmit: (event) => this._trackSubmit(event),
      trackValidationErrors: (state) => {
        if (state.errors) {
          this._trackValidationErrors(state.errors);
        }
      },
    };

    // Track form lifecycle
    this._eventBus.on('form.init', this._boundHandlers.startSession);
    this._eventBus.on('form.destroy', this._boundHandlers.endSession);
    this._eventBus.on('form.clear', this._boundHandlers.resetSession);

    // Track field interactions
    if (this._options.trackFieldInteractions) {
      this._eventBus.on('field.updated', this._boundHandlers.trackFieldChange);
      this._eventBus.on('formFieldInstance.added', this._boundHandlers.trackFieldAdded);
      this._eventBus.on('formFieldInstance.removed', this._boundHandlers.trackFieldRemoved);
    }

    // Track focus/blur events
    if (this._options.trackFocusBlur) {
      this._eventBus.on('formField.focus', this._boundHandlers.trackFieldFocus);
      this._eventBus.on('formField.blur', this._boundHandlers.trackFieldBlur);
    }

    // Track form submissions
    this._eventBus.on('presubmit', this._boundHandlers.trackPresubmit);
    this._eventBus.on('submit', this._boundHandlers.trackSubmit);

    // Track validation errors
    this._eventBus.on('changed', this._boundHandlers.trackValidationErrors);
  }

  /**
   * Start a new form session.
   * @private
   */
  _startSession() {
    if (this._isTracking) {
      return;
    }

    this._isTracking = true;
    this._session = {
      sessionId: this._generateSessionId(),
      startTime: new Date(),
      completed: false,
      submissionAttempts: 0,
      fieldChanges: 0,
      validationErrors: 0,
    };

    this._emitAnalyticsEvent('session.started', { session: this._session });
  }

  /**
   * End the current form session.
   * @private
   */
  _endSession() {
    if (!this._isTracking || !this._session) {
      return;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - this._session.startTime.getTime();

    this._session.endTime = endTime;
    this._session.duration = duration;

    this._isTracking = false;

    this._emitAnalyticsEvent('session.ended', { session: this._session });
  }

  /**
   * Reset the current session.
   * @private
   */
  _resetSession() {
    this._endSession();
    this._fieldAnalytics.clear();
    this._submissions = [];
    this._session = null;
  }

  /**
   * Track field value change.
   * @private
   * @param {Object} event - Field update event
   */
  _trackFieldChange(event) {
    if (!this._isTracking || !this._session) {
      return;
    }

    const { fieldInstance } = event;
    if (!fieldInstance || !fieldInstance.id) {
      return;
    }

    const fieldId = fieldInstance.id;
    const fieldAnalytics = this._getOrCreateFieldAnalytics(fieldId, fieldInstance);

    fieldAnalytics.changeCount++;
    fieldAnalytics.lastChangeTime = new Date();

    if (!fieldAnalytics.firstChangeTime) {
      fieldAnalytics.firstChangeTime = fieldAnalytics.lastChangeTime;
    }

    this._session.fieldChanges++;

    this._emitAnalyticsEvent('field.changed', {
      fieldId,
      fieldAnalytics,
      session: this._session,
    });
  }

  /**
   * Track field instance added.
   * @private
   * @param {Object} event - Field instance added event
   */
  _trackFieldAdded(event) {
    if (!this._isTracking) {
      return;
    }

    const { instanceId } = event;
    const formFieldRegistry = this._form.get('formFieldRegistry', false);
    const formFieldInstanceRegistry = this._form.get('formFieldInstanceRegistry', false);

    if (!formFieldRegistry || !formFieldInstanceRegistry) {
      return;
    }

    const fieldInstance = formFieldInstanceRegistry.get(instanceId);
    if (!fieldInstance) {
      return;
    }

    const field = formFieldRegistry.get(fieldInstance.id);
    if (!field) {
      return;
    }

    this._getOrCreateFieldAnalytics(fieldInstance.id, fieldInstance, field);
  }

  /**
   * Track field instance removed.
   * @private
   * @param {Object} event - Field instance removed event
   */
  _trackFieldRemoved(event) {
    // Field analytics are kept for historical purposes
    // We don't remove them when fields are removed
  }

  /**
   * Track form presubmit.
   * @private
   */
  _trackPresubmit() {
    if (!this._isTracking || !this._session) {
      return;
    }

    this._session.submissionAttempts++;

    this._emitAnalyticsEvent('submission.attempted', {
      attemptNumber: this._session.submissionAttempts,
      session: this._session,
    });
  }

  /**
   * Track form submission.
   * @private
   * @param {Object} event - Submit event
   */
  _trackSubmit(event) {
    if (!this._isTracking || !this._session) {
      return;
    }

    const { data, errors, files } = event;
    const hasErrors = errors && Object.keys(errors).length > 0;
    const isSuccessful = !hasErrors;

    const submission = {
      timestamp: new Date(),
      attemptNumber: this._session.submissionAttempts,
      successful: isSuccessful,
      hasErrors,
      errorCount: hasErrors ? this._countErrors(errors) : 0,
      dataKeys: Object.keys(data || {}),
      fileCount: files ? files.size : 0,
    };

    this._submissions.push(submission);

    if (isSuccessful) {
      this._session.completed = true;
    }

    this._emitAnalyticsEvent('submission.completed', {
      submission,
      session: this._session,
    });
  }

  /**
   * Track validation errors.
   * @private
   * @param {Object} errors - Validation errors
   */
  _trackValidationErrors(errors) {
    if (!this._isTracking || !this._session) {
      return;
    }

    const errorCount = this._countErrors(errors);
    const previousErrorCount = this._session.validationErrors;
    this._session.validationErrors = errorCount;

    // Track errors per field
    this._updateFieldErrors(errors);

    // Only emit if error count changed
    if (errorCount !== previousErrorCount) {
      this._emitAnalyticsEvent('validation.errors', {
        errorCount,
        errors,
        session: this._session,
      });
    }
  }

  /**
   * Update field error counts.
   * @private
   * @param {Object} errors - Validation errors
   */
  _updateFieldErrors(errors) {
    const formFieldRegistry = this._form.get('formFieldRegistry', false);
    if (!formFieldRegistry) {
      return;
    }

    Object.keys(errors).forEach((fieldId) => {
      const fieldErrors = errors[fieldId];
      if (Array.isArray(fieldErrors)) {
        const fieldAnalytics = this._fieldAnalytics.get(fieldId);
        if (fieldAnalytics) {
          fieldAnalytics.errorCount = fieldErrors.length;
        }
      }
    });
  }

  /**
   * Count total number of errors.
   * @private
   * @param {Object} errors - Validation errors
   * @returns {number} Total error count
   */
  _countErrors(errors) {
    if (!errors || typeof errors !== 'object') {
      return 0;
    }

    let count = 0;
    const countRecursive = (obj) => {
      Object.values(obj).forEach((value) => {
        if (Array.isArray(value)) {
          count += value.length;
        } else if (value && typeof value === 'object') {
          countRecursive(value);
        }
      });
    };

    countRecursive(errors);
    return count;
  }

  /**
   * Get or create field analytics.
   * @private
   * @param {string} fieldId - Field identifier
   * @param {Object} fieldInstance - Field instance
   * @param {Object} [field] - Field definition
   * @returns {FieldAnalytics} Field analytics object
   */
  _getOrCreateFieldAnalytics(fieldId, fieldInstance, field = null) {
    if (this._fieldAnalytics.has(fieldId)) {
      return this._fieldAnalytics.get(fieldId);
    }

    const formFieldRegistry = this._form.get('formFieldRegistry', false);
    const resolvedField = field || (formFieldRegistry ? formFieldRegistry.get(fieldId) : null);

    const fieldAnalytics = {
      fieldId,
      fieldKey: resolvedField?.key || fieldInstance?.key || null,
      fieldType: resolvedField?.type || fieldInstance?.type || null,
      changeCount: 0,
      focusCount: 0,
      blurCount: 0,
      errorCount: 0,
      firstChangeTime: null,
      lastChangeTime: null,
    };

    this._fieldAnalytics.set(fieldId, fieldAnalytics);
    return fieldAnalytics;
  }

  /**
   * Track field focus event from formField.focus event.
   * @private
   * @param {Object} event - Focus event
   */
  _trackFieldFocus(event) {
    if (!this._options.trackFocusBlur || !this._isTracking) {
      return;
    }

    const { formField } = event;
    if (!formField || !formField.id) {
      return;
    }

    const fieldId = formField.id;
    const formFieldInstanceRegistry = this._form.get('formFieldInstanceRegistry', false);
    if (!formFieldInstanceRegistry) {
      return;
    }

    // Find field instance by ID
    const allInstances = formFieldInstanceRegistry.getAll();
    const instance = Array.from(allInstances.values()).find((inst) => inst.id === fieldId);

    if (instance) {
      const fieldAnalytics = this._getOrCreateFieldAnalytics(fieldId, instance, formField);
      fieldAnalytics.focusCount++;

      this._emitAnalyticsEvent('field.focused', {
        fieldId,
        fieldAnalytics,
      });
    }
  }

  /**
   * Track field blur event from formField.blur event.
   * @private
   * @param {Object} event - Blur event
   */
  _trackFieldBlur(event) {
    if (!this._options.trackFocusBlur || !this._isTracking) {
      return;
    }

    const { formField } = event;
    if (!formField || !formField.id) {
      return;
    }

    const fieldId = formField.id;
    const formFieldInstanceRegistry = this._form.get('formFieldInstanceRegistry', false);
    if (!formFieldInstanceRegistry) {
      return;
    }

    // Find field instance by ID
    const allInstances = formFieldInstanceRegistry.getAll();
    const instance = Array.from(allInstances.values()).find((inst) => inst.id === fieldId);

    if (instance) {
      const fieldAnalytics = this._getOrCreateFieldAnalytics(fieldId, instance, formField);
      fieldAnalytics.blurCount++;

      this._emitAnalyticsEvent('field.blurred', {
        fieldId,
        fieldAnalytics,
      });
    }
  }

  /**
   * Track field focus event (manual tracking).
   * @param {string} fieldId - Field identifier
   */
  trackFocus(fieldId) {
    if (!this._options.trackFocusBlur || !this._isTracking) {
      return;
    }

    const formFieldInstanceRegistry = this._form.get('formFieldInstanceRegistry', false);
    const formFieldRegistry = this._form.get('formFieldRegistry', false);
    if (!formFieldInstanceRegistry || !formFieldRegistry) {
      return;
    }

    // Find field instance by ID
    const allInstances = formFieldInstanceRegistry.getAll();
    const instance = Array.from(allInstances.values()).find((inst) => inst.id === fieldId);
    const field = formFieldRegistry.get(fieldId);

    if (instance) {
      const fieldAnalytics = this._getOrCreateFieldAnalytics(fieldId, instance, field);
      fieldAnalytics.focusCount++;

      this._emitAnalyticsEvent('field.focused', {
        fieldId,
        fieldAnalytics,
      });
    }
  }

  /**
   * Track field blur event (manual tracking).
   * @param {string} fieldId - Field identifier
   */
  trackBlur(fieldId) {
    if (!this._options.trackFocusBlur || !this._isTracking) {
      return;
    }

    const formFieldInstanceRegistry = this._form.get('formFieldInstanceRegistry', false);
    const formFieldRegistry = this._form.get('formFieldRegistry', false);
    if (!formFieldInstanceRegistry || !formFieldRegistry) {
      return;
    }

    // Find field instance by ID
    const allInstances = formFieldInstanceRegistry.getAll();
    const instance = Array.from(allInstances.values()).find((inst) => inst.id === fieldId);
    const field = formFieldRegistry.get(fieldId);

    if (instance) {
      const fieldAnalytics = this._getOrCreateFieldAnalytics(fieldId, instance, field);
      fieldAnalytics.blurCount++;

      this._emitAnalyticsEvent('field.blurred', {
        fieldId,
        fieldAnalytics,
      });
    }
  }

  /**
   * Get current analytics data.
   * @returns {AnalyticsData} Analytics data
   */
  getData() {
    const session = this._session ? { ...this._session } : null;
    const fields = Array.from(this._fieldAnalytics.entries()).map(([fieldId, analytics]) => ({
      fieldId,
      ...analytics,
    }));

    const summary = this._calculateSummary();

    return {
      session,
      fields,
      submissions: [...this._submissions],
      summary,
    };
  }

  /**
   * Get summary statistics.
   * @private
   * @returns {Object} Summary statistics
   */
  _calculateSummary() {
    if (!this._session) {
      return {
        totalSessions: 0,
        completionRate: 0,
        averageSessionDuration: 0,
        averageFieldChanges: 0,
        averageSubmissionAttempts: 0,
        mostChangedFields: [],
        mostErrorProneFields: [],
      };
    }

    const totalSessions = 1; // Current session
    const completionRate = this._session.completed ? 100 : 0;
    const averageSessionDuration = this._session.duration || 0;
    const averageFieldChanges = this._session.fieldChanges || 0;
    const averageSubmissionAttempts = this._session.submissionAttempts || 0;

    // Most changed fields
    const mostChangedFields = Array.from(this._fieldAnalytics.values())
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, 5)
      .map((fa) => ({
        fieldId: fa.fieldId,
        fieldKey: fa.fieldKey,
        changeCount: fa.changeCount,
      }));

    // Most error-prone fields
    const mostErrorProneFields = Array.from(this._fieldAnalytics.values())
      .filter((fa) => fa.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5)
      .map((fa) => ({
        fieldId: fa.fieldId,
        fieldKey: fa.fieldKey,
        errorCount: fa.errorCount,
      }));

    return {
      totalSessions,
      completionRate,
      averageSessionDuration,
      averageFieldChanges,
      averageSubmissionAttempts,
      mostChangedFields,
      mostErrorProneFields,
    };
  }

  /**
   * Reset analytics data.
   */
  reset() {
    this._resetSession();
    this._emitAnalyticsEvent('analytics.reset', {});
  }

  /**
   * Enable analytics tracking.
   */
  enable() {
    if (this._options.enabled) {
      return;
    }

    this._options.enabled = true;
    this._init();
  }

  /**
   * Disable analytics tracking.
   */
  disable() {
    if (!this._options.enabled) {
      return;
    }

    this._options.enabled = false;
    this._endSession();

    if (this._boundHandlers) {
      this._eventBus.off('form.init', this._boundHandlers.startSession);
      this._eventBus.off('form.destroy', this._boundHandlers.endSession);
      this._eventBus.off('form.clear', this._boundHandlers.resetSession);
      this._eventBus.off('field.updated', this._boundHandlers.trackFieldChange);
      this._eventBus.off('formFieldInstance.added', this._boundHandlers.trackFieldAdded);
      this._eventBus.off('formFieldInstance.removed', this._boundHandlers.trackFieldRemoved);
      this._eventBus.off('formField.focus', this._boundHandlers.trackFieldFocus);
      this._eventBus.off('formField.blur', this._boundHandlers.trackFieldBlur);
      this._eventBus.off('presubmit', this._boundHandlers.trackPresubmit);
      this._eventBus.off('submit', this._boundHandlers.trackSubmit);
      this._eventBus.off('changed', this._boundHandlers.trackValidationErrors);
      this._boundHandlers = null;
    }
  }

  /**
   * Generate a unique session ID.
   * @private
   * @returns {string} Session ID
   */
  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Emit analytics event.
   * @private
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  _emitAnalyticsEvent(eventType, data) {
    this._eventBus.fire(`analytics.${eventType}`, data);

    if (this._options.onEvent && typeof this._options.onEvent === 'function') {
      try {
        this._options.onEvent(eventType, data);
      } catch (error) {
        console.warn('Analytics onEvent callback error:', error);
      }
    }
  }
}

Analytics.$inject = ['eventBus', 'form', 'config.analytics'];

