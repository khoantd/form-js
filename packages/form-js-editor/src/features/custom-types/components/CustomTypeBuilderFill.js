import { Fragment } from 'preact';
import { Fill } from '../../render-injection/slot-fill';
import { CustomTypeBuilderButton } from './CustomTypeBuilderButton';
import { CustomTypesImportExport } from './CustomTypesImportExport';

/**
 * Fill component that adds the custom type builder button and import/export to the palette footer.
 */
export function CustomTypeBuilderFill() {
  return (
    <Fill slot="editor-palette__footer" group="custom-types">
      <Fragment>
        <CustomTypeBuilderButton />
        <CustomTypesImportExport />
      </Fragment>
    </Fill>
  );
}

