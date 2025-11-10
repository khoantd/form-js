# Theme Customization

Form-JS provides a comprehensive theming system that allows you to customize the appearance of forms using CSS variables, classes, and styles.

## Overview

The theming system is built on top of CSS custom properties (variables) and provides:

- **Theme presets**: Pre-built themes (light, dark, high-contrast, carbon)
- **Custom themes**: Create your own themes with custom colors, fonts, and styles
- **Dynamic theme switching**: Change themes at runtime
- **Theme merging**: Merge themes to create variations
- **Property-level customization**: Update individual theme properties

## Basic Usage

### Applying a Theme Preset

```javascript
import { Form } from '@bpmn-io/form-js-viewer';

const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema,
  theme: 'dark' // Apply dark theme preset
});
```

### Applying a Custom Theme

```javascript
const customTheme = {
  variables: {
    '--color-text': '#333333',
    '--color-background': '#ffffff',
    '--color-accent': '#0066cc',
    '--font-family': 'Arial, sans-serif',
  },
  classes: ['fjs-theme-custom'],
  styles: {}
};

const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema,
  theme: customTheme
});
```

### Changing Theme at Runtime

```javascript
// Apply a preset
form.applyTheme('dark');

// Apply a custom theme
form.applyTheme({
  variables: {
    '--color-text': '#ffffff',
    '--color-background': '#1a1a1a'
  }
});

// Merge with current theme
form.applyTheme({
  variables: {
    '--color-accent': '#ff6600'
  }
}, true); // merge = true (default)
```

## Available Theme Presets

### Light (Default)
The default light theme with standard colors.

```javascript
form.applyTheme('light');
```

### Dark
A dark theme with inverted colors.

```javascript
form.applyTheme('dark');
```

### High Contrast
A high-contrast theme for accessibility.

```javascript
form.applyTheme('high-contrast');
```

### Carbon
Uses Carbon Design System variables (requires Carbon styles).

```javascript
form.applyTheme('carbon');
```

## Theme Object Structure

A theme object has the following structure:

```typescript
interface Theme {
  /**
   * CSS custom properties (variables) to apply.
   */
  variables?: Record<string, string>;
  
  /**
   * CSS classes to add to the container.
   */
  classes?: string[];
  
  /**
   * Inline styles to apply.
   */
  styles?: Record<string, string>;
}
```

### Example

```javascript
const theme = {
  variables: {
    '--color-text': '#333333',
    '--color-background': '#ffffff',
    '--color-accent': '#0066cc',
    '--color-borders': '#cccccc',
    '--font-family': 'Arial, sans-serif',
    '--font-size-base': '14px',
  },
  classes: ['fjs-theme-custom'],
  styles: {
    'border-radius': '8px'
  }
};
```

## Available CSS Variables

Form-JS uses CSS custom properties for theming. Here are the main variables you can customize:

### Colors

#### Text Colors
- `--color-text`: Primary text color
- `--color-text-light`: Secondary text color
- `--color-text-lighter`: Tertiary text color
- `--color-text-lightest`: Placeholder text color
- `--color-text-inverted`: Inverted text color
- `--color-text-disabled`: Disabled text color

#### Background Colors
- `--color-background`: Form field background
- `--color-background-disabled`: Disabled field background
- `--color-background-readonly`: Read-only field background
- `--color-background-inverted`: Inverted background
- `--color-layer`: Layer background
- `--color-layer-accent`: Accent layer background

#### Border Colors
- `--color-borders`: Primary border color
- `--color-borders-group`: Group border color
- `--color-borders-disabled`: Disabled border color
- `--color-borders-readonly`: Read-only border color

#### Accent Colors
- `--color-accent`: Primary accent color (links, buttons)
- `--color-warning`: Warning/error color
- `--color-warning-light`: Light warning color

### Typography

- `--font-family`: Font family
- `--font-size-base`: Base font size
- `--font-size-input`: Input font size
- `--font-size-label`: Label font size
- `--font-size-group`: Group font size
- `--line-height-base`: Base line height
- `--line-height-input`: Input line height
- `--line-height-label`: Label line height
- `--letter-spacing-base`: Base letter spacing
- `--letter-spacing-input`: Input letter spacing
- `--letter-spacing-label`: Label letter spacing

### Layout

- `--form-field-height`: Form field height
- `--border-definition`: Border definition
- `--outline-definition`: Focus outline definition

## API Reference

### Form Methods

#### `applyTheme(theme, merge?)`
Apply a theme to the form.

- `theme`: Theme object or preset name (string)
- `merge`: Whether to merge with current theme (default: `true`)

```javascript
form.applyTheme('dark');
form.applyTheme({ variables: { '--color-text': '#fff' } }, false);
```

#### `getTheme()`
Get the current theme.

```javascript
const currentTheme = form.getTheme();
```

#### `resetTheme()`
Reset theme to default.

```javascript
form.resetTheme();
```

#### `registerThemePreset(name, theme)`
Register a custom theme preset.

```javascript
form.registerThemePreset('my-theme', {
  variables: {
    '--color-text': '#333',
    '--color-background': '#fff'
  }
});
```

#### `getThemePreset(name)`
Get a theme preset by name.

```javascript
const preset = form.getThemePreset('dark');
```

#### `getThemePresets()`
Get all registered theme presets.

```javascript
const presets = form.getThemePresets();
```

#### `setThemeProperty(property, value)`
Set a specific theme property.

```javascript
form.setThemeProperty('--color-text', '#333333');
```

#### `getThemeProperty(property)`
Get a specific theme property.

```javascript
const textColor = form.getThemeProperty('--color-text');
```

## Advanced Usage

### Creating Custom Themes

```javascript
// Define a custom theme
const myTheme = {
  variables: {
    '--color-text': '#2c3e50',
    '--color-background': '#ecf0f1',
    '--color-accent': '#3498db',
    '--color-borders': '#bdc3c7',
    '--font-family': '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  classes: ['fjs-theme-modern'],
  styles: {}
};

// Register it as a preset
form.registerThemePreset('modern', myTheme);

// Apply it
form.applyTheme('modern');
```

### Merging Themes

```javascript
// Start with dark theme
form.applyTheme('dark');

// Merge in custom accent color
form.applyTheme({
  variables: {
    '--color-accent': '#ff6600'
  }
}, true); // merge = true
```

### Dynamic Theme Switching

```javascript
// Listen for theme changes
form.on('theme.changed', ({ theme }) => {
  console.log('Theme changed:', theme);
});

// Switch themes based on user preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
prefersDark.addEventListener('change', (e) => {
  form.applyTheme(e.matches ? 'dark' : 'light');
});
```

### Theme Events

The theme system emits events when themes change:

```javascript
form.on('theme.changed', ({ theme }) => {
  console.log('New theme:', theme);
});

form.on('theme.preset.registered', ({ name, theme }) => {
  console.log('Preset registered:', name);
});
```

## Form Editor and Playground

The theme system is also available in FormEditor and Playground:

```javascript
import { FormEditor } from '@bpmn-io/form-js-editor';
import { Playground } from '@bpmn-io/form-js-playground';

// FormEditor
const editor = new FormEditor({
  container: document.querySelector('#editor'),
  theme: 'dark'
});

editor.applyTheme('dark');

// Playground
const playground = new Playground({
  container: document.querySelector('#playground'),
  schema: mySchema,
  data: myData
});

playground.applyTheme('dark');
```

## Best Practices

1. **Use CSS Variables**: Prefer CSS variables over inline styles for better maintainability
2. **Create Presets**: Register commonly used themes as presets for easy reuse
3. **Merge Themes**: Use theme merging to create variations without duplicating code
4. **Test Accessibility**: Ensure your custom themes meet accessibility standards (WCAG)
5. **Document Custom Themes**: Document your custom themes for team members

## Examples

### Complete Example

```javascript
import { Form } from '@bpmn-io/form-js-viewer';

// Create form with initial theme
const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema,
  theme: {
    variables: {
      '--color-text': '#333333',
      '--color-background': '#ffffff',
      '--color-accent': '#0066cc'
    }
  }
});

// Register a custom preset
form.registerThemePreset('brand', {
  variables: {
    '--color-text': '#1a1a1a',
    '--color-background': '#f5f5f5',
    '--color-accent': '#ff6600',
    '--font-family': '"Roboto", sans-serif'
  },
  classes: ['fjs-theme-brand']
});

// Apply the preset
form.applyTheme('brand');

// Update a single property
form.setThemeProperty('--color-accent', '#ff3300');
```

## See Also

- [Form Schema Documentation](./docs/FORM_SCHEMA.md)
- [API Reference](./README.md)

