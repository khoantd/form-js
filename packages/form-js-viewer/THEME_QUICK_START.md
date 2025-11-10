# Theme Customization Quick Start Guide

This guide shows you how to use the theme customization feature in Form-JS.

## Basic Usage

### 1. Apply a Preset Theme

The easiest way to use themes is to apply one of the built-in presets:

```javascript
import { Form } from '@bpmn-io/form-js-viewer';

const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema,
  theme: 'dark' // Apply dark theme
});
```

**Available Presets:**
- `'light'` - Default light theme
- `'dark'` - Dark theme with inverted colors
- `'high-contrast'` - High contrast theme for accessibility
- `'carbon'` - Carbon Design System theme

### 2. Apply a Custom Theme

Create your own theme with custom colors and styles:

```javascript
const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema,
  theme: {
    variables: {
      '--color-text': '#333333',
      '--color-background': '#ffffff',
      '--color-accent': '#0066cc',
      '--font-family': 'Arial, sans-serif'
    }
  }
});
```

### 3. Change Theme at Runtime

You can change themes dynamically after the form is created:

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
```

## Common Use Cases

### Use Case 1: Dark Mode Toggle

```javascript
const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema
});

// Toggle button
document.querySelector('#toggle-theme').addEventListener('click', () => {
  const currentTheme = form.getTheme();
  const isDark = currentTheme.classes?.includes('fjs-theme-dark');
  
  form.applyTheme(isDark ? 'light' : 'dark');
});
```

### Use Case 2: Match System Theme

```javascript
const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema
});

// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

const applySystemTheme = (e) => {
  form.applyTheme(e.matches ? 'dark' : 'light');
};

prefersDark.addEventListener('change', applySystemTheme);
applySystemTheme(prefersDark); // Apply initially
```

### Use Case 3: Brand Colors

```javascript
const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema
});

// Register your brand theme
form.registerThemePreset('brand', {
  variables: {
    '--color-text': '#1a1a1a',
    '--color-background': '#ffffff',
    '--color-accent': '#ff6600', // Your brand color
    '--color-borders': '#e0e0e0',
    '--font-family': '"Roboto", sans-serif'
  },
  classes: ['fjs-theme-brand']
});

// Apply it
form.applyTheme('brand');
```

### Use Case 4: Update Single Color

```javascript
const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema
});

// Just change the accent color
form.setThemeProperty('--color-accent', '#ff3300');
```

### Use Case 5: Merge Themes

Start with a base theme and add customizations:

```javascript
const form = new Form({
  container: document.querySelector('#form'),
  schema: mySchema,
  theme: 'dark' // Start with dark theme
});

// Add custom accent color (merges with dark theme)
form.applyTheme({
  variables: {
    '--color-accent': '#ff6600'
  }
}, true); // merge = true (default)
```

## Available CSS Variables

Here are the most commonly used CSS variables you can customize:

### Colors
```javascript
{
  '--color-text': '#333333',              // Main text color
  '--color-text-light': '#666666',        // Secondary text
  '--color-background': '#ffffff',        // Form field background
  '--color-accent': '#0066cc',            // Links, buttons, focus
  '--color-borders': '#cccccc',           // Border color
  '--color-warning': '#e74c3c',           // Error/warning color
}
```

### Typography
```javascript
{
  '--font-family': 'Arial, sans-serif',   // Font family
  '--font-size-base': '14px',             // Base font size
  '--font-size-input': '14px',            // Input font size
  '--font-size-label': '12px',            // Label font size
}
```

### Layout
```javascript
{
  '--form-field-height': '36px',          // Form field height
}
```

## Complete Example

```javascript
import { Form } from '@bpmn-io/form-js-viewer';

// Your form schema
const schema = {
  type: 'default',
  components: [
    {
      type: 'textfield',
      key: 'name',
      label: 'Name'
    },
    {
      type: 'button',
      key: 'submit',
      label: 'Submit',
      action: 'submit'
    }
  ]
};

// Create form with custom theme
const form = new Form({
  container: document.querySelector('#form'),
  schema: schema,
  theme: {
    variables: {
      '--color-text': '#2c3e50',
      '--color-background': '#ecf0f1',
      '--color-accent': '#3498db',
      '--color-borders': '#bdc3c7',
      '--font-family': '"Helvetica Neue", Helvetica, Arial, sans-serif'
    }
  }
});

// Later, change to dark theme
form.applyTheme('dark');

// Or update just the accent color
form.setThemeProperty('--color-accent', '#ff6600');
```

## Form Editor and Playground

The theme system also works with FormEditor and Playground:

```javascript
import { FormEditor } from '@bpmn-io/form-js-editor';
import { Playground } from '@bpmn-io/form-js-playground';

// FormEditor
const editor = new FormEditor({
  container: document.querySelector('#editor'),
  theme: 'dark'
});

// Playground
const playground = new Playground({
  container: document.querySelector('#playground'),
  schema: schema,
  data: data,
  theme: 'dark' // Optional: can also be set later
});

// Change theme dynamically
playground.applyTheme('dark');
```

## Tips

1. **Start with presets**: Use built-in presets (`'dark'`, `'light'`, etc.) before creating custom themes
2. **Use CSS variables**: Prefer CSS variables over inline styles for better maintainability
3. **Register presets**: If you use a theme multiple times, register it as a preset
4. **Merge themes**: Use theme merging to create variations without duplicating code
5. **Test accessibility**: Ensure your custom themes meet accessibility standards (WCAG)

## More Information

For detailed documentation, see [THEMING.md](./THEMING.md).

