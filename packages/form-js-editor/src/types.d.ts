import { Injector } from 'didi';
import { Theme } from '@bpmn-io/form-js-viewer/dist/types/types';

export type Module = any;
export type Schema = any;

export interface FormEditorProperties {
  [x: string]: any;
}

export interface FormEditorOptions {
  additionalModules?: Module[];
  container?: Element | null | string;
  exporter?: {
    name: string;
    version: string;
  };
  injector?: Injector;
  modules?: Module[];
  plugins?: Array<any>;
  properties?: FormEditorProperties;
  theme?: Theme | string;
  [x: string]: any;
}

export interface CreateFormEditorOptions extends FormEditorOptions {
  schema?: Schema;
}

export { Injector };
