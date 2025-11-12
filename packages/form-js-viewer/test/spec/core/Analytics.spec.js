import { expect } from 'chai';
import { spy } from 'sinon';
import * as sinon from 'sinon';
import EventBus from 'diagram-js/lib/core/EventBus';
import { Analytics } from '../../../src/core/Analytics';
import { Form } from '../../../src/Form';

describe('Analytics', function () {
  let eventBus;
  let form;
  let analytics;
  let onEventSpy;

  beforeEach(function () {
    eventBus = new EventBus();
    onEventSpy = spy();

    // Create a minimal form mock
    form = {
      get: (service, strict = true) => {
        if (service === 'eventBus') {
          return eventBus;
        }
        if (service === 'formFieldRegistry') {
          return {
            get: (id) => {
              if (id === 'field1') {
                return { id: 'field1', key: 'field1', type: 'textfield' };
              }
              return null;
            },
          };
        }
        if (service === 'formFieldInstanceRegistry') {
          return {
            getAll: () => {
              return new Map([
                [
                  'instance1',
                  {
                    id: 'field1',
                    instanceId: 'instance1',
                    key: 'field1',
                    valuePath: ['field1'],
                    indexes: {},
                  },
                ],
              ]);
            },
            getAllKeyed: () => {
              return [
                {
                  id: 'field1',
                  instanceId: 'instance1',
                  key: 'field1',
                  valuePath: ['field1'],
                  indexes: {},
                },
              ];
            },
            get: (instanceId) => {
              if (instanceId === 'instance1') {
                return {
                  id: 'field1',
                  instanceId: 'instance1',
                  key: 'field1',
                  valuePath: ['field1'],
                  indexes: {},
                };
              }
              return null;
            },
          };
        }
        return null;
      },
    };

    analytics = new Analytics(eventBus, form, {
      enabled: true,
      trackFieldInteractions: true,
      trackFocusBlur: true,
      onEvent: onEventSpy,
    });
  });

  afterEach(function () {
    if (analytics) {
      analytics.disable();
    }
  });

  describe('#constructor', function () {
    it('should create analytics service', function () {
      expect(analytics).to.exist;
    });

    it('should start session on form.init', function () {
      // when
      eventBus.fire('form.init');

      // then
      const data = analytics.getData();
      expect(data.session).to.exist;
      expect(data.session.startTime).to.exist;
      expect(data.session.completed).to.be.false;
    });

    it('should not start session if disabled', function () {
      // given
      analytics.disable();
      analytics = new Analytics(eventBus, form, { enabled: false });

      // when
      eventBus.fire('form.init');

      // then
      const data = analytics.getData();
      expect(data.session).to.be.null;
    });
  });

  describe('#_startSession', function () {
    it('should create session with unique ID', function () {
      // when
      eventBus.fire('form.init');

      // then
      const data = analytics.getData();
      expect(data.session.sessionId).to.exist;
      expect(data.session.sessionId).to.match(/^session_/);
    });

    it('should emit session.started event', function () {
      // given
      const sessionStartedSpy = spy();
      eventBus.on('analytics.session.started', sessionStartedSpy);

      // when
      eventBus.fire('form.init');

      // then
      expect(sessionStartedSpy).to.have.been.calledOnce;
      expect(onEventSpy).to.have.been.calledWith('session.started', sinon.match.object);
    });
  });

  describe('#_endSession', function () {
    it('should end session on form.destroy', function () {
      // given
      eventBus.fire('form.init');
      const startTime = analytics.getData().session.startTime;

      // when
      eventBus.fire('form.destroy');

      // then
      const data = analytics.getData();
      expect(data.session.endTime).to.exist;
      expect(data.session.duration).to.be.a('number');
      expect(data.session.duration).to.be.greaterThan(0);
    });

    it('should emit session.ended event', function () {
      // given
      eventBus.fire('form.init');
      const sessionEndedSpy = spy();
      eventBus.on('analytics.session.ended', sessionEndedSpy);

      // when
      eventBus.fire('form.destroy');

      // then
      expect(sessionEndedSpy).to.have.been.calledOnce;
    });
  });

  describe('#_trackFieldChange', function () {
    beforeEach(function () {
      eventBus.fire('form.init');
    });

    it('should track field value changes', function () {
      // when
      eventBus.fire('field.updated', {
        fieldInstance: {
          id: 'field1',
          valuePath: ['field1'],
          indexes: {},
        },
        value: 'new value',
      });

      // then
      const data = analytics.getData();
      expect(data.session.fieldChanges).to.equal(1);
      expect(data.fields).to.have.length(1);
      expect(data.fields[0].changeCount).to.equal(1);
      expect(data.fields[0].fieldId).to.equal('field1');
    });

    it('should track multiple field changes', function () {
      // when
      eventBus.fire('field.updated', {
        fieldInstance: { id: 'field1', valuePath: ['field1'], indexes: {} },
        value: 'value1',
      });
      eventBus.fire('field.updated', {
        fieldInstance: { id: 'field1', valuePath: ['field1'], indexes: {} },
        value: 'value2',
      });

      // then
      const data = analytics.getData();
      expect(data.session.fieldChanges).to.equal(2);
      expect(data.fields[0].changeCount).to.equal(2);
    });

    it('should emit field.changed event', function () {
      // given
      const fieldChangedSpy = spy();
      eventBus.on('analytics.field.changed', fieldChangedSpy);

      // when
      eventBus.fire('field.updated', {
        fieldInstance: { id: 'field1', valuePath: ['field1'], indexes: {} },
        value: 'new value',
      });

      // then
      expect(fieldChangedSpy).to.have.been.calledOnce;
      expect(onEventSpy).to.have.been.calledWith('field.changed', sinon.match.object);
    });
  });

  describe('#_trackFieldFocus', function () {
    beforeEach(function () {
      eventBus.fire('form.init');
    });

    it('should track field focus events', function () {
      // when
      eventBus.fire('formField.focus', {
        formField: { id: 'field1', key: 'field1', type: 'textfield' },
      });

      // then
      const data = analytics.getData();
      expect(data.fields).to.have.length(1);
      expect(data.fields[0].focusCount).to.equal(1);
    });

    it('should emit field.focused event', function () {
      // given
      const fieldFocusedSpy = spy();
      eventBus.on('analytics.field.focused', fieldFocusedSpy);

      // when
      eventBus.fire('formField.focus', {
        formField: { id: 'field1', key: 'field1', type: 'textfield' },
      });

      // then
      expect(fieldFocusedSpy).to.have.been.calledOnce;
    });
  });

  describe('#_trackFieldBlur', function () {
    beforeEach(function () {
      eventBus.fire('form.init');
    });

    it('should track field blur events', function () {
      // when
      eventBus.fire('formField.blur', {
        formField: { id: 'field1', key: 'field1', type: 'textfield' },
      });

      // then
      const data = analytics.getData();
      expect(data.fields).to.have.length(1);
      expect(data.fields[0].blurCount).to.equal(1);
    });
  });

  describe('#_trackPresubmit', function () {
    beforeEach(function () {
      eventBus.fire('form.init');
    });

    it('should track submission attempts', function () {
      // when
      eventBus.fire('presubmit');

      // then
      const data = analytics.getData();
      expect(data.session.submissionAttempts).to.equal(1);
    });

    it('should track multiple submission attempts', function () {
      // when
      eventBus.fire('presubmit');
      eventBus.fire('presubmit');

      // then
      const data = analytics.getData();
      expect(data.session.submissionAttempts).to.equal(2);
    });

    it('should emit submission.attempted event', function () {
      // given
      const submissionAttemptedSpy = spy();
      eventBus.on('analytics.submission.attempted', submissionAttemptedSpy);

      // when
      eventBus.fire('presubmit');

      // then
      expect(submissionAttemptedSpy).to.have.been.calledOnce;
    });
  });

  describe('#_trackSubmit', function () {
    beforeEach(function () {
      eventBus.fire('form.init');
    });

    it('should track successful submission', function () {
      // when
      eventBus.fire('submit', {
        data: { field1: 'value' },
        errors: {},
        files: new Map(),
      });

      // then
      const data = analytics.getData();
      expect(data.session.completed).to.be.true;
      expect(data.submissions).to.have.length(1);
      expect(data.submissions[0].successful).to.be.true;
    });

    it('should track failed submission', function () {
      // when
      eventBus.fire('submit', {
        data: { field1: 'value' },
        errors: { field1: ['Error message'] },
        files: new Map(),
      });

      // then
      const data = analytics.getData();
      expect(data.session.completed).to.be.false;
      expect(data.submissions).to.have.length(1);
      expect(data.submissions[0].successful).to.be.false;
      expect(data.submissions[0].errorCount).to.equal(1);
    });

    it('should emit submission.completed event', function () {
      // given
      const submissionCompletedSpy = spy();
      eventBus.on('analytics.submission.completed', submissionCompletedSpy);

      // when
      eventBus.fire('submit', {
        data: { field1: 'value' },
        errors: {},
        files: new Map(),
      });

      // then
      expect(submissionCompletedSpy).to.have.been.calledOnce;
    });
  });

  describe('#_trackValidationErrors', function () {
    beforeEach(function () {
      eventBus.fire('form.init');
    });

    it('should track validation errors', function () {
      // when
      eventBus.fire('changed', {
        errors: {
          field1: ['Error 1', 'Error 2'],
        },
      });

      // then
      const data = analytics.getData();
      expect(data.session.validationErrors).to.equal(2);
    });

    it('should update field error counts', function () {
      // given
      eventBus.fire('field.updated', {
        fieldInstance: { id: 'field1', valuePath: ['field1'], indexes: {} },
        value: 'value',
      });

      // when
      eventBus.fire('changed', {
        errors: {
          field1: ['Error 1'],
        },
      });

      // then
      const data = analytics.getData();
      expect(data.fields[0].errorCount).to.equal(1);
    });
  });

  describe('#getData', function () {
    beforeEach(function () {
      eventBus.fire('form.init');
    });

    it('should return analytics data', function () {
      // when
      const data = analytics.getData();

      // then
      expect(data).to.have.property('session');
      expect(data).to.have.property('fields');
      expect(data).to.have.property('submissions');
      expect(data).to.have.property('summary');
    });

    it('should include summary statistics', function () {
      // given
      eventBus.fire('field.updated', {
        fieldInstance: { id: 'field1', valuePath: ['field1'], indexes: {} },
        value: 'value',
      });
      eventBus.fire('submit', {
        data: { field1: 'value' },
        errors: {},
        files: new Map(),
      });

      // when
      const data = analytics.getData();

      // then
      expect(data.summary).to.exist;
      expect(data.summary.totalSessions).to.equal(1);
      expect(data.summary.completionRate).to.equal(100);
      expect(data.summary.mostChangedFields).to.be.an('array');
    });
  });

  describe('#reset', function () {
    beforeEach(function () {
      eventBus.fire('form.init');
      eventBus.fire('field.updated', {
        fieldInstance: { id: 'field1', valuePath: ['field1'], indexes: {} },
        value: 'value',
      });
    });

    it('should reset analytics data', function () {
      // given
      const dataBefore = analytics.getData();
      expect(dataBefore.session).to.exist;
      expect(dataBefore.fields).to.have.length(1);

      // when
      analytics.reset();

      // then
      const dataAfter = analytics.getData();
      expect(dataAfter.session).to.be.null;
      expect(dataAfter.fields).to.have.length(0);
    });
  });

  describe('#enable / #disable', function () {
    it('should enable analytics', function () {
      // given
      analytics.disable();

      // when
      analytics.enable();

      // then
      eventBus.fire('form.init');
      const data = analytics.getData();
      expect(data.session).to.exist;
    });

    it('should disable analytics', function () {
      // given
      eventBus.fire('form.init');

      // when
      analytics.disable();

      // then
      eventBus.fire('field.updated', {
        fieldInstance: { id: 'field1', valuePath: ['field1'], indexes: {} },
        value: 'value',
      });

      const data = analytics.getData();
      // Session should still exist but no new tracking
      expect(data.session).to.exist;
    });
  });

  describe('options', function () {
    it('should respect trackFieldInteractions option', function () {
      // given
      analytics.disable();
      analytics = new Analytics(eventBus, form, {
        enabled: true,
        trackFieldInteractions: false,
      });
      eventBus.fire('form.init');

      // when
      eventBus.fire('field.updated', {
        fieldInstance: { id: 'field1', valuePath: ['field1'], indexes: {} },
        value: 'value',
      });

      // then
      const data = analytics.getData();
      expect(data.session.fieldChanges).to.equal(0);
    });

    it('should respect trackFocusBlur option', function () {
      // given
      analytics.disable();
      analytics = new Analytics(eventBus, form, {
        enabled: true,
        trackFocusBlur: false,
      });
      eventBus.fire('form.init');

      // when
      eventBus.fire('formField.focus', {
        formField: { id: 'field1', key: 'field1', type: 'textfield' },
      });

      // then
      const data = analytics.getData();
      expect(data.fields).to.have.length(0);
    });
  });
});

