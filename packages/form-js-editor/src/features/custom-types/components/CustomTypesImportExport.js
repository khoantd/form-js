import { useCallback, useRef } from 'preact/hooks';
import { useService } from '../../../render/hooks';

/**
 * Import/Export component for custom types.
 */
export function CustomTypesImportExport() {
  const customTypeRegistry = useService('customTypeRegistry', false);
  const fileInputRef = useRef(null);

  const handleExport = useCallback(() => {
    if (!customTypeRegistry) {
      return;
    }

    try {
      const json = customTypeRegistry.export();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'custom-types.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export custom types:', error);
      alert('Failed to export custom types: ' + error.message);
    }
  }, [customTypeRegistry]);

  const handleImport = useCallback(() => {
    if (!customTypeRegistry || !fileInputRef.current) {
      return;
    }

    fileInputRef.current.click();
  }, [customTypeRegistry]);

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file || !customTypeRegistry) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target.result;
          const merge = confirm('Merge with existing custom types? (Cancel to replace all)');
          customTypeRegistry.import(json, merge);
          alert('Custom types imported successfully');
        } catch (error) {
          console.error('Failed to import custom types:', error);
          alert('Failed to import custom types: ' + error.message);
        }
      };
      reader.readAsText(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [customTypeRegistry],
  );

  if (!customTypeRegistry) {
    return null;
  }

  return (
    <div class="fjs-custom-types-import-export">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button type="button" class="fjs-button-secondary fjs-button-small" onClick={handleImport} title="Import Custom Types">
        Import
      </button>
      <button type="button" class="fjs-button-secondary fjs-button-small" onClick={handleExport} title="Export Custom Types">
        Export
      </button>
    </div>
  );
}

