import { Fragment } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { useService } from '../../../render/hooks';
import { Stepper } from './Stepper';
import { PreviewPane } from './PreviewPane';

// Available base field types
const BASE_FIELD_TYPES = [
  { value: 'textfield', label: 'Text Field' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'datetime', label: 'Date/Time' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'radio', label: 'Radio' },
  { value: 'select', label: 'Select' },
  { value: 'taglist', label: 'Taglist' },
];

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'composition', label: 'Composition' },
  { id: 'validation', label: 'Defaults & Validation' },
  { id: 'preview', label: 'Preview & Publish' },
];

/**
 * Generate a slug from a string.
 */
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Custom Type Builder Modal component.
 */
export function CustomTypeBuilderModal() {
  const customTypeRegistry = useService('customTypeRegistry', false);
  const formFields = useService('formFields', false);
  const eventBus = useService('eventBus', false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    baseType: 'textfield',
    icon: '',
    color: '#000000',
    category: 'custom',
    config: {
      label: '',
      description: '',
      helper: '',
      defaultValue: '',
      required: false,
      min: undefined,
      max: undefined,
      options: [],
    },
  });

  const [errors, setErrors] = useState({});

  // Listen for open event
  useEffect(() => {
    if (!eventBus) {
      return;
    }

    const handleOpen = () => {
      setIsOpen(true);
      setCurrentStep(1);
      setFormData({
        name: '',
        type: '',
        baseType: 'textfield',
        icon: '',
        color: '#000000',
        category: 'custom',
        config: {
          label: '',
          description: '',
          helper: '',
          defaultValue: '',
          required: false,
          min: undefined,
          max: undefined,
          options: [],
        },
      });
      setErrors({});
    };

    eventBus.on('customTypes.openBuilder', handleOpen);

    return () => {
      eventBus.off('customTypes.openBuilder', handleOpen);
    };
  }, [eventBus]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCurrentStep(1);
    setFormData({
      name: '',
      type: '',
      baseType: 'textfield',
      icon: '',
      color: '#000000',
      category: 'custom',
      config: {
        label: '',
        description: '',
        helper: '',
        defaultValue: '',
        required: false,
        min: undefined,
        max: undefined,
        options: [],
      },
    });
    setErrors({});
  }, []);

  const handleNext = useCallback(() => {
    // Validate current step
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, formData]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  }, [currentStep]);

  const handleStepClick = useCallback((step) => {
    // Only allow clicking on completed steps
    if (step < currentStep) {
      setCurrentStep(step);
      setErrors({});
    }
  }, [currentStep]);

  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        stepErrors.name = 'Name is required';
      }
      if (!formData.type.trim()) {
        stepErrors.type = 'Type key is required';
      } else if (!/^[a-z][a-z0-9-]*$/.test(formData.type)) {
        stepErrors.type = 'Type key must start with a letter and contain only lowercase letters, numbers, and hyphens';
      } else if (customTypeRegistry && customTypeRegistry.has(formData.type)) {
        stepErrors.type = 'This type key is already in use';
      }
    }

    if (step === 2) {
      if (!formData.baseType) {
        stepErrors.baseType = 'Base field type is required';
      }
    }

    return stepErrors;
  };

  const handlePublish = useCallback(() => {
    if (!customTypeRegistry) {
      return;
    }

    // Final validation
    const finalErrors = validateStep(1);
    Object.assign(finalErrors, validateStep(2));

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      setCurrentStep(1);
      return;
    }

    try {
      customTypeRegistry.create(formData);
      handleClose();
    } catch (error) {
      setErrors({ publish: error.message });
    }
  }, [formData, customTypeRegistry, handleClose]);

  const handleNameChange = useCallback((event) => {
    const name = event.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      type: prev.type || slugify(name),
      config: {
        ...prev.config,
        label: prev.config.label || name,
      },
    }));
  }, []);

  const handleTypeChange = useCallback((event) => {
    const type = event.target.value;
    setFormData((prev) => ({ ...prev, type }));
  }, []);

  const handleBaseTypeChange = useCallback((event) => {
    const baseType = event.target.value;
    setFormData((prev) => ({ ...prev, baseType }));
  }, []);

  const handleConfigChange = useCallback((key, value) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  }, []);

  const handleAddOption = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        options: [...(prev.config.options || []), { label: '', value: '' }],
      },
    }));
  }, []);

  const handleRemoveOption = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        options: prev.config.options.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const handleOptionChange = useCallback((index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        options: prev.config.options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
      },
    }));
  }, []);

  if (!isOpen) {
    return null;
  }

  const needsOptions = ['select', 'checklist', 'taglist', 'radio'].includes(formData.baseType);

  return (
    <Fragment>
      <div class="fjs-custom-type-modal-overlay" onClick={handleClose} />
      <div class="fjs-custom-type-modal">
        <div class="fjs-custom-type-modal-header">
          <h2 class="fjs-custom-type-modal-title">Create Custom Type</h2>
          <button type="button" class="fjs-custom-type-modal-close" onClick={handleClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <div class="fjs-custom-type-modal-content">
          <Stepper steps={STEPS} currentStep={currentStep} onStepClick={handleStepClick} />

          <div class="fjs-custom-type-modal-body">
            <div class="fjs-custom-type-modal-form">
              {/* Step 1: Basics */}
              {currentStep === 1 && (
                <div class="fjs-custom-type-step">
                  <h3>Basic Information</h3>
                  <div class="fjs-custom-type-field">
                    <label>
                      Name <span class="fjs-required">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onInput={handleNameChange}
                      placeholder="e.g., Email Field"
                      class={errors.name ? 'fjs-error' : ''}
                    />
                    {errors.name && <div class="fjs-error-message">{errors.name}</div>}
                  </div>

                  <div class="fjs-custom-type-field">
                    <label>
                      Type Key <span class="fjs-required">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      onInput={handleTypeChange}
                      placeholder="e.g., email-field"
                      class={errors.type ? 'fjs-error' : ''}
                    />
                    {errors.type && <div class="fjs-error-message">{errors.type}</div>}
                    <div class="fjs-field-help">Used internally. Must be unique and URL-friendly.</div>
                  </div>

                  <div class="fjs-custom-type-field">
                    <label>Icon (optional)</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onInput={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                      placeholder="e.g., ✉"
                    />
                    <div class="fjs-field-help">A single character or emoji to represent this type</div>
                  </div>

                  <div class="fjs-custom-type-field">
                    <label>Color (optional)</label>
                    <input
                      type="color"
                      value={formData.color}
                      onInput={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Composition */}
              {currentStep === 2 && (
                <div class="fjs-custom-type-step">
                  <h3>Base Field Type</h3>
                  <div class="fjs-custom-type-field">
                    <label>
                      Base Type <span class="fjs-required">*</span>
                    </label>
                    <select value={formData.baseType} onChange={handleBaseTypeChange} class={errors.baseType ? 'fjs-error' : ''}>
                      {BASE_FIELD_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.baseType && <div class="fjs-error-message">{errors.baseType}</div>}
                    <div class="fjs-field-help">The base field type this custom type extends</div>
                  </div>

                  <h3>Additional Properties</h3>
                  <div class="fjs-custom-type-field">
                    <label>Label</label>
                    <input
                      type="text"
                      value={formData.config.label}
                      onInput={(e) => handleConfigChange('label', e.target.value)}
                      placeholder="Default label for this field"
                    />
                  </div>

                  <div class="fjs-custom-type-field">
                    <label>Description</label>
                    <textarea
                      value={formData.config.description}
                      onInput={(e) => handleConfigChange('description', e.target.value)}
                      placeholder="Help text shown below the field"
                      rows="3"
                    />
                  </div>

                  <div class="fjs-custom-type-field">
                    <label>Helper Text</label>
                    <input
                      type="text"
                      value={formData.config.helper}
                      onInput={(e) => handleConfigChange('helper', e.target.value)}
                      placeholder="Additional helper text"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Defaults & Validation */}
              {currentStep === 3 && (
                <div class="fjs-custom-type-step">
                  <h3>Default Value</h3>
                  <div class="fjs-custom-type-field">
                    <label>Default Value</label>
                    <input
                      type="text"
                      value={formData.config.defaultValue || ''}
                      onInput={(e) => handleConfigChange('defaultValue', e.target.value)}
                      placeholder="Default value for new fields"
                    />
                  </div>

                  {needsOptions && (
                    <div class="fjs-custom-type-field">
                      <label>Options</label>
                      <div class="fjs-custom-type-options">
                        {(formData.config.options || []).map((option, index) => (
                          <div key={index} class="fjs-custom-type-option-row">
                            <input
                              type="text"
                              value={option.label}
                              onInput={(e) => handleOptionChange(index, 'label', e.target.value)}
                              placeholder="Label"
                            />
                            <input
                              type="text"
                              value={option.value}
                              onInput={(e) => handleOptionChange(index, 'value', e.target.value)}
                              placeholder="Value"
                            />
                            <button type="button" onClick={() => handleRemoveOption(index)}>
                              Remove
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={handleAddOption} class="fjs-button-secondary">
                          Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  <h3>Validation</h3>
                  <div class="fjs-custom-type-field">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.config.required || false}
                        onChange={(e) => handleConfigChange('required', e.target.checked)}
                      />
                      Required
                    </label>
                  </div>

                  {['number', 'textfield', 'textarea'].includes(formData.baseType) && (
                    <>
                      <div class="fjs-custom-type-field">
                        <label>Minimum</label>
                        <input
                          type="number"
                          value={formData.config.min || ''}
                          onInput={(e) => handleConfigChange('min', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Min value"
                        />
                      </div>

                      <div class="fjs-custom-type-field">
                        <label>Maximum</label>
                        <input
                          type="number"
                          value={formData.config.max || ''}
                          onInput={(e) => handleConfigChange('max', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Max value"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 4: Preview & Publish */}
              {currentStep === 4 && (
                <div class="fjs-custom-type-step">
                  <h3>Preview</h3>
                  <PreviewPane definition={formData} formFields={formFields} />
                  {errors.publish && <div class="fjs-error-message">{errors.publish}</div>}
                </div>
              )}
            </div>
          </div>

          <div class="fjs-custom-type-modal-footer">
            <button type="button" onClick={handleClose} class="fjs-button-secondary">
              Cancel
            </button>
            <div class="fjs-custom-type-modal-footer-actions">
              {currentStep > 1 && (
                <button type="button" onClick={handlePrevious} class="fjs-button-secondary">
                  Previous
                </button>
              )}
              {currentStep < STEPS.length ? (
                <button type="button" onClick={handleNext} class="fjs-button-primary">
                  Next
                </button>
              ) : (
                <button type="button" onClick={handlePublish} class="fjs-button-primary">
                  Publish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

