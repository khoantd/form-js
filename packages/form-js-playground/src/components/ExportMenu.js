import { useState, useRef, useEffect } from 'preact/hooks';
import classNames from 'classnames';

import './ExportMenu.css';

/**
 * Export menu component with dropdown for different export formats
 *
 * @param {object} props
 * @param {object} props.schema - The form schema to export
 * @param {object} props.data - The form data to export
 * @param {Function} props.onExportJSON - Callback for JSON export
 */
export function ExportMenu({ schema, data, onExportJSON }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef();
  const buttonRef = useRef();

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleExportJSON = () => {
    if (onExportJSON) {
      onExportJSON();
    }
    setIsOpen(false);
  };

  const handleExportCSV = async () => {
    try {
      const { exportToCSV } = await import('@bpmn-io/form-js-viewer');
      exportToCSV(schema, 'form.csv');
    } catch (error) {
      console.error('Failed to export to CSV:', error);
      alert('Failed to export to CSV. Please check the console for details.');
    }
    setIsOpen(false);
  };

  const handleExportDataCSV = async () => {
    try {
      const { exportDataToCSV } = await import('@bpmn-io/form-js-viewer');
      exportDataToCSV(data || {}, 'form-data.csv');
    } catch (error) {
      console.error('Failed to export data to CSV:', error);
      alert('Failed to export data to CSV. Please check the console for details.');
    }
    setIsOpen(false);
  };

  const handleExportPDF = async () => {
    try {
      const { exportToPDF } = await import('@bpmn-io/form-js-viewer');
      await exportToPDF(schema, 'form.pdf');
    } catch (error) {
      console.error('Failed to export to PDF:', error);
      alert('Failed to export to PDF. Please check the console for details.');
    }
    setIsOpen(false);
  };

  const handleExportDataPDF = async () => {
    try {
      const { exportDataToPDF } = await import('@bpmn-io/form-js-viewer');
      await exportDataToPDF(data || {}, schema, 'form-data.pdf');
    } catch (error) {
      console.error('Failed to export data to PDF:', error);
      alert('Failed to export data to PDF. Please check the console for details.');
    }
    setIsOpen(false);
  };

  return (
    <div class="fjs-pgl-export-menu">
      <button
        ref={buttonRef}
        type="button"
        class="fjs-pgl-button fjs-pgl-export-button"
        title="Export form"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Export
        <span class="fjs-pgl-export-arrow">▼</span>
      </button>
      {isOpen && (
        <div ref={menuRef} class="fjs-pgl-export-dropdown" role="menu">
          <div class="fjs-pgl-export-section">
            <div class="fjs-pgl-export-section-title">Export Schema</div>
            <button
              type="button"
              class="fjs-pgl-export-item"
              role="menuitem"
              onClick={handleExportJSON}
            >
              <span class="fjs-pgl-export-item-label">JSON</span>
              <span class="fjs-pgl-export-item-desc">Form definition</span>
            </button>
            <button
              type="button"
              class="fjs-pgl-export-item"
              role="menuitem"
              onClick={handleExportCSV}
            >
              <span class="fjs-pgl-export-item-label">CSV</span>
              <span class="fjs-pgl-export-item-desc">Form structure</span>
            </button>
            <button
              type="button"
              class="fjs-pgl-export-item"
              role="menuitem"
              onClick={handleExportPDF}
            >
              <span class="fjs-pgl-export-item-label">PDF</span>
              <span class="fjs-pgl-export-item-desc">Form documentation</span>
            </button>
          </div>
          {data && (
            <div class="fjs-pgl-export-section">
              <div class="fjs-pgl-export-section-title">Export Data</div>
              <button
                type="button"
                class="fjs-pgl-export-item"
                role="menuitem"
                onClick={handleExportDataCSV}
              >
                <span class="fjs-pgl-export-item-label">CSV</span>
                <span class="fjs-pgl-export-item-desc">Form data</span>
              </button>
              <button
                type="button"
                class="fjs-pgl-export-item"
                role="menuitem"
                onClick={handleExportDataPDF}
              >
                <span class="fjs-pgl-export-item-label">PDF</span>
                <span class="fjs-pgl-export-item-desc">Form data</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

