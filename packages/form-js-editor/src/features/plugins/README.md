# Form Editor Plugin System

The form editor plugin system allows you to extend the form builder functionality with custom features, components, and behaviors.

## Overview

Plugins can extend the form editor by:
- Registering custom modules
- Adding command handlers
- Adding palette entries
- Adding properties panel providers
- Registering custom form field types
- Hooking into editor events
- Extending services

## Basic Usage

### Creating a Plugin

Create a plugin by extending the `Plugin` class or providing a plugin definition object:

```javascript
import { Plugin } from '@bpmn-io/form-js-editor';

class MyPlugin extends Plugin {
  constructor() {
    super({
      name: 'my-plugin',
      version: '1.0.0',
      description: 'My custom plugin',
    });
  }

  // Override methods to extend functionality
  getPaletteEntries() {
    return [
      {
        label: 'Custom Field',
        type: 'custom-field',
        group: 'basic-input',
      },
    ];
  }
}
```

### Registering a Plugin

Register plugins when creating the form editor:

```javascript
import { FormEditor } from '@bpmn-io/form-js-editor';
import { MyPlugin } from './MyPlugin';

const formEditor = new FormEditor({
  container: document.querySelector('#form-editor'),
  plugins: [
    new MyPlugin(),
    // Or use a plugin definition object
    {
      name: 'simple-plugin',
      version: '1.0.0',
      getPaletteEntries() {
        return [/* ... */];
      },
    },
  ],
});
```

## Plugin API

### Plugin Base Class

The `Plugin` class provides the following methods that can be overridden:

#### `getModules()`

Returns an array of module definitions to register with the dependency injector.

```javascript
getModules() {
  return [
    {
      __init__: ['myService'],
      myService: ['type', MyService],
    },
  ];
}
```

#### `getCommandHandlers()`

Returns an object mapping command IDs to handler classes.

```javascript
getCommandHandlers() {
  return {
    'custom.command': CustomCommandHandler,
  };
}
```

#### `getPaletteEntries()`

Returns an array of palette entry definitions.

```javascript
getPaletteEntries() {
  return [
    {
      label: 'Custom Field',
      type: 'custom-field',
      group: 'basic-input', // 'basic-input' | 'selection' | 'presentation' | 'container' | 'action'
      icon: CustomIcon, // Optional: Preact component
      iconUrl: 'path/to/icon.svg', // Optional: URL to icon
    },
  ];
}
```

#### `getPropertiesPanelProviders()`

Returns an array of properties panel provider instances or classes.

```javascript
getPropertiesPanelProviders() {
  return [
    {
      getGroups(field, editField) {
        return (groups) => {
          groups.push({
            id: 'custom',
            label: 'Custom Properties',
            entries: [
              {
                id: 'customProperty',
                label: 'Custom Property',
                component: CustomPropertyEntry,
              },
            ],
          });
          return groups;
        };
      },
    },
  ];
}
```

#### `getFormFieldTypes()`

Returns an array of form field type definitions.

```javascript
getFormFieldTypes() {
  return [
    {
      config: {
        type: 'custom-field',
        label: 'Custom Field',
        group: 'basic-input',
        // ... other field config
      },
      // ... form field implementation
    },
  ];
}
```

#### `registerEventListeners()`

Hook into editor events.

```javascript
registerEventListeners() {
  const eventBus = this.getEventBus();

  eventBus.on('form.init', () => {
    console.log('Form initialized');
  });

  eventBus.on('selection.changed', (event) => {
    console.log('Selection changed', event);
  });
}
```

#### `destroy()`

Clean up resources when the plugin is destroyed.

```javascript
destroy() {
  // Clean up event listeners, timers, etc.
  this._eventHandlers.forEach((cleanup) => cleanup());
}
```

### Plugin Context

Plugins have access to the following services via helper methods:

- `getService(type, strict)` - Get a service from the injector
- `getEventBus()` - Get the event bus
- `getFormEditor()` - Get the form editor instance

## Example Plugins

See the `examples/` directory for complete plugin examples:

- `SimplePalettePlugin` - Adds a custom palette entry
- `CustomPropertiesPlugin` - Adds custom properties panel entries
- `EventHookPlugin` - Demonstrates event hooking
- `CustomCommandPlugin` - Adds a custom command handler

## Events

The form editor fires various events that plugins can listen to:

- `form.init` - Form initialized
- `form.clear` - Form cleared
- `form.destroy` - Form destroyed
- `import.done` - Schema import completed
- `selection.changed` - Selection changed
- `propertiesPanel.attach` - Properties panel attached
- `propertiesPanel.detach` - Properties panel detached
- `propertiesPanel.rendered` - Properties panel rendered
- `plugins.integrated` - Plugins integrated

## Best Practices

1. **Always clean up**: Remove event listeners and clean up resources in the `destroy()` method
2. **Use dependency injection**: Access services via `getService()` rather than direct instantiation
3. **Follow naming conventions**: Use descriptive plugin names and follow the existing code style
4. **Handle errors gracefully**: Wrap plugin registration in try-catch blocks
5. **Document your plugin**: Provide clear documentation for your plugin's functionality

## Limitations

- Plugin modules must be registered at injector creation time. The plugin system handles this automatically by collecting modules before injector creation.
- Some services may not be available during plugin initialization. Use `getService(type, false)` to check for optional services.

## TypeScript Support

TypeScript type definitions are available for the plugin system. Import types from `@bpmn-io/form-js-editor`:

```typescript
import { Plugin, FormEditorOptions } from '@bpmn-io/form-js-editor';
```

