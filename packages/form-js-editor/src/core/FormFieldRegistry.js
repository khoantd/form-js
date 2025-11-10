import { FormFieldRegistry as BaseFieldRegistry } from '@bpmn-io/form-js-viewer';

export class FormFieldRegistry extends BaseFieldRegistry {
  constructor(eventBus) {
    super(eventBus);

    // Track parent-child relationships as object graph
    this._parentChildMap = new WeakMap();
  }

  /**
   * Adds a form field to the registry and establishes parent-child relationships.
   *
   * @param {Object} formField
   */
  add(formField) {
    super.add(formField);

    // Establish parent-child relationship if parent exists
    if (formField._parent) {
      const parent = this.get(formField._parent);
      if (parent) {
        this._setParent(formField, parent);
      }
    }

    // Establish relationships for children
    if ('components' in formField && Array.isArray(formField.components)) {
      for (const component of formField.components) {
        this._setParent(component, formField);
      }
    }
  }

  /**
   * Removes a form field from the registry and cleans up parent-child relationships.
   *
   * @param {Object} formField
   */
  remove(formField) {
    // Clean up parent-child relationships for children
    if ('components' in formField && Array.isArray(formField.components)) {
      for (const component of formField.components) {
        this._clearParent(component);
      }
    }

    // Clean up this field's parent relationship
    this._clearParent(formField);

    super.remove(formField);
  }

  /**
   * Updates a form fields id.
   *
   * @param {Object} formField
   * @param {string} newId
   */
  updateId(formField, newId) {
    this._validateId(newId);

    this._eventBus.fire('formField.updateId', {
      formField,
      newId: newId,
    });

    this.remove(formField);

    formField.id = newId;

    this.add(formField);

    // Update _parent string ID for children (for backward compatibility)
    // The _parentRef object reference is automatically maintained by add()
    if ('components' in formField && Array.isArray(formField.components)) {
      for (const component of formField.components) {
        component._parent = newId;
      }
    }
  }

  /**
   * Gets the parent form field for a given form field.
   *
   * @param {Object} formField
   * @returns {Object|null} The parent form field, or null if no parent exists
   */
  getParent(formField) {
    return this._parentChildMap.get(formField) || null;
  }

  /**
   * Gets all child form fields for a given form field.
   *
   * @param {Object} formField
   * @returns {Array<Object>} Array of child form fields
   */
  getChildren(formField) {
    if (!('components' in formField) || !Array.isArray(formField.components)) {
      return [];
    }

    return formField.components.filter((component) => {
      const parent = this.getParent(component);
      return parent === formField;
    });
  }

  /**
   * Sets the parent-child relationship between two form fields.
   *
   * @param {Object} child - The child form field
   * @param {Object} parent - The parent form field
   * @private
   */
  _setParent(child, parent) {
    this._parentChildMap.set(child, parent);
    // Maintain backward compatibility with _parent string ID
    if (!child._parent || child._parent !== parent.id) {
      child._parent = parent.id;
    }
  }

  /**
   * Updates the parent-child relationship for a form field that's already in the registry.
   * This is useful when moving fields without removing/re-adding them.
   *
   * @param {Object} child - The child form field
   * @param {Object} parent - The new parent form field
   */
  updateParent(child, parent) {
    if (!this.get(child.id)) {
      throw new Error('formField must be in registry before updating parent');
    }
    this._setParent(child, parent);
  }

  /**
   * Clears the parent-child relationship for a form field.
   *
   * @param {Object} formField
   * @private
   */
  _clearParent(formField) {
    this._parentChildMap.delete(formField);
  }

  /**
   * Clears all form fields and relationships.
   */
  clear() {
    this._parentChildMap = new WeakMap();
    super.clear();
  }

  /**
   * Validate the suitability of the given id and signals a problem
   * with an exception.
   *
   * @param {string} id
   *
   * @throws {Error} if id is empty or already assigned
   */
  _validateId(id) {
    if (!id) {
      throw new Error('formField must have an id');
    }

    if (this.get(id)) {
      throw new Error('formField with id ' + id + ' already added');
    }
  }
}
