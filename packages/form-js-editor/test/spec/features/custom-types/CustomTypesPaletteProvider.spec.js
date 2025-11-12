import { expect } from 'chai';
import { spy } from 'sinon';
import { createInjector } from 'didi';
import { EventBus } from '../../../../../src/core/EventBus';
import { FormFields } from '@bpmn-io/form-js-viewer';
import { CustomTypeRegistry } from '../../../../../src/features/custom-types/CustomTypeRegistry';
import { CustomTypesPaletteProvider } from '../../../../../src/features/custom-types/CustomTypesPaletteProvider';

describe('CustomTypesPaletteProvider', function () {
  let injector, eventBus, formFields, registry, provider;

  beforeEach(function () {
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

  describe('getPaletteEntries', function () {
    it('should return empty array when no custom types', function () {
      const entries = provider.getPaletteEntries();

      expect(entries).to.be.an('array').that.is.empty;
    });

    it('should return palette entries for custom types', function () {
      registry.create({
        name: 'Email Field',
        type: 'email-field',
        baseType: 'textfield',
        config: {},
      });

      const entries = provider.getPaletteEntries();

      expect(entries).to.have.length(1);
      expect(entries[0]).to.have.property('label', 'Email Field');
      expect(entries[0]).to.have.property('type', 'email-field');
      expect(entries[0]).to.have.property('group', 'custom');
    });

    it('should update entries when custom types change', function () {
      const initialEntries = provider.getPaletteEntries();
      expect(initialEntries).to.be.empty;

      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      const updatedEntries = provider.getPaletteEntries();
      expect(updatedEntries).to.have.length(1);
    });

    it('should include icon if provided', function () {
      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        icon: '✉',
        color: '#ff0000',
        config: {},
      });

      const entries = provider.getPaletteEntries();
      expect(entries[0].icon).to.be.a('function');
    });

    it('should handle multiple custom types', function () {
      registry.create({
        name: 'Type 1',
        type: 'type-1',
        baseType: 'textfield',
        config: {},
      });

      registry.create({
        name: 'Type 2',
        type: 'type-2',
        baseType: 'number',
        config: {},
      });

      const entries = provider.getPaletteEntries();

      expect(entries).to.have.length(2);
      expect(entries.map((e) => e.type)).to.include.members(['type-1', 'type-2']);
    });
  });

  describe('event handling', function () {
    it('should update entries on customTypes.changed event', function () {
      const entries1 = provider.getPaletteEntries();
      expect(entries1).to.be.empty;

      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      // Trigger change event manually
      eventBus.fire('customTypes.changed');

      const entries2 = provider.getPaletteEntries();
      expect(entries2).to.have.length(1);
    });
  });
});

