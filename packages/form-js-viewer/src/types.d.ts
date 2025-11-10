import { Injector } from 'didi';

export type Module = any;
export type Schema = any;

export interface Data {
  [x: string]: any;
}

export interface Errors {
  [x: string]: string[];
}

export type FormProperty = 'readOnly' | 'disabled' | string;
export type FormEvent = 'submit' | 'changed' | string;

export interface FormProperties {
  [x: string]: any;
}

export interface FormOptions {
  additionalModules?: Module[];
  container?: Element | null | string;
  injector?: Injector;
  modules?: Module[];
  properties?: FormProperties;
  theme?: Theme | string;
}

export interface CreateFormOptions extends FormOptions {
  data?: Data;
  schema: Schema;
}

/**
 * Theme configuration object.
 */
export interface Theme {
  /**
   * CSS custom properties (variables) to apply.
   */
  variables?: Record<string, string>;
  /**
   * CSS classes to add to the container.
   */
  classes?: string[];
  /**
   * Inline styles to apply.
   */
  styles?: Record<string, string>;
}

/**
 * Theme preset definition.
 */
export interface ThemePreset {
  name: string;
  theme: Theme;
}

export { Injector };
