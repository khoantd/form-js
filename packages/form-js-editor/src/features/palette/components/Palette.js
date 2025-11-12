import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { useService } from '../../../render/hooks';
import { sanitizeImageSource } from '@bpmn-io/form-js-viewer';

import { CloseIcon, SearchIcon, iconsByType } from '../../../render/components/icons';
import { Slot } from '../../render-injection/slot-fill';
import { PaletteEntry } from './PaletteEntry';

/**
 * @typedef { import('@bpmn-io/form-js-viewer').FormFields } FormFields
 *
 * @typedef { {
 *  label: string,
 *  type: string,
 *  group: ('basic-input'|'selection'|'presentation'|'action'),
 *  icon: preact.FunctionalComponent,
 *  iconUrl: string
 * } } PaletteEntry
 */

export const PALETTE_GROUPS = [
  {
    label: 'Input',
    id: 'basic-input',
  },
  {
    label: 'Selection',
    id: 'selection',
  },
  {
    label: 'Presentation',
    id: 'presentation',
  },
  {
    label: 'Containers',
    id: 'container',
  },
  {
    label: 'Action',
    id: 'action',
  },
  {
    label: 'Custom',
    id: 'custom',
  },
];

export function Palette(props) {
  const formFields = useService('formFields');
  const pluginRegistry = useService('pluginRegistry', false);
  const customTypesPaletteProvider = useService('customTypesPaletteProvider', false);
  const eventBus = useService('eventBus', false);

  const initialPaletteEntries = useRef((() => {
    const entries = collectPaletteEntries(formFields, customTypesPaletteProvider);
    
    // Add plugin palette entries
    if (pluginRegistry) {
      const pluginEntries = pluginRegistry.getPaletteEntries();
      entries.push(...pluginEntries);
    }
    
    // Add custom types palette entries
    if (customTypesPaletteProvider) {
      const customEntries = customTypesPaletteProvider.getPaletteEntries();
      entries.push(...customEntries);
    }
    
    return entries;
  })());

  const [paletteEntries, setPaletteEntries] = useState(initialPaletteEntries.current);

  const [searchTerm, setSearchTerm] = useState('');

  /** @type {import("preact").RefObject<HTMLInputElement>} */
  const inputRef = useRef();

  const groups = groupEntries(paletteEntries);

  const simplifyString = useCallback((str) => {
    return str.toLowerCase().replace(/\s+/g, '');
  }, []);

  const filter = useCallback(
    (entry) => {
      const simplifiedSearchTerm = simplifyString(searchTerm);

      if (!simplifiedSearchTerm) {
        return true;
      }

      const simplifiedEntryLabel = simplifyString(entry.label);
      const simplifiedEntryType = simplifyString(entry.type);

      return simplifiedEntryLabel.includes(simplifiedSearchTerm) || simplifiedEntryType.includes(simplifiedSearchTerm);
    },
    [searchTerm, simplifyString],
  );

  // Update entries when custom types change
  useEffect(() => {
    if (!customTypesPaletteProvider || !eventBus) {
      return;
    }

    const handleCustomTypesChanged = () => {
      const entries = collectPaletteEntries(formFields, customTypesPaletteProvider);
      
      // Add plugin palette entries
      if (pluginRegistry) {
        const pluginEntries = pluginRegistry.getPaletteEntries();
        entries.push(...pluginEntries);
      }
      
      // Add custom types palette entries
      const customEntries = customTypesPaletteProvider.getPaletteEntries();
      entries.push(...customEntries);
      
      initialPaletteEntries.current = entries;
      setPaletteEntries(entries.filter(filter));
    };

    eventBus.on('customTypes.changed', handleCustomTypesChanged);
    return () => {
      eventBus.off('customTypes.changed', handleCustomTypesChanged);
    };
  }, [customTypesPaletteProvider, eventBus, formFields, pluginRegistry, filter]);

  // filter entries on search change
  useEffect(() => {
    const entries = initialPaletteEntries.current.filter(filter);
    setPaletteEntries(entries);
  }, [filter, searchTerm]);

  const handleInput = useCallback(
    (event) => {
      setSearchTerm(() => event.target.value);
    },
    [setSearchTerm],
  );

  const handleClear = useCallback(
    (event) => {
      setSearchTerm('');
      inputRef.current.focus();
    },
    [inputRef, setSearchTerm],
  );

  return (
    <div class="fjs-palette">
      <div class="fjs-palette-header" title="Components">
        Components
      </div>
      <div class="fjs-palette-search-container">
        <span class="fjs-palette-search-icon">
          <SearchIcon></SearchIcon>
        </span>
        <input
          class="fjs-palette-search"
          ref={inputRef}
          type="text"
          placeholder="Search components"
          value={searchTerm}
          onInput={handleInput}
        />
        {searchTerm && (
          <button type="button" title="Clear content" class="fjs-palette-search-clear" onClick={handleClear}>
            <CloseIcon></CloseIcon>
          </button>
        )}
      </div>
      <div class="fjs-palette-entries">
        {groups.map(({ label, entries, id }) => (
          <div class="fjs-palette-group" data-group-id={id} key={id}>
            <span class="fjs-palette-group-title">{label}</span>
            <div class="fjs-palette-fields fjs-drag-container fjs-no-drop">
              {entries.map((entry) => {
                return <PaletteEntry key={entry.type} getPaletteIcon={getPaletteIcon} {...entry} />;
              })}
            </div>
          </div>
        ))}
        {groups.length == 0 && <div class="fjs-palette-no-entries">No components found.</div>}
      </div>
      <div class="fjs-palette-footer">
        {/* @ts-ignore */}
        <Slot name="editor-palette__footer" fillRoot={FillRoot} />
      </div>
    </div>
  );
}

const FillRoot = (fill) => <div className="fjs-palette-footer-fill">{fill.children}</div>;

// helpers ///////

function groupEntries(entries) {
  const groups = PALETTE_GROUPS.map((group) => {
    return {
      ...group,
      entries: [],
    };
  });

  const getGroup = (id) => groups.find((group) => id === group.id);

  entries.forEach((entry) => {
    const { group } = entry;
    getGroup(group).entries.push(entry);
  });

  return groups.filter((g) => g.entries.length);
}

/**
 * Returns a list of palette entries.
 *
 * @param {FormFields} formFields
 * @param {CustomTypesPaletteProvider} [customTypesPaletteProvider] - Optional provider to exclude custom types from formFields
 * @returns {Array<PaletteEntry>}
 */
export function collectPaletteEntries(formFields, customTypesPaletteProvider = null) {
  // Get custom type types to exclude from formFields collection
  const customTypeTypes = customTypesPaletteProvider
    ? new Set(customTypesPaletteProvider.getPaletteEntries().map((entry) => entry.type))
    : new Set();

  return Object.entries(formFields._formFields)
    .map(([type, formField]) => {
      const { config: fieldConfig } = formField;

      return {
        // fieldConfig.label is used to maintain backwards compatibility with custom form fields
        label: fieldConfig.name || fieldConfig.label,
        type: type,
        group: fieldConfig.group,
        icon: fieldConfig.icon,
        iconUrl: fieldConfig.iconUrl,
      };
    })
    .filter(({ type }) => type !== 'default' && !customTypeTypes.has(type));
}

/**
 * There are various options to specify an icon for a palette entry.
 *
 * a) via `iconUrl` property in a form field config
 * b) via `icon` property in a form field config
 * c) via statically defined iconsByType (fallback)
 */
export function getPaletteIcon(entry) {
  const { icon, iconUrl, type, label } = entry;

  let Icon;

  if (iconUrl) {
    Icon = function Icon() {
      return (
        <img
          class="fjs-field-icon-image"
          width={36}
          style={{ margin: 'auto' }}
          alt={label}
          src={sanitizeImageSource(iconUrl)}
        />
      );
    };
  } else {
    Icon = icon || iconsByType(type);
  }

  return Icon;
}
