/**
 * Theme Customization Example
 *
 * This example demonstrates how to use the theme customization system
 * in Form-JS to apply themes, create custom themes, and switch themes dynamically.
 */

import { Form } from '@bpmn-io/form-js-viewer';

// Example schema
const schema = {
  type: 'default',
  components: [
    {
      type: 'textfield',
      key: 'name',
      label: 'Name',
      validate: {
        required: true,
      },
    },
    {
      type: 'textfield',
      key: 'email',
      label: 'Email',
      validate: {
        required: true,
      },
    },
    {
      type: 'button',
      key: 'submit',
      label: 'Submit',
      action: 'submit',
    },
  ],
};

// Example 1: Apply a preset theme
function example1() {
  const form = new Form({
    container: document.querySelector('#form1'),
    schema: schema,
    theme: 'dark', // Apply dark theme preset
  });
}

// Example 2: Apply a custom theme
function example2() {
  const customTheme = {
    variables: {
      '--color-text': '#333333',
      '--color-background': '#ffffff',
      '--color-accent': '#0066cc',
      '--color-borders': '#cccccc',
      '--font-family': 'Arial, sans-serif',
    },
    classes: ['fjs-theme-custom'],
    styles: {},
  };

  const form = new Form({
    container: document.querySelector('#form2'),
    schema: schema,
    theme: customTheme,
  });
}

// Example 3: Register and use a custom preset
function example3() {
  const form = new Form({
    container: document.querySelector('#form3'),
    schema: schema,
  });

  // Register a custom theme preset
  form.registerThemePreset('brand', {
    variables: {
      '--color-text': '#1a1a1a',
      '--color-background': '#f5f5f5',
      '--color-accent': '#ff6600',
      '--font-family': '"Roboto", sans-serif',
    },
    classes: ['fjs-theme-brand'],
  });

  // Apply the preset
  form.applyTheme('brand');
}

// Example 4: Dynamic theme switching
function example4() {
  const form = new Form({
    container: document.querySelector('#form4'),
    schema: schema,
  });

  // Listen for system theme preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleThemeChange = (e) => {
    form.applyTheme(e.matches ? 'dark' : 'light');
  };

  prefersDark.addEventListener('change', handleThemeChange);
  
  // Apply initial theme
  handleThemeChange(prefersDark);
}

// Example 5: Merge themes
function example5() {
  const form = new Form({
    container: document.querySelector('#form5'),
    schema: schema,
    theme: 'dark', // Start with dark theme
  });

  // Merge in custom accent color
  form.applyTheme(
    {
      variables: {
        '--color-accent': '#ff6600',
      },
    },
    true, // merge = true
  );
}

// Example 6: Update individual properties
function example6() {
  const form = new Form({
    container: document.querySelector('#form6'),
    schema: schema,
  });

  // Update individual theme properties
  form.setThemeProperty('--color-accent', '#ff3300');
  form.setThemeProperty('--font-family', '"Georgia", serif');

  // Get a property value
  const accentColor = form.getThemeProperty('--color-accent');
  console.log('Accent color:', accentColor);
}

// Example 7: Theme events
function example7() {
  const form = new Form({
    container: document.querySelector('#form7'),
    schema: schema,
  });

  // Listen for theme changes
  form.on('theme.changed', ({ theme }) => {
    console.log('Theme changed:', theme);
  });

  // Listen for preset registration
  form.on('theme.preset.registered', ({ name, theme }) => {
    console.log('Preset registered:', name, theme);
  });

  // Apply a theme (will trigger theme.changed event)
  form.applyTheme('dark');
}

// Example 8: Get all available presets
function example8() {
  const form = new Form({
    container: document.querySelector('#form8'),
    schema: schema,
  });

  // Get all registered presets
  const presets = form.getThemePresets();
  console.log('Available presets:', presets);

  // Get a specific preset
  const darkPreset = form.getThemePreset('dark');
  console.log('Dark preset:', darkPreset);
}

// Example 9: Reset theme
function example9() {
  const form = new Form({
    container: document.querySelector('#form9'),
    schema: schema,
    theme: 'dark',
  });

  // Reset to default theme
  form.resetTheme();
}

// Example 10: Complete theme customization
function example10() {
  const form = new Form({
    container: document.querySelector('#form10'),
    schema: schema,
  });

  // Create a comprehensive custom theme
  const modernTheme = {
    variables: {
      // Colors
      '--color-text': '#2c3e50',
      '--color-text-light': '#7f8c8d',
      '--color-background': '#ecf0f1',
      '--color-accent': '#3498db',
      '--color-borders': '#bdc3c7',
      '--color-warning': '#e74c3c',

      // Typography
      '--font-family': '"Helvetica Neue", Helvetica, Arial, sans-serif',
      '--font-size-base': '16px',
      '--font-size-input': '16px',
      '--font-size-label': '14px',
      '--line-height-base': '24px',
      '--line-height-input': '24px',

      // Layout
      '--form-field-height': '40px',
      '--border-definition': '2px solid var(--color-borders)',
    },
    classes: ['fjs-theme-modern'],
    styles: {
      'border-radius': '8px',
    },
  };

  // Register and apply
  form.registerThemePreset('modern', modernTheme);
  form.applyTheme('modern');
}

export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
  example9,
  example10,
};

