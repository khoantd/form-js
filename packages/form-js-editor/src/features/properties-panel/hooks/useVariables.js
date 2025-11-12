import { getSchemaVariables } from '@bpmn-io/form-js-viewer';
import { useService } from './usePropertiesPanelService';

/**
 * Retrieve list of variables from the form schema.
 *
 * @returns { string[] } list of variables used in form schema
 */
export function useVariables() {
  const form = useService('formEditor');
  
  // Guard against undefined form editor
  if (!form || typeof form.getSchema !== 'function') {
    return [];
  }
  
  try {
    const schema = form.getSchema();
    
    // Guard against undefined/null schema
    if (!schema) {
      return [];
    }
    
    return getSchemaVariables(schema);
  } catch (error) {
    console.error('Error getting schema variables:', error);
    return [];
  }
}
