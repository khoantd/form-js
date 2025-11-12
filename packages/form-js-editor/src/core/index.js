import { Importer, PathRegistry, SchemaValidator, I18n, ThemeManager } from '@bpmn-io/form-js-viewer';

import { EventBus } from './EventBus';
import { DebounceFactory } from './Debounce';
import { FormFieldRegistry } from './FormFieldRegistry';
import { FormLayouter } from './FormLayouter';
import { FormLayoutValidator } from './FormLayoutValidator';
import { VersionControl } from './VersionControl';
import { EditorFieldFactory } from './EditorFieldFactory';

import { RenderModule } from '../render';
import { CustomTypesModule } from '../features/custom-types/CustomTypesModule';

export const CoreModule = {
  __depends__: [RenderModule, CustomTypesModule],
  debounce: ['factory', DebounceFactory],
  eventBus: ['type', EventBus],
  importer: ['type', Importer],
  formFieldRegistry: ['type', FormFieldRegistry],
  pathRegistry: ['type', PathRegistry],
  formLayouter: ['type', FormLayouter],
  formLayoutValidator: ['type', FormLayoutValidator],
  fieldFactory: ['type', EditorFieldFactory],
  schemaValidator: ['type', SchemaValidator],
  versionControl: ['type', VersionControl],
  i18n: ['type', I18n],
  themeManager: ['type', ThemeManager],
};
