import { expect } from 'chai';
import { spy } from 'sinon';
import { createInjector } from 'didi';
import { EventBus } from '../../../../../src/core/EventBus';
import { FormFields } from '@bpmn-io/form-js-viewer';
import { CustomTypeRegistry } from '../../../../../src/features/custom-types/CustomTypeRegistry';

describe('CustomTypeRegistry', function () {
  let injector, eventBus, formFields, registry;

  beforeEach(function () {
    eventBus = new EventBus();
    formFields = new FormFields();

    injector = createInjector([
      { eventBus: ['value', eventBus] },
      { formFields: ['value', formFields] },
      { customTypeRegistry: ['type', CustomTypeRegistry] },
    ]);

    registry = injector.get('customTypeRegistry');
  });

  describe('create', function () {
    it('should create a custom type', function () {
      const definition = {
        name: 'Email Field',
        type: 'email-field',
        baseType: 'textfield',
        config: {
          label: 'Email',
          required: true,
        },
      };

      const result = registry.create(definition);

      expect(result).to.have.property('id');
      expect(result.name).to.equal('Email Field');
      expect(result.type).to.equal('email-field');
      expect(registry.has('email-field')).to.be.true;
    });

    it('should emit customTypes.added event', function () {
      const listener = spy();
      eventBus.on('customTypes.added', listener);

      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      expect(listener).to.have.been.calledOnce;
      expect(listener.getCall(0).args[0].type).to.have.property('type', 'test-type');
    });

    it('should emit customTypes.changed event', function () {
      const listener = spy();
      eventBus.on('customTypes.changed', listener);

      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      expect(listener).to.have.been.called;
    });

    it('should throw if type already exists', function () {
      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      expect(() => {
        registry.create({
          name: 'Test 2',
          type: 'test-type',
          baseType: 'textfield',
          config: {},
        });
      }).to.throw('already exists');
    });

    it('should throw if type conflicts with built-in', function () {
      expect(() => {
        registry.create({
          name: 'Test',
          type: 'textfield',
          baseType: 'textfield',
          config: {},
        });
      }).to.throw('conflicts with a built-in');
    });

    it('should throw if required fields are missing', function () {
      expect(() => {
        registry.create({
          name: 'Test',
          // missing type and baseType
          config: {},
        });
      }).to.throw('must include name, type, and baseType');
    });
  });

  describe('update', function () {
    it('should update an existing custom type', function () {
      const definition = registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: { label: 'Original' },
      });

      const updated = registry.update('test-type', {
        name: 'Updated Test',
        config: { label: 'Updated' },
      });

      expect(updated.name).to.equal('Updated Test');
      expect(updated.config.label).to.equal('Updated');
      expect(updated.type).to.equal('test-type'); // type should not change
      expect(updated.id).to.equal(definition.id); // id should not change
    });

    it('should emit customTypes.changed event', function () {
      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      const listener = spy();
      eventBus.on('customTypes.changed', listener);

      registry.update('test-type', { name: 'Updated' });

      expect(listener).to.have.been.called;
    });

    it('should throw if type does not exist', function () {
      expect(() => {
        registry.update('non-existent', { name: 'Test' });
      }).to.throw('not found');
    });
  });

  describe('delete', function () {
    it('should delete a custom type', function () {
      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      registry.delete('test-type');

      expect(registry.has('test-type')).to.be.false;
      expect(registry.get('test-type')).to.be.undefined;
    });

    it('should emit customTypes.removed event', function () {
      const definition = registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      const listener = spy();
      eventBus.on('customTypes.removed', listener);

      registry.delete('test-type');

      expect(listener).to.have.been.calledOnce;
      expect(listener.getCall(0).args[0].type).to.equal(definition);
    });

    it('should emit customTypes.changed event', function () {
      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      const listener = spy();
      eventBus.on('customTypes.changed', listener);

      registry.delete('test-type');

      expect(listener).to.have.been.called;
    });

    it('should not throw if type does not exist', function () {
      expect(() => {
        registry.delete('non-existent');
      }).to.not.throw();
    });
  });

  describe('list', function () {
    it('should return all custom types', function () {
      registry.create({
        name: 'Test 1',
        type: 'test-1',
        baseType: 'textfield',
        config: {},
      });

      registry.create({
        name: 'Test 2',
        type: 'test-2',
        baseType: 'number',
        config: {},
      });

      const types = registry.list();

      expect(types).to.have.length(2);
      expect(types.map((t) => t.type)).to.include.members(['test-1', 'test-2']);
    });

    it('should return empty array if no types', function () {
      expect(registry.list()).to.be.an('array').that.is.empty;
    });
  });

  describe('export/import', function () {
    it('should export custom types as JSON', function () {
      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: { label: 'Test Label' },
      });

      const json = registry.export();
      const parsed = JSON.parse(json);

      expect(parsed).to.be.an('array');
      expect(parsed[0]).to.have.property('type', 'test-type');
      expect(parsed[0]).to.have.property('name', 'Test');
    });

    it('should import custom types from JSON', function () {
      const json = JSON.stringify([
        {
          name: 'Imported',
          type: 'imported-type',
          baseType: 'textfield',
          config: { label: 'Imported Label' },
        },
      ]);

      registry.import(json);

      expect(registry.has('imported-type')).to.be.true;
      const imported = registry.get('imported-type');
      expect(imported.name).to.equal('Imported');
    });

    it('should replace existing types when merge is false', function () {
      registry.create({
        name: 'Original',
        type: 'original-type',
        baseType: 'textfield',
        config: {},
      });

      const json = JSON.stringify([
        {
          name: 'New',
          type: 'new-type',
          baseType: 'textfield',
          config: {},
        },
      ]);

      registry.import(json, false);

      expect(registry.has('original-type')).to.be.false;
      expect(registry.has('new-type')).to.be.true;
    });

    it('should merge with existing types when merge is true', function () {
      registry.create({
        name: 'Original',
        type: 'original-type',
        baseType: 'textfield',
        config: {},
      });

      const json = JSON.stringify([
        {
          name: 'New',
          type: 'new-type',
          baseType: 'textfield',
          config: {},
        },
      ]);

      registry.import(json, true);

      expect(registry.has('original-type')).to.be.true;
      expect(registry.has('new-type')).to.be.true;
    });

    it('should throw on invalid JSON', function () {
      expect(() => {
        registry.import('invalid json');
      }).to.throw('Invalid JSON');
    });

    it('should throw if imported data is not an array', function () {
      expect(() => {
        registry.import('{"not": "an array"}');
      }).to.throw('must be an array');
    });

    it('should emit customTypes.imported event', function () {
      const listener = spy();
      eventBus.on('customTypes.imported', listener);

      const json = JSON.stringify([
        {
          name: 'Test',
          type: 'test-type',
          baseType: 'textfield',
          config: {},
        },
      ]);

      registry.import(json);

      expect(listener).to.have.been.calledOnce;
      expect(listener.getCall(0).args[0].count).to.equal(1);
    });
  });

  describe('form lifecycle', function () {
    it('should re-register types on form.init', function () {
      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      // Simulate form.init
      eventBus.fire('form.init');

      // Type should still be registered with formFields
      const registeredType = formFields.get('test-type');
      expect(registeredType).to.exist;
    });

    it('should clean up on form.destroy', function () {
      registry.create({
        name: 'Test',
        type: 'test-type',
        baseType: 'textfield',
        config: {},
      });

      // Simulate form.destroy
      eventBus.fire('form.destroy');

      // Registry should still have the type (in-memory)
      expect(registry.has('test-type')).to.be.true;
    });
  });
});

