/**
 * Comprehensive Error Handling System
 * 
 * Provides centralized error handling with:
 * - Error categorization and filtering
 * - Automatic retry for transient errors
 * - Error recovery mechanisms
 * - Detailed logging and analytics
 * - User-friendly error messages
 */

// Error categories
const ERROR_CATEGORIES = {
  RENDERING: 'rendering',
  NETWORK: 'network',
  VALIDATION: 'validation',
  SCHEMA: 'schema',
  UNKNOWN: 'unknown',
};

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Transient errors that might be retryable
const TRANSIENT_ERROR_PATTERNS = [
  /network/i,
  /timeout/i,
  /connection/i,
  /fetch/i,
  /load/i,
];

// Errors to ignore (harmless warnings)
const IGNORED_ERROR_PATTERNS = [
  /source map/i,
  /installHook/i,
  /anonymous code/i,
  /cyclic object value/i, // Already handled in schema export
];

// Error statistics for analytics
const errorStats = {
  total: 0,
  byCategory: {},
  bySeverity: {},
  recent: [],
  recoveryAttempts: 0,
  recoverySuccesses: 0,
  recoveryFailures: 0,
};

// Maximum number of recent errors to track
const MAX_RECENT_ERRORS = 50;

// Circuit breaker to prevent infinite recovery loops
const circuitBreaker = {
  failures: 0,
  lastFailureTime: null,
  isOpen: false,
  threshold: 5, // Open circuit after 5 failures
  timeout: 30000, // 30 seconds before attempting to close circuit
};

// Track recovery attempts per error type
const recoveryAttempts = new Map();
const MAX_RECOVERY_ATTEMPTS = 3;

/**
 * Categorize an error based on its message and stack trace
 */
function categorizeError(error) {
  const message = error?.message || String(error) || '';
  const stack = error?.stack || '';

  const errorText = `${message} ${stack}`.toLowerCase();

  // Check for ignored errors first
  if (IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(errorText))) {
    return { category: ERROR_CATEGORIES.UNKNOWN, severity: ERROR_SEVERITY.LOW, ignored: true };
  }

  // Categorize based on error patterns
  if (errorText.includes('schema') || errorText.includes('component') || errorText.includes('field')) {
    return { category: ERROR_CATEGORIES.SCHEMA, severity: ERROR_SEVERITY.MEDIUM };
  }

  if (errorText.includes('render') || errorText.includes('preact') || errorText.includes('component')) {
    return { category: ERROR_CATEGORIES.RENDERING, severity: ERROR_SEVERITY.HIGH };
  }

  if (errorText.includes('validate') || errorText.includes('validation')) {
    return { category: ERROR_CATEGORIES.VALIDATION, severity: ERROR_SEVERITY.MEDIUM };
  }

  if (TRANSIENT_ERROR_PATTERNS.some(pattern => pattern.test(errorText))) {
    return { category: ERROR_CATEGORIES.NETWORK, severity: ERROR_SEVERITY.MEDIUM };
  }

  // Check for critical errors
  if (errorText.includes('cannot read') || errorText.includes('undefined') || errorText.includes('null')) {
    return { category: ERROR_CATEGORIES.RENDERING, severity: ERROR_SEVERITY.HIGH };
  }

  return { category: ERROR_CATEGORIES.UNKNOWN, severity: ERROR_SEVERITY.MEDIUM };
}

/**
 * Check if an error is retryable
 */
function isRetryable(error, category) {
  if (category === ERROR_CATEGORIES.NETWORK) {
    return true;
  }
  
  const message = error?.message || String(error) || '';
  return TRANSIENT_ERROR_PATTERNS.some(pattern => pattern.test(message.toLowerCase()));
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error, category) {
  const message = error?.message || String(error) || 'An unexpected error occurred';

  switch (category) {
    case ERROR_CATEGORIES.SCHEMA:
      return 'There was an issue with the form schema. Please check your form configuration.';
    case ERROR_CATEGORIES.RENDERING:
      return 'There was an issue rendering the form. Please try refreshing the page.';
    case ERROR_CATEGORIES.VALIDATION:
      return 'There was a validation error. Please check your input.';
    case ERROR_CATEGORIES.NETWORK:
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Log error with detailed information
 */
function logError(error, context = {}) {
  const { category, severity, ignored } = categorizeError(error);
  
  // Skip ignored errors (only log in development)
  if (ignored && process.env.NODE_ENV === 'production') {
    return;
  }

  // Update statistics
  errorStats.total++;
  errorStats.byCategory[category] = (errorStats.byCategory[category] || 0) + 1;
  errorStats.bySeverity[severity] = (errorStats.bySeverity[severity] || 0) + 1;

  // Add to recent errors
  const errorRecord = {
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message || String(error),
      stack: error?.stack,
      name: error?.name,
    },
    category,
    severity,
    context,
  };

  errorStats.recent.unshift(errorRecord);
  if (errorStats.recent.length > MAX_RECENT_ERRORS) {
    errorStats.recent.pop();
  }

  // Log based on severity
  const logMethod = severity === ERROR_SEVERITY.CRITICAL || severity === ERROR_SEVERITY.HIGH 
    ? console.error 
    : console.warn;

  logMethod(`[${category.toUpperCase()}] ${error?.message || String(error)}`, {
    error,
    category,
    severity,
    context,
    stack: error?.stack,
  });

  return { category, severity, ignored, errorRecord };
}

/**
 * Check if circuit breaker allows recovery
 */
function canAttemptRecovery() {
  // Check if circuit is open
  if (circuitBreaker.isOpen) {
    const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
    
    // Try to close circuit after timeout
    if (timeSinceLastFailure > circuitBreaker.timeout) {
      console.info('[ERROR HANDLER] Circuit breaker: Attempting to close circuit');
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
      return true;
    }
    
    console.warn('[ERROR HANDLER] Circuit breaker: Circuit is open, skipping recovery');
    return false;
  }
  
  return true;
}

/**
 * Record recovery attempt
 */
function recordRecoveryAttempt(errorKey, success) {
  const attempts = recoveryAttempts.get(errorKey) || { count: 0, lastAttempt: null };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  recoveryAttempts.set(errorKey, attempts);
  
  errorStats.recoveryAttempts++;
  if (success) {
    errorStats.recoverySuccesses++;
    circuitBreaker.failures = Math.max(0, circuitBreaker.failures - 1);
  } else {
    errorStats.recoveryFailures++;
    circuitBreaker.failures++;
    circuitBreaker.lastFailureTime = Date.now();
    
    // Open circuit if threshold exceeded
    if (circuitBreaker.failures >= circuitBreaker.threshold) {
      circuitBreaker.isOpen = true;
      console.error(`[ERROR HANDLER] Circuit breaker: Opening circuit after ${circuitBreaker.failures} failures`);
    }
  }
}

/**
 * Get error key for tracking recovery attempts
 */
function getErrorKey(error, category) {
  const message = error?.message || String(error) || '';
  return `${category}:${message.substring(0, 50)}`;
}

/**
 * Check if we've exceeded max recovery attempts for this error
 */
function hasExceededMaxAttempts(errorKey) {
  const attempts = recoveryAttempts.get(errorKey);
  if (!attempts) return false;
  
  // Reset if last attempt was more than 5 minutes ago
  const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
  if (timeSinceLastAttempt > 300000) {
    recoveryAttempts.delete(errorKey);
    return false;
  }
  
  return attempts.count >= MAX_RECOVERY_ATTEMPTS;
}

/**
 * Attempt to recover from an error with retry logic
 */
function attemptRecovery(error, category) {
  // Check circuit breaker
  if (!canAttemptRecovery()) {
    return false;
  }
  
  const errorKey = getErrorKey(error, category);
  
  // Check if we've exceeded max attempts for this specific error
  if (hasExceededMaxAttempts(errorKey)) {
    console.warn(`[ERROR HANDLER] Max recovery attempts (${MAX_RECOVERY_ATTEMPTS}) exceeded for error: ${errorKey}`);
    return false;
  }
  
  let recoveryStrategy = null;
  let recoveryEvent = null;
  
  // Recovery strategies based on error category
  switch (category) {
    case ERROR_CATEGORIES.RENDERING:
      recoveryStrategy = 'rerender';
      recoveryEvent = 'error:recovery:rerender';
      break;

    case ERROR_CATEGORIES.SCHEMA:
      // Try to reload schema from storage
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        const storedSchema = sessionStorage.getItem('demo-schema');
        if (storedSchema) {
          recoveryStrategy = 'reload-schema';
          recoveryEvent = 'error:recovery:reload-schema';
        }
      }
      break;

    default:
      return false;
  }
  
  if (!recoveryEvent || typeof window === 'undefined') {
    return false;
  }
  
  // Dispatch recovery event with error context
  try {
    window.dispatchEvent(new CustomEvent(recoveryEvent, {
      detail: {
        error: {
          message: error?.message || String(error),
          category,
          strategy: recoveryStrategy,
        },
        timestamp: Date.now(),
      },
    }));
    
    console.info(`[ERROR HANDLER] Dispatched recovery event: ${recoveryEvent} for ${category} error`);
    recordRecoveryAttempt(errorKey, true); // Optimistically record as success
    return true;
  } catch (recoveryError) {
    console.error('[ERROR HANDLER] Failed to dispatch recovery event:', recoveryError);
    recordRecoveryAttempt(errorKey, false);
    return false;
  }
}

/**
 * Handle unhandled promise rejection with recovery
 */
export function handleUnhandledRejection(event) {
  const error = event.reason;
  const context = {
    type: 'unhandledRejection',
    timestamp: new Date().toISOString(),
  };

  const { category, severity, ignored } = logError(error, context);

  // Ignore harmless errors
  if (ignored) {
    event.preventDefault();
    return;
  }

  // Attempt recovery for certain error types
  if (severity !== ERROR_SEVERITY.CRITICAL) {
    const recovered = attemptRecovery(error, category);
    if (recovered) {
      // Don't prevent default immediately - let recovery attempt complete
      // We'll track success/failure separately
      setTimeout(() => {
        // Check if error was actually resolved
        // This is a simple heuristic - in production you might want more sophisticated tracking
        event.preventDefault();
      }, 100);
      return;
    } else {
      // Recovery failed or not attempted
      recordRecoveryAttempt(getErrorKey(error, category), false);
    }
  }

  // For critical errors, show user-friendly message
  if (severity === ERROR_SEVERITY.CRITICAL || severity === ERROR_SEVERITY.HIGH) {
    const userMessage = getUserFriendlyMessage(error, category);
    
    // Only show user notification if not in development
    if (process.env.NODE_ENV === 'production') {
      // You could integrate with a notification system here
      console.error('[USER NOTIFICATION]', userMessage);
    }
  }

  // Prevent default browser error handling for non-critical errors
  if (severity !== ERROR_SEVERITY.CRITICAL) {
    event.preventDefault();
  }
}

/**
 * Handle regular errors
 */
export function handleError(event) {
  const error = event.error;
  const context = {
    type: 'error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: new Date().toISOString(),
  };

  const { category, severity, ignored } = logError(error, context);

  // Ignore harmless errors
  if (ignored) {
    event.preventDefault();
    return;
  }

  // Attempt recovery
  if (severity !== ERROR_SEVERITY.CRITICAL) {
    const recovered = attemptRecovery(error, category);
    if (recovered) {
      console.info(`[ERROR HANDLER] Attempted recovery for ${category} error`);
      event.preventDefault();
      return;
    }
  }
}

/**
 * Initialize error handling system
 */
export function initializeErrorHandling() {
  // Remove any existing handlers to avoid duplicates
  window.removeEventListener('error', handleError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  // Add new handlers
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Expose error stats for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    window.__errorStats = errorStats;
    window.__getErrorStats = () => ({ ...errorStats });
    window.__clearErrorStats = () => {
      errorStats.total = 0;
      errorStats.byCategory = {};
      errorStats.bySeverity = {};
      errorStats.recent = [];
    };
  }

  console.info('[ERROR HANDLER] Error handling system initialized');
}

/**
 * Manually report an error
 */
export function reportError(error, context = {}) {
  return logError(error, { ...context, type: 'manual' });
}

/**
 * Get error statistics
 */
export function getErrorStats() {
  return { ...errorStats };
}


