import { Text } from '@bpmn-io/form-js-viewer';
import { editorFormFieldClasses } from '../Util';
import { useService } from '../../hooks';

import { iconsByType } from '../icons';

export function EditorText(props) {
  const { type, text = '' } = props.field;

  const Icon = iconsByType('text');

  const templating = useService('templating');
  const expressionLanguage = useService('expressionLanguage');
  const i18n = useService('i18n', false);

  const emptyText = i18n ? i18n.t('editor.text.empty') : 'Text view is empty';
  const expressionText = i18n ? i18n.t('editor.text.expression') : 'Text view is populated by an expression';
  const templatedText = i18n ? i18n.t('editor.text.templated') : 'Text view is templated';

  if (!text || !text.trim()) {
    return (
      <div class={editorFormFieldClasses(type)}>
        <div class="fjs-form-field-placeholder">
          <Icon viewBox="0 0 54 54" />
          {emptyText}
        </div>
      </div>
    );
  }

  if (expressionLanguage.isExpression(text)) {
    return (
      <div class={editorFormFieldClasses(type)}>
        <div class="fjs-form-field-placeholder">
          <Icon viewBox="0 0 54 54" />
          {expressionText}
        </div>
      </div>
    );
  }

  if (templating.isTemplate(text)) {
    return (
      <div class={editorFormFieldClasses(type)}>
        <div class="fjs-form-field-placeholder">
          <Icon viewBox="0 0 54 54" />
          {templatedText}
        </div>
      </div>
    );
  }

  return <Text {...{ ...props, disableLinks: true }} />;
}

EditorText.config = Text.config;
