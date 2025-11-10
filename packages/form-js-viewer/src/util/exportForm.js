/**
 * @typedef { import('../types').Schema } Schema
 */

/**
 * Export form schema to CSV format
 *
 * @param {Schema} schema - The form schema to export
 * @param {string} [filename='form.csv'] - The filename for the exported file
 * @returns {void}
 */
export function exportToCSV(schema, filename = 'form.csv') {
  if (!schema || !schema.components) {
    throw new Error('Invalid schema: schema must have components');
  }

  const rows = [];
  const headers = ['Type', 'Key', 'Label', 'Description', 'Required', 'Default Value'];

  // Add header row
  rows.push(headers.join(','));

  // Recursively extract all components
  const extractComponents = (components, parentPath = '') => {
    if (!components || !Array.isArray(components)) {
      return;
    }

    components.forEach((component) => {
      const row = [];

      // Type
      row.push(escapeCSV(component.type || ''));

      // Key/Path
      const key = component.key || component.path || '';
      row.push(escapeCSV(parentPath ? `${parentPath}.${key}` : key));

      // Label
      row.push(escapeCSV(component.label || ''));

      // Description
      row.push(escapeCSV(component.description || ''));

      // Required
      const required = component.validate?.required || false;
      row.push(required ? 'Yes' : 'No');

      // Default Value
      const defaultValue = component.defaultValue;
      if (typeof defaultValue === 'object') {
        row.push(escapeCSV(JSON.stringify(defaultValue)));
      } else {
        row.push(escapeCSV(String(defaultValue || '')));
      }

      rows.push(row.join(','));

      // Recursively process nested components
      if (component.components) {
        const currentPath = parentPath ? `${parentPath}.${component.key || component.path || ''}` : (component.key || component.path || '');
        extractComponents(component.components, currentPath);
      }
    });
  };

  extractComponents(schema.components);

  // Create CSV content
  const csvContent = rows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV field value
 *
 * @param {string} value - The value to escape
 * @returns {string} - The escaped value
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Export form data to CSV format
 *
 * @param {object} data - The form data to export
 * @param {string} [filename='form-data.csv'] - The filename for the exported file
 * @returns {void}
 */
export function exportDataToCSV(data, filename = 'form-data.csv') {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data: data must be an object');
  }

  const rows = [];
  const headers = ['Field', 'Value'];
  rows.push(headers.join(','));

  // Flatten nested objects
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey));
        } else {
          flattened[newKey] = value;
        }
      }
    }

    return flattened;
  };

  const flattenedData = flattenObject(data);

  // Add data rows
  Object.entries(flattenedData).forEach(([key, value]) => {
    const row = [escapeCSV(key), escapeCSV(String(value))];
    rows.push(row.join(','));
  });

  // Create CSV content
  const csvContent = rows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export form schema to PDF format
 *
 * @param {Schema} schema - The form schema to export
 * @param {string} [filename='form.pdf'] - The filename for the exported file
 * @returns {Promise<void>}
 */
export async function exportToPDF(schema, filename = 'form.pdf') {
  if (!schema || !schema.components) {
    throw new Error('Invalid schema: schema must have components');
  }

  // Dynamically import jsPDF to avoid bundling it if not needed
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add text with word wrapping
  const addText = (text, x, y, maxWidth, fontSize = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    if (lines.length > 0) {
      doc.text(lines, x, y);
      // Calculate height: line height is approximately 1.2 * fontSize
      return lines.length * (fontSize * 1.2);
    }
    return fontSize * 1.2; // Return at least one line height
  };

  // Add title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  const title = schema.id || 'Form Schema';
  yPosition += addText(title, margin, yPosition, maxWidth, 16);

  // Add metadata
  yPosition += 5;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (schema.schemaVersion) {
    yPosition += addText(`Schema Version: ${schema.schemaVersion}`, margin, yPosition, maxWidth);
  }
  if (schema.executionPlatform) {
    yPosition += addText(`Execution Platform: ${schema.executionPlatform}`, margin, yPosition, maxWidth);
  }

  // Add components section
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  yPosition += addText('Form Components', margin, yPosition, maxWidth, 14);

  // Recursively render components
  const renderComponent = (component, indent = 0, parentPath = '') => {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition += 5;
    const xPosition = margin + indent * 10;

    // Component type and key
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    const key = component.key || component.path || '';
    const fullKey = parentPath ? `${parentPath}.${key}` : key;
    const componentHeader = `${component.type || 'Unknown'}${fullKey ? ` - ${fullKey}` : ''}`;
    yPosition += addText(componentHeader, xPosition, yPosition, maxWidth - indent * 10, 11);

    // Component details
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const details = [];

    if (component.label) {
      details.push(`Label: ${component.label}`);
    }
    if (component.description) {
      details.push(`Description: ${component.description}`);
    }
    if (component.validate?.required) {
      details.push('Required: Yes');
    }
    if (component.defaultValue !== undefined) {
      const defaultValue = typeof component.defaultValue === 'object'
        ? JSON.stringify(component.defaultValue)
        : String(component.defaultValue);
      details.push(`Default Value: ${defaultValue}`);
    }

    if (details.length > 0) {
      const detailsText = details.join(' | ');
      yPosition += addText(detailsText, xPosition + 5, yPosition, maxWidth - indent * 10 - 5, 9);
    }

    // Recursively render nested components
    if (component.components) {
      const currentPath = parentPath ? `${parentPath}.${component.key || component.path || ''}` : (component.key || component.path || '');
      component.components.forEach((nestedComponent) => {
        renderComponent(nestedComponent, indent + 1, currentPath);
      });
    }
  };

  schema.components.forEach((component) => {
    renderComponent(component);
  });

  // Save the PDF
  doc.save(filename);
}

/**
 * Export form data to PDF format
 *
 * @param {object} data - The form data to export
 * @param {Schema} [schema] - Optional schema for better formatting
 * @param {string} [filename='form-data.pdf'] - The filename for the exported file
 * @returns {Promise<void>}
 */
export async function exportDataToPDF(data, schema = null, filename = 'form-data.pdf') {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data: data must be an object');
  }

  // Dynamically import jsPDF to avoid bundling it if not needed
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add text with word wrapping
  const addText = (text, x, y, maxWidth, fontSize = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    if (lines.length > 0) {
      doc.text(lines, x, y);
      // Calculate height: line height is approximately 1.2 * fontSize
      return lines.length * (fontSize * 1.2);
    }
    return fontSize * 1.2; // Return at least one line height
  };

  // Add title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  yPosition += addText('Form Data', margin, yPosition, maxWidth, 16);

  // Flatten nested objects
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey));
        } else {
          flattened[newKey] = value;
        }
      }
    }

    return flattened;
  };

  const flattenedData = flattenObject(data);

  // Get field labels from schema if available
  const getFieldLabel = (key) => {
    if (!schema || !schema.components) {
      return key;
    }

    const findComponent = (components, searchKey) => {
      for (const component of components) {
        if ((component.key || component.path) === searchKey) {
          return component.label || key;
        }
        if (component.components) {
          const found = findComponent(component.components, searchKey);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    // Try exact match first
    let label = findComponent(schema.components, key);
    if (label) {
      return label;
    }

    // Try nested key (e.g., "parent.child")
    const parts = key.split('.');
    if (parts.length > 1) {
      label = findComponent(schema.components, parts[0]);
      if (label) {
        return `${label} - ${parts.slice(1).join('.')}`;
      }
    }

    return key;
  };

  // Add data rows
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  yPosition += addText('Data Fields', margin, yPosition, maxWidth, 12);

  Object.entries(flattenedData).forEach(([key, value]) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    const label = getFieldLabel(key);
    yPosition += addText(label, margin, yPosition, maxWidth, 10);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const valueText = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    yPosition += addText(valueText, margin + 5, yPosition, maxWidth - 5, 9);
  });

  // Save the PDF
  doc.save(filename);
}

