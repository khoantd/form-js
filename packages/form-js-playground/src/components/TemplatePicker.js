import { useState, useMemo } from 'preact/hooks';

import { Modal } from './Modal';
import { defaultTemplateRegistry } from '@bpmn-io/form-js-templates';

import './TemplatePicker.css';

/**
 * @typedef { {
 *   onSelect: (schema: any) => void;
 *   onClose: () => void;
 * } } TemplatePickerProps
 */

/**
 * Template Picker Component
 *
 * Displays available form templates and allows users to select one.
 *
 * @param {TemplatePickerProps} props
 */
export function TemplatePicker(props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = useMemo(() => defaultTemplateRegistry.getCategories(), []);

  const templates = useMemo(() => {
    return defaultTemplateRegistry.getTemplates({
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
    });
  }, [searchQuery, selectedCategory]);

  const handleSelect = (template) => {
    props.onSelect(template.schema);
    props.onClose();
  };

  return (
    <Modal name="Form Templates" onClose={props.onClose}>
      <div class="fjs-pgl-template-picker">
        <div class="fjs-pgl-template-picker-filters">
          <div class="fjs-pgl-template-picker-search">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.target.value)}
              class="fjs-pgl-template-picker-search-input"
            />
          </div>
          <div class="fjs-pgl-template-picker-categories">
            <button
              type="button"
              class={selectedCategory === '' ? 'fjs-pgl-template-picker-category active' : 'fjs-pgl-template-picker-category'}
              onClick={() => setSelectedCategory('')}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                class={selectedCategory === category ? 'fjs-pgl-template-picker-category active' : 'fjs-pgl-template-picker-category'}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {templates.length === 0 ? (
          <div class="fjs-pgl-template-picker-empty">
            <p>No templates found matching your search.</p>
          </div>
        ) : (
          <div class="fjs-pgl-template-picker-grid">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * Template Card Component
 *
 * Displays a single template card.
 *
 * @param { {
 *   template: any;
 *   onSelect: (template: any) => void;
 * } } props
 */
function TemplateCard(props) {
  const { template, onSelect } = props;

  const handleClick = () => {
    onSelect(template);
  };

  return (
    <div class="fjs-pgl-template-card" onClick={handleClick}>
      <div class="fjs-pgl-template-card-header">
        <h3 class="fjs-pgl-template-card-title">{template.name}</h3>
        <span class="fjs-pgl-template-card-category">{template.category}</span>
      </div>
      <p class="fjs-pgl-template-card-description">{template.description}</p>
      {template.tags && template.tags.length > 0 && (
        <div class="fjs-pgl-template-card-tags">
          {template.tags.slice(0, 3).map((tag) => (
            <span key={tag} class="fjs-pgl-template-card-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div class="fjs-pgl-template-card-footer">
        <button type="button" class="fjs-pgl-template-card-button">
          Use Template
        </button>
      </div>
    </div>
  );
}

