# Custom Type Builder - User Guide

## Overview

The Custom Type Builder allows you to create your own form field types without writing code. You can design custom fields based on existing field types and use them immediately in your forms.

## How to Access

### Method 1: Toolbar Button (Recommended)
1. Open the playground page
2. Look for the **"+ New Custom Type"** button in the top toolbar
3. Click the button to open the Custom Type Builder modal

### Method 2: Palette Footer
1. Open the playground page
2. Look at the left sidebar (Components palette)
3. Scroll to the bottom of the palette
4. Click the **"New Custom Type"** button in the footer

## Creating a Custom Type

The builder uses a 4-step wizard to guide you through the process:

### Step 1: Basics
Configure the fundamental properties of your custom type:

- **Name** (required): A friendly name for your custom type (e.g., "Email Field", "Phone Number")
- **Type Key** (required): A unique identifier used internally (e.g., "email-field", "phone-number")
  - Must start with a letter
  - Can only contain lowercase letters, numbers, and hyphens
  - Must be unique (cannot conflict with built-in types or existing custom types)
- **Icon** (optional): A single character or emoji to represent this type in the palette
- **Color** (optional): A color for the icon (default: black)

**Tips:**
- The Type Key is automatically generated from the Name, but you can edit it
- Use descriptive names that clearly indicate the field's purpose

### Step 2: Composition
Choose the base field type and configure additional properties:

- **Base Type** (required): Select the underlying field type:
  - Text Field
  - Textarea
  - Number
  - Date/Time
  - Checkbox
  - Checklist
  - Radio
  - Select
  - Taglist

- **Label**: Default label text for fields of this type
- **Description**: Help text shown below the field
- **Helper Text**: Additional helper text

**Tips:**
- The base type determines the core functionality
- Your custom type will inherit all features from the base type
- You can override default values in this step

### Step 3: Defaults & Validation
Set default values and validation rules:

- **Default Value**: The default value for new fields of this type
- **Options** (for select-based types): Add options with labels and values
  - Click "Add Option" to add new options
  - Click "Remove" to delete an option
- **Required**: Mark fields of this type as required by default
- **Minimum** (for number/text fields): Minimum value or length
- **Maximum** (for number/text fields): Maximum value or length

**Tips:**
- Options are only available for select, checklist, taglist, and radio base types
- Validation rules can be overridden when using the field in a form

### Step 4: Preview & Publish
Review your custom type and publish it:

- **Preview**: See how your custom type will look and behave
- **Publish**: Click "Publish" to create the custom type
- The type will immediately appear in the "Custom" group in the Components palette

**Tips:**
- Review all settings before publishing
- You can go back to previous steps using the "Previous" button
- Click "Cancel" at any time to close without saving

## Using Custom Types

Once published, your custom types:

1. **Appear in the Palette**: Look for the "Custom" group in the left sidebar
2. **Work Like Built-in Types**: Drag and drop them into your form just like any other field
3. **Inherit Base Type Features**: All functionality from the base type is available
4. **Can Be Customized**: Properties can be changed in the properties panel after adding to the form

## Managing Custom Types

### Viewing Custom Types
- The toolbar shows a count of custom types when you have any (e.g., "3 custom types")
- Custom types appear in the "Custom" group in the Components palette

### Exporting Custom Types
1. Click "Export types" in the toolbar (visible when you have custom types)
2. A JSON file will be downloaded with all your custom type definitions
3. Save this file to backup or share your custom types

### Importing Custom Types
1. Click "Import types" in the toolbar
2. Select a JSON file containing custom type definitions
3. Choose to merge with existing types or replace all
4. Your custom types will be imported and available immediately

**Tips:**
- Export before making major changes as a backup
- Share custom types with your team by exporting and importing
- Imported types with the same Type Key will update existing types if merging

## Examples

### Example 1: Email Field
- **Name**: Email Field
- **Type Key**: email-field
- **Base Type**: Text Field
- **Label**: Email Address
- **Description**: Please enter a valid email address
- **Required**: Yes
- **Validation**: Can add email pattern validation in the form

### Example 2: Priority Select
- **Name**: Priority Select
- **Type Key**: priority-select
- **Base Type**: Select
- **Options**:
  - Low (value: "low")
  - Medium (value: "medium")
  - High (value: "high")
- **Default Value**: medium
- **Required**: Yes

### Example 3: Currency Field
- **Name**: Currency Amount
- **Type Key**: currency-amount
- **Base Type**: Number
- **Label**: Amount
- **Description**: Enter the amount in dollars
- **Min**: 0
- **Default Value**: 0

## Troubleshooting

### Button Not Visible
- Make sure you're in the playground page (not just the landing page)
- The button appears in the top toolbar as "+ New Custom Type"
- Also check the bottom of the Components palette on the left

### Type Key Already Exists
- The Type Key must be unique
- Try adding a number or suffix (e.g., "email-field-2")
- Check if you've already created a type with that key

### Custom Type Not Appearing in Palette
- Make sure you clicked "Publish" in Step 4
- Check the "Custom" group in the Components palette
- Refresh the page if needed (custom types are session-scoped)

### Import Not Working
- Ensure the JSON file is valid
- Check that the file contains an array of custom type definitions
- Verify the structure matches the export format

## Best Practices

1. **Use Descriptive Names**: Make names clear and self-explanatory
2. **Choose Appropriate Base Types**: Select the base type that best matches your needs
3. **Set Sensible Defaults**: Configure defaults that make sense for most use cases
4. **Export Regularly**: Export your custom types as a backup
5. **Document Your Types**: Use descriptions and helper text to document your custom types
6. **Test Before Publishing**: Use the preview to verify your custom type works as expected

## Limitations

- **Session-Scoped**: Custom types are stored in memory and will be lost when you refresh the page
- **Export to Persist**: Use the export feature to save your custom types
- **No Code Required**: This is a no-code builder - for advanced customization, you may need to use the programmatic API

## Next Steps

- Try creating a few custom types to get familiar with the builder
- Experiment with different base types to see what's possible
- Export your custom types to share with your team
- Check the API documentation for programmatic access to custom types

