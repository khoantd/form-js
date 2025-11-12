import classNames from 'classnames';

import { useSingleLineTemplateEvaluation } from '../hooks';
import { useService } from '../hooks/useService';

/**
 * @typedef Props
 * @property {string|undefined} [id]
 * @property {string|undefined} [htmlFor]
 * @property {string|undefined} label
 * @property {string} [class]
 * @property {boolean} [collapseOnEmpty]
 * @property {boolean} [required]
 * @property {import("preact").VNode} [children]
 *
 * @param {Props} props
 * @returns {import("preact").JSX.Element}
 */
export function Label(props) {
  const { id, htmlFor, label, collapseOnEmpty = true, required = false } = props;

  const i18n = useService && useService('i18n', false);
  const localized = i18n ? i18n.localize(label) : label;

  const evaluatedLabel = useSingleLineTemplateEvaluation(localized || '', { debug: true });

  return (
    <label
      id={id}
      htmlFor={htmlFor}
      class={classNames('fjs-form-field-label', { 'fjs-incollapsible-label': !collapseOnEmpty }, props['class'])}>
      {props.children}
      {evaluatedLabel}
      {required && (
        <span class="fjs-asterix" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}
