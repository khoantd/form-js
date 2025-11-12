import { formFieldClasses } from '../Util';
import { useSingleLineTemplateEvaluation } from '../../hooks';
import { useService } from '../../hooks/useService';

const type = 'button';

export function Button(props) {
  const { disabled, onFocus, onBlur, field } = props;

  const { action = 'submit' } = field;

  const i18n = useService('i18n', false);
  const localizedLabel = i18n ? i18n.localize(field.label) : field.label;
  const evaluatedLabel = useSingleLineTemplateEvaluation(localizedLabel || '', { debug: true });

  return (
    <div class={formFieldClasses(type)}>
      <button
        class="fjs-button"
        type={action}
        disabled={disabled}
        onFocus={() => onFocus && onFocus()}
        onBlur={() => onBlur && onBlur()}>
        {evaluatedLabel}
      </button>
    </div>
  );
}

Button.config = {
  type,
  keyed: false,
  name: 'Button',
  group: 'action',
  create: (options = {}) => ({
    label: 'Button',
    action: 'submit',
    ...options,
  }),
};
