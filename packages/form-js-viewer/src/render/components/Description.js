import { useSingleLineTemplateEvaluation } from '../hooks';
import { useService } from '../hooks/useService';

export function Description(props) {
  const { description, id } = props;

  const i18n = useService && useService('i18n', false);
  const localized = i18n ? i18n.localize(description) : description;

  const evaluatedDescription = useSingleLineTemplateEvaluation(localized || '', { debug: true });

  if (!evaluatedDescription) {
    return null;
  }

  return (
    <div id={id} class="fjs-form-field-description">
      {evaluatedDescription}
    </div>
  );
}
