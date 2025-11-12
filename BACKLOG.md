# Form-JS Backlog

This file tracks planned features, improvements, and technical debt for the form-js project.

## High Priority

### Core Functionality
- [x] **Catch broken schema errors during import** - Add proper error handling and validation when importing schemas in both viewer and editor
  - Related: `packages/form-js-viewer/src/core/Importer.js`, `packages/form-js-editor/test/spec/import/Importer.spec.js`
  - ✅ Implemented: Added `SchemaValidator` class with JSON schema validation, integrated into `Importer.importSchema()` with proper error handling
- [x] **Add warnings for schema import issues** - Log warnings when schema validation fails or when sanitization removes content
  - Related: `packages/form-js-viewer/src/render/components/util/sanitizerUtil.js` (issues #289)
  - ✅ Implemented: Added warnings for non-critical validation errors and sanitization removals via EventBus events
- [x] **Improve variable extraction logic** - Update variable extraction to properly ignore certain keywords (e.g., `this`, `super`)
  - Related: `packages/form-js-viewer/test/spec/features/expression-language/variableExtractionHelpers.spec.js`
  - ✅ Implemented: Updated `variableExtractionHelpers.js` to ignore keywords: `this`, `super`, `item`

### Date/Time Support
- [ ] **Support dates prior to 1900 in datepicker** - Extend datepicker functionality to handle historical dates
  - Related: `packages/form-js-viewer/src/render/components/form-fields/parts/Datepicker.js` (issue #533)

## Medium Priority

### Editor Improvements
- [x] **Rework properties panel state management** - Optimize properties panel to avoid re-rendering the entire panel on every change
  - Related: `packages/form-js-editor/src/features/properties-panel/PropertiesPanel.js`
  - ✅ Implemented: Optimized state management using refs and granular updates, only re-renders when selection or selected field actually changes
- [x] **Create updater/change support for automatic path and schema updates** - Implement automatic path and schema updates when commands are executed
  - Related: Multiple command handlers in `packages/form-js-editor/src/features/modeling/cmd/`
  - ✅ Implemented: Created `SchemaUpdater` command interceptor that automatically updates schema state after command execution, eliminating manual `_setState` calls
- [x] **Make column options dependent on field type** - Update column entry to show relevant options based on selected field type
  - Related: `packages/form-js-editor/src/features/properties-panel/entries/ColumnsEntry.js`
  - ✅ Implemented: Column options now filter based on field type, hiding column options for non-column field types (groups, buttons, etc.)
- [x] **Implement multiselect equivalent for default value entry** - Add multiselect support for default values
  - Related: `packages/form-js-editor/src/features/properties-panel/entries/DefaultValueEntry.js` (issue #265)
  - ✅ Implemented: Added `DefaultValueMultiSelect` component with checkbox-based multiselect for taglist and checklist field types
- [x] **Refactor DOM delegation in FormEditor** - Replace current event handling with proper DOM delegation
  - Related: `packages/form-js-editor/src/render/components/FormEditor.js`
  - ✅ Implemented: Improved DOM delegation to properly handle clicks on form fields, ensuring clicks on nested elements don't trigger selection
- [x] **Mitigate dragula cursor position issues** - Fix cursor position problems when dragging form fields
  - Related: `packages/form-js-editor/src/render/components/FormEditor.js`
  - ✅ Implemented: Added cursor style preservation on dragged elements and drag preview to mitigate dragula cursor position issues

### Playground Improvements
- [x] **Add JSON parse error indication** - Show clear error messages when JSON parsing fails in playground
  - Related: `packages/form-js-playground/src/Playground.js`
  - ✅ Implemented: Added `ErrorNotification` component that displays JSON parse errors for both file drops and input data parsing, with auto-dismiss after 10 seconds and manual dismiss option
- [x] **Fix Section component null children error** - Fix TypeError when Section component receives null/falsy children from conditional rendering
  - Related: `packages/form-js-playground/src/components/Section.js`
  - ✅ Implemented: Added filter to remove null, undefined, and false values from children array before processing in reduce function, preventing "Cannot read properties of null (reading 'type')" error

### Core Architecture
- [x] **Make FormFieldRegistry a proper object graph** - Refactor registry to use proper object graph structure
  - Related: `packages/form-js-editor/src/core/FormFieldRegistry.js`
  - ✅ Implemented: Refactored `FormFieldRegistry` to maintain parent-child relationships using WeakMap-based object graph. Added `getParent()` and `getChildren()` methods. Updated all command handlers and utility functions to use object graph methods instead of string ID lookups. Parent-child relationships are automatically maintained when fields are added, removed, or moved.

## Low Priority

### Code Quality & Technical Debt
- [x] **Fix Rollup JSON import error** - Add `@rollup/plugin-json` plugin to handle JSON imports in UMD builds
  - Related: `packages/form-js/rollup.config.js`
  - ✅ Implemented: Added `@rollup/plugin-json` plugin to all UMD builds (editor, viewer, playground) to handle JSON schema imports
- [x] **Fix UMD code-splitting error** - Add `inlineDynamicImports: true` to UMD builds to support dynamic imports
  - Related: `packages/form-js/rollup.config.js`
  - ✅ Implemented: Added `inlineDynamicImports: true` to all UMD output configurations to prevent code-splitting errors
- [x] **Fix SASS compilation error with @carbon/grid** - Change from `@use` to `@import` for compatibility with legacy Carbon Grid package
  - Related: `packages/form-js-viewer/assets/grid.scss`
  - ✅ Implemented: Changed `@use '@carbon/grid'` to `@import '@carbon/grid'` for compatibility with legacy SASS import system
- [x] **Fix dependency injection error for schemaValidator** - Register `schemaValidator` service in editor's CoreModule
  - Related: `packages/form-js-editor/src/core/index.js`, `packages/form-js-viewer/src/core/index.js`, `packages/form-js-viewer/src/index.js`
  - ✅ Implemented: Exported `SchemaValidator` from viewer package and registered it in editor's CoreModule to fix DI error
- [x] **Remove workaround for moment/luxon issue** - Remove temporary workaround once upstream issue is resolved
  - Related: Multiple `rollup.config.js` files (issue #193)
  - ✅ Implemented: Removed CIRCULAR_DEPENDENCY warning suppression for luxon from all rollup config files. Verified builds complete successfully without warnings, confirming upstream issue is resolved.
- [x] **Implement mocking renderer for tests** - Add proper mocking support for renderer in tests
  - Related: `packages/form-js-viewer/test/spec/render/components/form-fields/Text.spec.js`
  - ✅ Implemented: Created `MockMarkdownRenderer` class in `packages/form-js-viewer/test/spec/render/components/helper/mocks/index.js` that allows overriding the markdown renderer in tests. Supports both custom render functions and default behavior. Fixed and enabled the skipped test in `Text.spec.js` with comprehensive examples.
- [ ] **Investigate duplicate event calls** - Fix issue where certain events are called twice
  - Related: `packages/form-js-editor/test/spec/FormEditor.spec.js`
- [ ] **Clean up FormEditor code** - Remove commented code and improve organization
  - Related: `packages/form-js-editor/src/render/components/FormEditor.js`
- [x] **Mitigate Carbon Design System cursor issue** - Address cursor position issue in Carbon styles
  - Related: `packages/form-js-carbon-styles/src/carbon-styles.js` (Carbon issue #13286)
  - ✅ Implemented: Added `pointer-events: none` to all disabled form fields and form elements to mitigate cursor position issues caused by Carbon Design System bug #13286. This prevents cursor interaction problems on disabled elements while maintaining proper visual feedback with `cursor: not-allowed`.

## Future Enhancements

### New Features
- [ ] **Enhanced validation system** - Improve validation with better error messages and custom validators
- [x] **Form templates library** - Provide pre-built form templates for common use cases
  - Related: `packages/form-js-templates/`
  - ✅ Implemented: Created `@bpmn-io/form-js-templates` package with 8 common form templates (contact, registration, survey, feedback, invoice, order, job application, event registration). Includes `TemplateRegistry` class for managing templates with search and category filtering. Integrated template picker UI into playground with modal interface for browsing and selecting templates. Templates are exported from main `form-js` package and accessible via `defaultTemplateRegistry`.
- [ ] **Advanced conditional logic** - Support complex conditional field visibility and validation rules
- [x] **Multi-language support** - Add i18n support for form labels and messages
  - Related: `packages/form-js-viewer/src/core/I18n.js`, `packages/form-js-viewer/src/core/index.js`, `packages/form-js-viewer/src/render/components/Label.js`, `packages/form-js-viewer/src/render/components/Description.js`, `packages/form-js-viewer/src/render/components/form-fields/parts/SimpleSelect.js`, `packages/form-js-editor/src/core/index.js`, `packages/form-js-viewer/src/index.js`
  - ✅ Implemented: Introduced lightweight `I18n` service with DI providing `localize(value)` and `t(key, params)` APIs. Registered as `i18n` in Viewer and Editor core modules and exported from the Viewer package. Viewer components now localize schema-provided strings:
    - `Label` and `Description` resolve localized values from either plain strings or `{ [locale]: string }` dictionaries before template evaluation.
    - `SimpleSelect` localizes the selected value, option labels, and the placeholder (via `t('select.placeholder')`, defaulting to "Select").
    Consumers can configure via options: `locale`, `fallbackLocale`, and `translations` (per-locale dictionaries). Existing schemas keep working unchanged; localization is opt-in by providing dictionaries or translations.
- [ ] **Form analytics** - Track form interactions and completion rates
- [x] **Export/Import improvements** - Support additional export formats (PDF, CSV, etc.)
  - Related: `packages/form-js-viewer/src/util/exportForm.js`, `packages/form-js-playground/src/components/ExportMenu.js`
  - ✅ Implemented: Added comprehensive export functionality with support for PDF and CSV formats. Created `exportForm.js` utility module with functions for exporting form schemas and data to CSV and PDF formats. Added `ExportMenu` component to playground with dropdown menu for selecting export formats. Supports exporting form schema as JSON, CSV, or PDF, and form data as CSV or PDF. Uses dynamic imports for jspdf to avoid bundling when not needed. Includes proper error handling and user feedback.
- [ ] **Accessibility enhancements** - Improve ARIA labels, keyboard navigation, and screen reader support
- [x] **Mobile optimization** - Optimize form rendering and interaction for mobile devices
  - Related: `packages/form-js-viewer/assets/`, `packages/form-js-viewer/src/render/`, `packages/form-js-editor/assets/`, `packages/form-js-editor/src/render/`, `packages/form-js-playground/src/`, `e2e/visual/`
  - ✅ Implemented: Mobile-first responsive styles and interaction tweaks across Viewer, Editor, and Playground. Introduced fluid layout and breakpoints, collapsing editor side panels on small viewports, larger touch targets (≥44px), improved focus states, inert/portal-safe overlays, safe-area handling (`env(safe-area-inset-*)`), `dvh`-based viewport sizing to avoid iOS address-bar jumps, debounced resize/viewport observers to reduce layout thrash, and momentum scrolling for long forms. Optimized typography scale and spacing for small screens, ensured form controls avoid zoom via `inputmode`/`type` where applicable, and refined drag-and-drop/tap handling for grouped fields. Added visual E2E checks for narrow widths to protect regressions.
- [ ] **Real-time collaboration** - Support multiple users editing forms simultaneously
- [x] **Version control** - Add form schema versioning and history tracking
  - Related: `packages/form-js-editor/src/core/VersionControl.js`, `packages/form-js-editor/src/core/index.js`
  - ✅ Implemented: Added in-memory `VersionControl` service for saving, listing, restoring, deleting, importing, and exporting schema/property versions. Integrates with `EventBus` to track dirty state via `changed` events and emits lifecycle events (`versionControl.saved`, `versionControl.restored`, `versionControl.deleted`, `versionControl.cleared`, `versionControl.imported`, `versionControl.exported`, `versionControl.dirty`). Registered as `versionControl` in the editor `CoreModule`, making it accessible via DI (`useService('versionControl')`). Designed for external persistence by exporting/importing history payloads. No UI added to avoid breaking changes; consumers can build on top via plugins or the playground.
- [ ] **Custom field types** - Allow users to define and register custom field types
  - Related: `packages/form-js-viewer/src/Form.js`, `packages/form-js-editor/src/FormEditor.js`, `packages/form-js-viewer/src/core/SchemaValidator.js`
  - ✅ Implemented: Added first-class custom field type support. Consumers can pass `customFormFieldTypes` in both Viewer (`Form`) and Editor (`FormEditor`) options to auto-register new types, or call `registerFormFieldType(type, impl)` at runtime. Validation now accepts custom types via `config.customFieldTypes` which are merged into the schema’s type enum at compile-time in `SchemaValidator`, keeping existing rules intact. Editor plugins already support `getFormFieldTypes()`, now wired to coexist with option-based registration.
- [x] **Form builder plugins** - Plugin system for extending form builder functionality
  - Related: `packages/form-js-editor/src/features/plugins/`
  - ✅ Implemented: Created comprehensive plugin system with `Plugin` base class, `PluginRegistry`, and `PluginIntegration`. Supports extending editor via custom modules, command handlers, palette entries, properties panel providers, form field types, and event hooks. Integrated into `FormEditor` with automatic module registration. Includes example plugins demonstrating different extension points. Full documentation and TypeScript support included.
- [ ] **Performance optimizations** - Optimize rendering for large forms with many fields
- [ ] **Undo/Redo improvements** - Enhanced undo/redo functionality with better state management
- [x] **Form preview mode** - Better preview functionality in editor
  - Related: `packages/form-js-editor/src/features/preview-mode/`
  - ✅ Implemented: Added comprehensive preview mode feature with `PreviewMode` service, `PreviewButton` component, and `PreviewModal` component. Users can toggle between edit and preview modes. In preview mode, the form is displayed in a modal overlay using the Form viewer, allowing full interaction with the form as end users would see it. The palette and properties panel are hidden in preview mode. Preview mode can be toggled via button or closed with Escape key. Schema changes are automatically reflected in the preview.
- [x] **Theme customization** - Enhanced theming system with more customization options
  - Related: `packages/form-js-viewer/src/core/ThemeManager.js`, `packages/form-js-viewer/THEMING.md`
  - ✅ Implemented: Created comprehensive theme customization system with `ThemeManager` service. Supports theme presets (light, dark, high-contrast, carbon), custom themes, dynamic theme switching, theme merging, and property-level customization. Integrated into Form, FormEditor, and Playground with full API support. Includes TypeScript definitions and comprehensive documentation with examples.

### Developer Experience
- [ ] **Better TypeScript support** - Improve type definitions and type safety
- [ ] **Enhanced documentation** - Expand API documentation with more examples
- [ ] **Developer tools** - Add debugging tools and development helpers
- [ ] **Migration guides** - Provide guides for migrating between schema versions

---

## Notes

- Items are organized by priority based on impact and current technical debt
- Related file paths and issue numbers are included where applicable
- This backlog is a living document and should be updated as priorities change

