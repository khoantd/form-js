import { useRef, useState, useCallback, useEffect } from 'preact/hooks';
import fileDrop from 'file-drops';

/**
 * FileUpload component with drag and drop support
 * 
 * @param {Object} props
 * @param {Function} props.onFileLoad - Callback when file is successfully loaded (receives parsed JSON)
 * @param {Function} props.onError - Callback when error occurs (receives Error object)
 * @param {string} [props.accept] - File types to accept (default: '.json')
 * @param {boolean} [props.showButton] - Whether to show upload button (default: true)
 */
export function FileUpload({ onFileLoad, onError, accept = '.json', showButton = true }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  const handleFile = useCallback((file) => {
    if (!file) {
      return;
    }

    // Validate file type
    if (accept && !file.name.toLowerCase().endsWith('.json')) {
      const err = new Error('Please upload a JSON file');
      setError(err);
      onError?.(err);
      return;
    }

    // Read file as text
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const contents = e.target.result;
        const json = JSON.parse(contents);
        setError(null);
        onFileLoad?.(json);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Invalid JSON file');
        setError(error);
        onError?.(error);
      }
    };

    reader.onerror = () => {
      const err = new Error('Failed to read file');
      setError(err);
      onError?.(err);
    };

    reader.readAsText(file);
  }, [onFileLoad, onError, accept]);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Set up drag and drop using file-drops
  useEffect(() => {
    const handleDrop = fileDrop('Drop a form file', (files) => {
      const file = files?.[0];
      if (file) {
        handleFile(file);
      }
    });

    document.addEventListener('dragover', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDrop);
    };
  }, [handleFile]);

  return (
    <div class="demo-file-upload">
      {showButton && (
        <button
          type="button"
          class="demo-button demo-button-primary"
          onClick={handleButtonClick}
          aria-label="Open a JSON form file"
        >
          Open form file
        </button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        class="demo-file-input"
        aria-label="Upload form file"
      />

      {error && (
        <div class="demo-error-message" role="alert">
          <span class="sr-only">Error: </span>{error.message}
        </div>
      )}
    </div>
  );
}

