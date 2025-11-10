# @bpmn-io/form-js-templates

Pre-built form templates for common use cases.

## Installation

```bash
npm install @bpmn-io/form-js-templates
```

## Usage

### Using the Template Registry

```javascript
import { defaultTemplateRegistry } from '@bpmn-io/form-js-templates';

// Get all templates
const templates = defaultTemplateRegistry.getTemplates();

// Get templates by category
const businessTemplates = defaultTemplateRegistry.getTemplates({ category: 'business' });

// Search templates
const contactTemplates = defaultTemplateRegistry.getTemplates({ search: 'contact' });

// Get a specific template
const contactTemplate = defaultTemplateRegistry.getTemplate('contact');

// Get template schema
const contactSchema = defaultTemplateRegistry.getTemplateSchema('contact');

// Get all categories
const categories = defaultTemplateRegistry.getCategories();
```

### Available Templates

- **Contact Form** (`contact`) - A simple contact form with name, email, phone, subject, and message fields
- **Registration Form** (`registration`) - User registration form with account creation fields
- **Survey Form** (`survey`) - Customer satisfaction survey with rating scales and feedback fields
- **Feedback Form** (`feedback`) - General feedback form for bug reports and feature requests
- **Invoice Form** (`invoice`) - Invoice creation form with billing information and pricing
- **Order Form** (`order`) - E-commerce order form with customer details and shipping options
- **Job Application Form** (`job-application`) - Job application form with personal information and experience
- **Event Registration Form** (`event-registration`) - Event registration form with attendee information

### Template Categories

- `authentication` - User registration and login forms
- `business` - Business-related forms (invoices, orders)
- `communication` - Contact and messaging forms
- `events` - Event registration and management forms
- `feedback` - Survey and feedback collection forms
- `hr` - Human resources forms (job applications)

## Creating Custom Templates

You can create your own template registry:

```javascript
import { TemplateRegistry } from '@bpmn-io/form-js-templates';

const customRegistry = new TemplateRegistry();

// Add custom templates
customRegistry._templates['my-template'] = {
  id: 'my-template',
  name: 'My Template',
  description: 'A custom template',
  category: 'custom',
  schema: {
    type: 'default',
    components: [
      // ... your form components
    ]
  }
};
```

## Integration with Playground

The templates are automatically integrated into the form-js playground. Click the "Templates" button in the playground to browse and select from available templates.

## License

MIT

