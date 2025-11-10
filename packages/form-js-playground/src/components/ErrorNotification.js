import { useEffect } from 'preact/hooks';

/**
 * Error notification component that displays JSON parse errors
 *
 * @param {object} props
 * @param {Error|null} props.error - The error to display, or null to hide
 * @param {string} [props.context] - Context where the error occurred (e.g., 'file', 'input')
 * @param {Function} props.onDismiss - Callback when user dismisses the error
 */
export function ErrorNotification({ error, context = 'data', onDismiss }) {
  useEffect(() => {
    if (!error) {
      return;
    }

    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 10000);

    return () => {
      clearTimeout(timer);
    };
  }, [error, onDismiss]);

  if (!error) {
    return null;
  }

  const getErrorMessage = (err) => {
    if (err.message) {
      return err.message;
    }
    if (err.name === 'SyntaxError') {
      return 'Invalid JSON syntax. Please check your JSON format.';
    }
    return 'An error occurred while parsing JSON.';
  };

  const getContextMessage = () => {
    switch (context) {
      case 'file':
        return 'Failed to parse dropped file:';
      case 'input':
        return 'Failed to parse input data:';
      default:
        return 'JSON parse error:';
    }
  };

  return (
    <div class="fjs-pgl-error-notification" role="alert">
      <div class="fjs-pgl-error-notification-content">
        <div class="fjs-pgl-error-notification-icon" aria-hidden="true">
          ⚠️
        </div>
        <div class="fjs-pgl-error-notification-text">
          <div class="fjs-pgl-error-notification-title">{getContextMessage()}</div>
          <div class="fjs-pgl-error-notification-message">{getErrorMessage(error)}</div>
        </div>
        <button
          type="button"
          class="fjs-pgl-error-notification-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  );
}

