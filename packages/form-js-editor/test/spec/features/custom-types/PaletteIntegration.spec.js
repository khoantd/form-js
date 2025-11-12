import { render, fireEvent, waitFor } from '@testing-library/preact/pure';
import { expect } from 'chai';
import { createInjector } from 'didi';
import { EventBus } from '../../../../../src/core/EventBus';
import { FormFields } from '@bpmn-io/form-js-viewer';
import { CustomTypeRegistry } from '../../../../../src/features/custom-types/CustomTypeRegistry';
import { CustomTypesPaletteProvider } from '../../../../../src/features/custom-types/CustomTypesPaletteProvider';
import { Palette } from '../../../../../src/features/palette/components/Palette';
import { MockEditorContext } from '../../../helper';
import { insertStyles } from '../../../TestHelper';

insertStyles();

describe('Custom Types - Palette Integration', function () {
  let parent, container, injector, eventBus, formFields, registry, provider;

  beforeEach(function () {
    parent = document.createElement('div');
    parent.classList.add('fjs-container', 'fjs-editor-container');

    container = document.createElement('div');
    container.classList.add('fjs-palette-container');
    container.style.position = 'absolute';
    container.style.left = '0';

    parent.appendChild(container);
    document.body.appendChild(parent);

    eventBus = new EventBus();
    formFields = new FormFields();

    injector = createInjector([
      { eventBus: ['value', eventBus] },
      { formFields: ['value', formFields] },
      { customTypeRegistry: ['type', CustomTypeRegistry] },
      { customTypesPaletteProvider: ['type', CustomTypesPaletteProvider] },
    ]);

    registry = injector.get('customTypeRegistry');
    provider = injector.get('customTypesPaletteProvider');
  });

  afterEach(function () {
    document.body.removeChild(parent);
  });

  it('should display custom types in palette', async function () {
    // given
    registry.create({
      name: 'Email Field',
      type: 'email-field',
      baseType: 'textfield',
      config: {},
    });

    const services = {
      formFields,
      customTypesPaletteProvider: provider,
      eventBus,
    };

    // when
    const result = render(
      <MockEditorContext options={{}} services={services}>
        <Palette />
      </MockEditorContext>,
      container,
    );

    // then
    await waitFor(() => {
      const customGroup = result.container.querySelector('[data-group-id="custom"]');
      expect(customGroup).to.exist;

      const emailField = result.container.querySelector('[data-field-type="email-field"]');
      expect(emailField).to.exist;
      expect(emailField.textContent).to.include('Email Field');
    });
  });

  it('should update palette when custom type is added', async function () {
    // given
    const services = {
      formFields,
      customTypesPaletteProvider: provider,
      eventBus,
    };

    const result = render(
      <MockEditorContext options={{}} services={services}>
        <Palette />
      </MockEditorContext>,
      container,
    );

    // initially no custom group
    expect(result.container.querySelector('[data-group-id="custom"]')).to.not.exist;

    // when
    registry.create({
      name: 'New Type',
      type: 'new-type',
      baseType: 'textfield',
      config: {},
    });

    // then
    await waitFor(() => {
      const customGroup = result.container.querySelector('[data-group-id="custom"]');
      expect(customGroup).to.exist;

      const newTypeField = result.container.querySelector('[data-field-type="new-type"]');
      expect(newTypeField).to.exist;
    });
  });

  it('should search custom types', async function () {
    // given
    registry.create({
      name: 'Email Field',
      type: 'email-field',
      baseType: 'textfield',
      config: {},
    });

    registry.create({
      name: 'Phone Field',
      type: 'phone-field',
      baseType: 'textfield',
      config: {},
    });

    const services = {
      formFields,
      customTypesPaletteProvider: provider,
      eventBus,
    };

    const result = render(
      <MockEditorContext options={{}} services={services}>
        <Palette />
      </MockEditorContext>,
      container,
    );

    const search = result.container.querySelector('.fjs-palette-search');

    // when
    fireEvent.input(search, { target: { value: 'email' } });

    // then
    await waitFor(() => {
      const emailField = result.container.querySelector('[data-field-type="email-field"]');
      const phoneField = result.container.querySelector('[data-field-type="phone-field"]');

      expect(emailField).to.exist;
      expect(phoneField).to.not.exist;
    });
  });
});

