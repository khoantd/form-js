# Quick Start: Custom Type Builder

## 🚀 Getting Started in 3 Steps

### Step 1: Open the Builder
1. Navigate to the **Playground** page
2. Look for the **"+ New Custom Type"** button in the top toolbar (blue button)
3. Click it to open the Custom Type Builder

**Alternative:** You can also find the button at the bottom of the Components palette (left sidebar)

### Step 2: Fill Out the Form
The builder has 4 simple steps:

1. **Basics**: Give your type a name (e.g., "Email Field") and a unique key
2. **Composition**: Choose a base type (like Text Field or Select) and set labels
3. **Validation**: Set defaults, required fields, and validation rules
4. **Preview**: Review and publish

### Step 3: Use Your Custom Type
- Your custom type appears in the **"Custom"** group in the Components palette
- Drag and drop it into your form like any other field
- Customize it further in the properties panel

## 💡 Example: Create an Email Field

1. Click **"+ New Custom Type"**
2. **Step 1 - Basics:**
   - Name: `Email Field`
   - Type Key: `email-field` (auto-generated)
3. **Step 2 - Composition:**
   - Base Type: `Text Field`
   - Label: `Email Address`
   - Description: `Please enter a valid email address`
4. **Step 3 - Validation:**
   - Required: ✓ (checked)
5. **Step 4 - Preview & Publish:**
   - Review the preview
   - Click **"Publish"**

Done! Your email field is now available in the Custom group.

## ❓ Troubleshooting

**Button not working?**
- Wait a few seconds for the playground to fully load
- Refresh the page if it still doesn't work
- Check the browser console for error messages

**Modal not opening?**
- Make sure you're in the Playground page (not the landing page)
- Try clicking the button in the palette footer instead
- Check if there are any error messages at the top of the page

**Type not appearing?**
- Make sure you clicked "Publish" in Step 4
- Check the "Custom" group in the Components palette
- The type key must be unique (try adding a number if it conflicts)

## 📚 Need More Help?

See the full [Custom Types Guide](./CUSTOM_TYPES_GUIDE.md) for detailed instructions, examples, and best practices.

