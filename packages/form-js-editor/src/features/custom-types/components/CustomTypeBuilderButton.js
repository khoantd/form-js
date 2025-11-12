import { useCallback } from 'preact/hooks';
import { useService } from '../../../render/hooks';

/**
 * Button component to open the custom type builder.
 */
export function CustomTypeBuilderButton() {
  const eventBus = useService('eventBus', false);

  const handleClick = useCallback(() => {
    if (eventBus) {
      eventBus.fire('customTypes.openBuilder');
    }
  }, [eventBus]);

  if (!eventBus) {
    return null;
  }

  return (
    <button type="button" class="fjs-custom-type-builder-button" onClick={handleClick} title="Create Custom Type">
      <span class="fjs-custom-type-builder-button-icon">+</span>
      <span class="fjs-custom-type-builder-button-label">New Custom Type</span>
    </button>
  );
}

