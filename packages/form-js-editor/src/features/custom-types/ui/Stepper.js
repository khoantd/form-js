import { Fragment } from 'preact';

/**
 * Stepper component for multi-step forms.
 */
export function Stepper({ steps, currentStep, onStepClick }) {
  return (
    <div class="fjs-custom-type-stepper">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isClickable = onStepClick && (isCompleted || isActive);

        return (
          <Fragment key={step.id}>
            <div
              class={`fjs-custom-type-stepper-step ${isActive ? 'fjs-custom-type-stepper-step-active' : ''} ${isCompleted ? 'fjs-custom-type-stepper-step-completed' : ''} ${isClickable ? 'fjs-custom-type-stepper-step-clickable' : ''}`}
              onClick={isClickable ? () => onStepClick(stepNumber) : null}>
              <div class="fjs-custom-type-stepper-step-number">{isCompleted ? '✓' : stepNumber}</div>
              <div class="fjs-custom-type-stepper-step-label">{step.label}</div>
            </div>
            {index < steps.length - 1 && <div class="fjs-custom-type-stepper-connector" />}
          </Fragment>
        );
      })}
    </div>
  );
}

