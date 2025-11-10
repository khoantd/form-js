/**
 * Generate appropriate demo data for a form field based on its type and configuration
 *
 * @param {object} formField - The form field object
 * @returns {any} - Demo data value for the field, or undefined if no demo data should be generated
 */
export function generateDemoDataForField(formField) {
  const { type, key, label, values, validate = {}, defaultValue, subtype } = formField;

  // Skip non-keyed fields (text, html, button, spacer, separator, etc.)
  if (!key) {
    return undefined;
  }

  // If field has a defaultValue, use it
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  // Generate demo data based on field type
  switch (type) {
    case 'textfield': {
      // Generate contextually appropriate text based on key/label
      const lowerKey = (key || '').toLowerCase();
      const lowerLabel = (label || '').toLowerCase();

      // Email fields
      if (lowerKey.includes('email') || lowerLabel.includes('email')) {
        return 'john.doe@example.com';
      }

      // Phone fields
      if (lowerKey.includes('phone') || lowerLabel.includes('phone') || lowerKey.includes('tel')) {
        return '+1 (555) 123-4567';
      }

      // Name fields
      if (lowerKey.includes('name') || lowerLabel.includes('name')) {
        if (lowerKey.includes('first') || lowerLabel.includes('first')) {
          return 'John';
        }
        if (lowerKey.includes('last') || lowerLabel.includes('last')) {
          return 'Doe';
        }
        if (lowerKey.includes('full') || lowerLabel.includes('full')) {
          return 'John Doe';
        }
        return 'John Doe';
      }

      // Password fields
      if (lowerKey.includes('password') || lowerLabel.includes('password')) {
        return 'SecurePassword123!';
      }

      // URL fields
      if (lowerKey.includes('url') || lowerLabel.includes('url') || lowerKey.includes('website')) {
        return 'https://example.com';
      }

      // Subject fields
      if (lowerKey.includes('subject') || lowerLabel.includes('subject')) {
        return 'Sample Subject';
      }

      // Default textfield value
      return 'Sample text';
    }

    case 'textarea': {
      const lowerKey = (key || '').toLowerCase();
      const lowerLabel = (label || '').toLowerCase();

      // Message/description fields
      if (lowerKey.includes('message') || lowerLabel.includes('message')) {
        return 'This is a sample message. It demonstrates how the textarea field works with multiple lines of text.';
      }

      if (lowerKey.includes('description') || lowerLabel.includes('description')) {
        return 'This is a sample description that provides more details about the field.';
      }

      if (lowerKey.includes('comment') || lowerLabel.includes('comment')) {
        return 'This is a sample comment.';
      }

      // Default textarea value
      return 'Sample text area content';
    }

    case 'number': {
      // Generate a reasonable number based on context
      const lowerKey = (key || '').toLowerCase();
      const lowerLabel = (label || '').toLowerCase();

      if (lowerKey.includes('age') || lowerLabel.includes('age')) {
        return 30;
      }

      if (lowerKey.includes('amount') || lowerLabel.includes('amount') || lowerKey.includes('price') || lowerLabel.includes('price')) {
        return 100.50;
      }

      if (lowerKey.includes('quantity') || lowerLabel.includes('quantity') || lowerKey.includes('qty')) {
        return 1;
      }

      // Default number
      return 42;
    }

    case 'datetime': {
      // Generate a date based on subtype
      const now = new Date();
      
      if (subtype === 'date') {
        // Return date in YYYY-MM-DD format
        return now.toISOString().split('T')[0];
      }

      if (subtype === 'time') {
        // Return time in HH:mm format
        return now.toTimeString().slice(0, 5);
      }

      // Default: datetime
      return now.toISOString();
    }

    case 'select': {
      // Use first available value from values array
      if (Array.isArray(values) && values.length > 0) {
        const firstValue = values[0];
        // Handle both {label, value} objects and simple values
        return typeof firstValue === 'object' && firstValue !== null && 'value' in firstValue
          ? firstValue.value
          : firstValue;
      }
      return undefined;
    }

    case 'radio': {
      // Use first available value from values array
      if (Array.isArray(values) && values.length > 0) {
        const firstValue = values[0];
        return typeof firstValue === 'object' && firstValue !== null && 'value' in firstValue
          ? firstValue.value
          : firstValue;
      }
      return undefined;
    }

    case 'checkbox': {
      // Checkboxes default to false, but we can set to true for demo purposes
      // Check if it's a terms/agreement checkbox
      const lowerKey = (key || '').toLowerCase();
      const lowerLabel = (label || '').toLowerCase();
      
      if (lowerKey.includes('terms') || lowerLabel.includes('terms') || 
          lowerKey.includes('agree') || lowerLabel.includes('agree') ||
          lowerKey.includes('accept') || lowerLabel.includes('accept')) {
        return true;
      }

      // Default to false for other checkboxes
      return false;
    }

    case 'checklist': {
      // Return first value as selected for demo
      if (Array.isArray(values) && values.length > 0) {
        const firstValue = values[0];
        const value = typeof firstValue === 'object' && firstValue !== null && 'value' in firstValue
          ? firstValue.value
          : firstValue;
        return [value];
      }
      return [];
    }

    case 'taglist': {
      // Return a sample tag
      return ['sample'];
    }

    default:
      // For unknown types, return undefined (no demo data)
      return undefined;
  }
}

