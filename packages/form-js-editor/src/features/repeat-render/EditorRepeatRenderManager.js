import RepeatSvg from '../../render/components/icons/Repeat.svg';

export class EditorRepeatRenderManager {
  constructor(formFields, formFieldRegistry) {
    this._formFields = formFields;
    this._formFieldRegistry = formFieldRegistry;
    this.RepeatFooter = this.RepeatFooter.bind(this);
  }

  /**
   * Checks whether a field should be repeatable.
   *
   * @param {string} id - The id of the field to check
   * @returns {boolean} - True if repeatable, false otherwise
   */
  isFieldRepeating(id) {
    if (!id) {
      return false;
    }

    const formField = this._formFieldRegistry.get(id);
    
    // Guard against undefined formField (e.g., when field import failed)
    if (!formField || !formField.type) {
      return false;
    }

    const formFieldDefinition = this._formFields.get(formField.type);
    
    // Guard against undefined formFieldDefinition (e.g., when custom type not registered)
    if (!formFieldDefinition || !formFieldDefinition.config) {
      return false;
    }

    return formFieldDefinition.config.repeatable && formField.isRepeating;
  }

  RepeatFooter() {
    return (
      <div className="fjs-repeat-render-footer">
        <RepeatSvg />
        <span>Repeatable</span>
      </div>
    );
  }
}

EditorRepeatRenderManager.$inject = ['formFields', 'formFieldRegistry'];
