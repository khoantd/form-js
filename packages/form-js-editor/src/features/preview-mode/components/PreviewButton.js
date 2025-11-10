import { useCallback, useEffect, useState } from 'preact/hooks';
import { useService } from '../../../render/hooks/useService';

/**
 * Preview button component for toggling preview mode.
 */
export function PreviewButton() {
  const previewMode = useService('previewMode');
  const eventBus = useService('eventBus');
  const [isActive, setIsActive] = useState(previewMode.isActive());

  useEffect(() => {
    function handlePreviewModeChanged(event) {
      setIsActive(event.active);
    }

    eventBus.on('previewMode.changed', handlePreviewModeChanged);

    return () => {
      eventBus.off('previewMode.changed', handlePreviewModeChanged);
    };
  }, [eventBus]);

  const handleClick = useCallback(() => {
    previewMode.toggle();
  }, [previewMode]);

  return (
    <button
      type="button"
      class={`fjs-preview-button ${isActive ? 'fjs-preview-button-active' : ''}`}
      onClick={handleClick}
      title={isActive ? 'Exit preview mode' : 'Enter preview mode'}
      aria-label={isActive ? 'Exit preview mode' : 'Enter preview mode'}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 3C4.5 3 1.73 5.11 0 8C1.73 10.89 4.5 13 8 13C11.5 13 14.27 10.89 16 8C14.27 5.11 11.5 3 8 3ZM8 11.5C6.07 11.5 4.5 9.93 4.5 8C4.5 6.07 6.07 4.5 8 4.5C9.93 4.5 11.5 6.07 11.5 8C11.5 9.93 9.93 11.5 8 11.5ZM8 6C6.9 6 6 6.9 6 8C6 9.1 6.9 10 8 10C9.1 10 10 9.1 10 8C10 6.9 9.1 6 8 6Z"
          fill="currentColor"
        />
      </svg>
      <span class="fjs-preview-button-label">{isActive ? 'Exit Preview' : 'Preview'}</span>
    </button>
  );
}

