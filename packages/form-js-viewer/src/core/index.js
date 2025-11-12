import { EventBus } from './EventBus';
import { Validator } from './Validator';
import { Importer } from './Importer';
import { FieldFactory } from './FieldFactory';
import { PathRegistry } from './PathRegistry';
import { FormLayouter } from './FormLayouter';
import { FormFieldRegistry } from './FormFieldRegistry';
import { FormFieldInstanceRegistry } from './FormFieldInstanceRegistry';
import { SchemaValidator } from './SchemaValidator';
import { ThemeManager } from './ThemeManager';
import { I18n } from './I18n';
import { ValidationRegistry } from './ValidationRegistry';
import { Analytics } from './Analytics';

import { RenderModule } from '../render';

export { Importer, FieldFactory, FormFieldRegistry, PathRegistry, FormLayouter, SchemaValidator, ThemeManager, I18n, ValidationRegistry, Analytics };

export const CoreModule = {
  __depends__: [RenderModule],
  eventBus: ['type', EventBus],
  importer: ['type', Importer],
  fieldFactory: ['type', FieldFactory],
  formFieldRegistry: ['type', FormFieldRegistry],
  formFieldInstanceRegistry: ['type', FormFieldInstanceRegistry],
  pathRegistry: ['type', PathRegistry],
  formLayouter: ['type', FormLayouter],
  validator: ['type', Validator],
  schemaValidator: ['type', SchemaValidator],
  themeManager: ['type', ThemeManager],
  i18n: ['type', I18n],
  validationRegistry: ['type', ValidationRegistry],
  analytics: ['type', Analytics],
};
