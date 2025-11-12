import { expect } from 'chai';
import EventBus from 'diagram-js/lib/core/EventBus';
import { Validator } from '../../../src/core/Validator';
import { ValidationRegistry } from '../../../src/core/ValidationRegistry';
import { FeelExpressionLanguage } from '../../../src/features/expressionLanguage';
import { I18n } from '../../../src/core/I18n';

describe('Validator', function () {
  const validator = createValidator();

  describe('#validateField', function () {
    it('should return no errors', function () {
      // given
      const field = {};

      // when
      const errors = validator.validateField(field, 'foobar');

      // then
      expect(errors).to.have.length(0);
    });

    describe('<number>', function () {
      it('should disallow NaN', function () {
        // given
        const field = {
          type: 'number',
        };

        // when
        const errors = validator.validateField(field, 'NaN');

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Value is not a number.');
      });

      it('should restrict decimals', function () {
        // given
        const field = {
          type: 'number',
          decimalDigits: 3,
        };

        // when
        const errors = validator.validateField(field, 3.1256);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Value is expected to have at most 3 decimal digits.');
      });

      it('should restrict decimals (0)', function () {
        // given
        const field = {
          type: 'number',
          decimalDigits: 0,
        };

        // when
        const errors = validator.validateField(field, 3.1256);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Value is expected to be an integer.');
      });

      it('should restrict decimals (string)', function () {
        // given
        const field = {
          type: 'number',
          decimalDigits: 3,
        };

        // when
        const errors = validator.validateField(field, '3.1415');

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Value is expected to have at most 3 decimal digits.');
      });

      it('should restrict increment', function () {
        // given
        const field = {
          type: 'number',
          increment: 0.05,
        };

        // when
        const errors = validator.validateField(field, 3.1689);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Please select a valid value, the two nearest valid values are 3.15 and 3.2.');
      });

      it('should restrict increment (string)', function () {
        // given
        const field = {
          type: 'number',
          increment: 0.005,
        };

        // when
        const errors = validator.validateField(field, '3.1689');

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Please select a valid value, the two nearest valid values are 3.165 and 3.17.');
      });
    });

    describe('pattern', function () {
      it('should be valid', function () {
        // given
        const field = {
          validate: {
            pattern: /foo/,
          },
        };

        // when
        const errors = validator.validateField(field, 'foobar');

        // then
        expect(errors).to.have.length(0);
      });

      it('should be invalid', function () {
        // given
        const field = {
          validate: {
            pattern: '/foo/',
          },
        };

        // when
        const errors = validator.validateField(field, 'barbaz');

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must match pattern /foo/.');
      });

      it('should be invalid with a custom error message', function () {
        // given
        const field = {
          validate: {
            pattern: '^INV-\\d{6}$',
            patternErrorMessage: 'Invoice number must be in the format INV-123456.',
          },
        };

        // when
        const errors = validator.validateField(field, 'invalid-invoice-number');

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Invoice number must be in the format INV-123456.');
      });
    });

    describe('required', function () {
      it('should be valid', function () {
        // given
        const field = {
          validate: {
            required: true,
          },
        };

        // when
        const errors = validator.validateField(field, 'foo');

        // then
        expect(errors).to.have.length(0);
      });

      it('should be invalid (undefined)', function () {
        // given
        const field = {
          validate: {
            required: true,
          },
        };

        // when
        const errors = validator.validateField(field, undefined);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field is required.');
      });

      it('should be invalid (null)', function () {
        // given
        const field = {
          validate: {
            required: true,
          },
        };

        // when
        const errors = validator.validateField(field, null);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field is required.');
      });

      it('should be invalid (empty string)', function () {
        // given
        const field = {
          validate: {
            required: true,
          },
        };

        // when
        const errors = validator.validateField(field, '');

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field is required.');
      });

      it('should be invalid (checkbox)', function () {
        // given
        const field = {
          type: 'checkbox',
          validate: {
            required: true,
          },
        };

        // when
        const errors = validator.validateField(field, false);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field is required.');
      });

      it('should be invalid (multiple)', function () {
        // given
        const field = {
          validate: {
            required: true,
          },
        };

        // when
        const errors = validator.validateField(field, []);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field is required.');
      });
    });

    describe('min', function () {
      it('should be valid', function () {
        // given
        const field = {
          validate: {
            min: 100,
          },
        };

        // when
        const errors = validator.validateField(field, 200);

        // then
        expect(errors).to.have.length(0);
      });

      it('should be invalid', function () {
        // given
        const field = {
          validate: {
            min: 200,
          },
        };

        // when
        const errors = validator.validateField(field, 100);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have minimum value of 200.');
      });

      it('should be invalid (zero)', function () {
        // given
        const field = {
          validate: {
            min: 200,
          },
        };

        // when
        const errors = validator.validateField(field, 0);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have minimum value of 200.');
      });

      it('should be invalid (negative)', function () {
        // given
        const field = {
          validate: {
            min: -200,
          },
        };

        // when
        const errors = validator.validateField(field, -300);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have minimum value of -200.');
      });
    });

    describe('min (expression)', function () {
      it('should be valid', function () {
        // given
        const field = {
          validate: {
            min: '=100',
          },
        };

        // when
        const errors = validator.validateField(field, 200);

        // then
        expect(errors).to.have.length(0);
      });

      it('should be invalid', function () {
        // given
        const field = {
          validate: {
            min: '=200',
          },
        };

        // when
        const errors = validator.validateField(field, 100);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have minimum value of 200.');
      });

      it('should be invalid (zero)', function () {
        // given
        const field = {
          validate: {
            min: '=200',
          },
        };

        // when
        const errors = validator.validateField(field, 0);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have minimum value of 200.');
      });

      it('should be invalid (negative)', function () {
        // given
        const field = {
          validate: {
            min: '=-200',
          },
        };

        // when
        const errors = validator.validateField(field, -300);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have minimum value of -200.');
      });
    });

    describe('max', function () {
      it('should be valid', function () {
        // given
        const field = {
          validate: {
            max: 200,
          },
        };

        // when
        const errors = validator.validateField(field, 100);

        // then
        expect(errors).to.have.length(0);
      });

      it('should be invalid', function () {
        // given
        const field = {
          validate: {
            max: 100,
          },
        };

        // when
        const errors = validator.validateField(field, 200);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have maximum value of 100.');
      });

      it('should be invalid (zero)', function () {
        // given
        const field = {
          validate: {
            max: -200,
          },
        };

        // when
        const errors = validator.validateField(field, 0);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have maximum value of -200.');
      });

      it('should be invalid (negative)', function () {
        // given
        const field = {
          validate: {
            max: -200,
          },
        };

        // when
        const errors = validator.validateField(field, -100);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have maximum value of -200.');
      });
    });

    describe('max (expression)', function () {
      it('should be valid', function () {
        // given
        const field = {
          validate: {
            max: '=200',
          },
        };

        // when
        const errors = validator.validateField(field, 100);

        // then
        expect(errors).to.have.length(0);
      });

      it('should be invalid', function () {
        // given
        const field = {
          validate: {
            max: '=100',
          },
        };

        // when
        const errors = validator.validateField(field, 200);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have maximum value of 100.');
      });

      it('should be invalid (zero)', function () {
        // given
        const field = {
          validate: {
            max: '=-200',
          },
        };

        // when
        const errors = validator.validateField(field, 0);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have maximum value of -200.');
      });

      it('should be invalid (negative)', function () {
        // given
        const field = {
          validate: {
            max: '=-200',
          },
        };

        // when
        const errors = validator.validateField(field, -100);

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must have maximum value of -200.');
      });
    });

    describe('email pattern', function () {
      it('should be valid', function () {
        // given
        const field = {
          validate: {
            validationType: 'email',
          },
        };

        // when
        const errors = validator.validateField(field, 'jon.doe@camunda.com');

        // then
        expect(errors).to.have.length(0);
      });

      it('should be invalid', function () {
        // given
        const field = {
          validate: {
            validationType: 'email',
          },
        };

        // when
        const errors = validator.validateField(field, 'jon doe');

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must be a valid email.');
      });
    });

    describe('phone number pattern', function () {
      it('should be valid', function () {
        // given
        const field = {
          validate: {
            validationType: 'phone',
          },
        };

        // when
        const errors = validator.validateField(field, '+4930664040900');

        // then
        expect(errors).to.have.length(0);
      });

      it('should be invalid', function () {
        // given
        const field = {
          validate: {
            validationType: 'phone',
          },
        };

        // when
        const errors = validator.validateField(field, '1234');

        // then
        expect(errors).to.have.length(1);
        expect(errors[0]).to.equal('Field must be a valid  international phone number. (e.g. +4930664040900)');
      });
    });
  });

  describe('minLength', function () {
    it('should be valid', function () {
      // given
      const field = {
        validate: {
          minLength: 5,
        },
      };

      // when
      const errors = validator.validateField(field, 'foobar');

      // then
      expect(errors).to.have.length(0);
    });

    it('should be invalid', function () {
      // given
      const field = {
        validate: {
          minLength: 5,
        },
      };

      // when
      const errors = validator.validateField(field, 'foo');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Field must have minimum length of 5.');
    });
  });

  describe('minLength (expression)', function () {
    it('should be valid', function () {
      // given
      const field = {
        validate: {
          minLength: '=5',
        },
      };

      // when
      const errors = validator.validateField(field, 'foobar');

      // then
      expect(errors).to.have.length(0);
    });

    it('should be invalid', function () {
      // given
      const field = {
        validate: {
          minLength: '=5',
        },
      };

      // when
      const errors = validator.validateField(field, 'foo');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Field must have minimum length of 5.');
    });
  });

  describe('maxLength', function () {
    it('should be valid', function () {
      // given
      const field = {
        validate: {
          maxLength: 5,
        },
      };

      // when
      const errors = validator.validateField(field, 'foo');

      // then
      expect(errors).to.have.length(0);
    });

    it('should be invalid', function () {
      // given
      const field = {
        validate: {
          maxLength: 5,
        },
      };

      // when
      const errors = validator.validateField(field, 'foobar');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Field must have maximum length of 5.');
    });
  });

  describe('maxLength (expression)', function () {
    it('should be valid', function () {
      // given
      const field = {
        validate: {
          maxLength: '=5',
        },
      };

      // when
      const errors = validator.validateField(field, 'foo');

      // then
      expect(errors).to.have.length(0);
    });

    it('should be invalid', function () {
      // given
      const field = {
        validate: {
          maxLength: '=5',
        },
      };

      // when
      const errors = validator.validateField(field, 'foobar');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Field must have maximum length of 5.');
    });
  });

  describe('custom validators', function () {
    it('should run custom validators', function () {
      // given
      const validator = createValidator();
      const validationRegistry = validator._validationRegistry;
      validationRegistry.register('customMin', (context) => {
        if (context.value && context.value.length < 5) {
          return 'Value must be at least 5 characters';
        }
        return null;
      });

      const field = {
        id: 'test',
        type: 'textfield',
        validate: {
          customValidators: ['customMin'],
        },
      };

      const fieldInstance = {
        id: 'test',
        expressionContextInfo: {},
      };

      // when
      const errors = validator.validateFieldInstance(fieldInstance, 'foo');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Value must be at least 5 characters');
    });

    it('should run multiple custom validators', function () {
      // given
      const validator = createValidator();
      const validationRegistry = validator._validationRegistry;
      validationRegistry.register('minLength', (context) => {
        if (context.value && context.value.length < 5) {
          return 'Too short';
        }
        return null;
      });
      validationRegistry.register('noSpaces', (context) => {
        if (context.value && context.value.includes(' ')) {
          return 'No spaces allowed';
        }
        return null;
      });

      const field = {
        id: 'test',
        type: 'textfield',
        validate: {
          customValidators: ['minLength', 'noSpaces'],
        },
      };

      const fieldInstance = {
        id: 'test',
        expressionContextInfo: {},
      };

      // when
      const errors = validator.validateFieldInstance(fieldInstance, 'foo bar');

      // then
      expect(errors).to.have.length(2);
      expect(errors).to.include('Too short');
      expect(errors).to.include('No spaces allowed');
    });

    it('should support async custom validators', async function () {
      // given
      const validator = createValidator();
      const validationRegistry = validator._validationRegistry;
      validationRegistry.register('asyncCheck', async (context) => {
        // Simulate async validation (e.g., API call)
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (context.value === 'invalid') {
          return 'Value is invalid';
        }
        return null;
      });

      const field = {
        id: 'test',
        type: 'textfield',
        validate: {
          customValidators: ['asyncCheck'],
        },
      };

      const fieldInstance = {
        id: 'test',
        expressionContextInfo: {},
      };

      // when
      const errorsPromise = validator.validateFieldInstance(fieldInstance, 'invalid');

      // then
      expect(errorsPromise).to.be.a('promise');
      const errors = await errorsPromise;
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Value is invalid');
    });

    it('should handle custom validator errors gracefully', function () {
      // given
      const validator = createValidator();
      const validationRegistry = validator._validationRegistry;
      validationRegistry.register('errorValidator', () => {
        throw new Error('Validator error');
      });

      const field = {
        id: 'test',
        type: 'textfield',
        validate: {
          customValidators: ['errorValidator'],
        },
      };

      const fieldInstance = {
        id: 'test',
        expressionContextInfo: {},
      };

      // when
      const errors = validator.validateFieldInstance(fieldInstance, 'test');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Validation error occurred');
    });

    it('should support error objects with message and code', function () {
      // given
      const validator = createValidator();
      const validationRegistry = validator._validationRegistry;
      validationRegistry.register('structuredError', (context) => {
        if (!context.value) {
          return {
            message: 'Custom required message',
            code: 'custom.required',
            severity: 'error',
          };
        }
        return null;
      });

      const field = {
        id: 'test',
        type: 'textfield',
        validate: {
          customValidators: ['structuredError'],
        },
      };

      const fieldInstance = {
        id: 'test',
        expressionContextInfo: {},
      };

      // when
      const errors = validator.validateFieldInstance(fieldInstance, '');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Custom required message');
    });
  });

  describe('custom error messages', function () {
    it('should use custom required message', function () {
      // given
      const validator = createValidator();
      const field = {
        validate: {
          required: true,
          requiredMessage: 'This field cannot be empty',
        },
      };

      // when
      const errors = validator.validateField(field, '');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('This field cannot be empty');
    });

    it('should use custom min message', function () {
      // given
      const validator = createValidator();
      const field = {
        validate: {
          min: 10,
          minMessage: 'Value must be at least {min}',
        },
      };

      // when
      const errors = validator.validateField(field, 5);

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Value must be at least {min}');
    });

    it('should use custom email message', function () {
      // given
      const validator = createValidator();
      const field = {
        validate: {
          validationType: 'email',
          emailMessage: 'Please enter a valid email address',
        },
      };

      // when
      const errors = validator.validateField(field, 'invalid-email');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('Please enter a valid email address');
    });
  });

  describe('i18n support', function () {
    it('should use i18n for error messages when available', function () {
      // given
      const i18n = new I18n({
        locale: 'en',
        translations: {
          en: {
            'validation.required': 'This field is mandatory',
          },
        },
      });
      const validator = createValidator(i18n);
      const field = {
        validate: {
          required: true,
        },
      };

      // when
      const errors = validator.validateField(field, '');

      // then
      expect(errors).to.have.length(1);
      expect(errors[0]).to.equal('This field is mandatory');
    });
  });
});

// helpers //////////

function createValidator(i18n = null) {
  const eventBus = new EventBus();
  const expressionLanguage = new FeelExpressionLanguage(eventBus);

  const conditionChecker = {
    applyConditions() {},
    check() {},
  };

  const form = {
    _getState() {
      return {
        data: {},
        errors: {},
        initialData: {},
        properties: {},
      };
    },
  };

  const formFieldRegistry = {
    get(id) {
      return { id, type: 'textfield' };
    },
  };

  const validationRegistry = new ValidationRegistry();

  return new Validator(expressionLanguage, conditionChecker, form, formFieldRegistry, validationRegistry, i18n);
}
