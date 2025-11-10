import contactTemplate from './templates/contact.json';
import registrationTemplate from './templates/registration.json';
import surveyTemplate from './templates/survey.json';
import feedbackTemplate from './templates/feedback.json';
import invoiceTemplate from './templates/invoice.json';
import orderTemplate from './templates/order.json';
import jobApplicationTemplate from './templates/job-application.json';
import eventRegistrationTemplate from './templates/event-registration.json';

/**
 * @typedef { {
 *   id: string;
 *   name: string;
 *   description: string;
 *   category: string;
 *   schema: any;
 *   tags?: string[];
 * } } Template
 */

/**
 * Template metadata for all available templates
 */
const TEMPLATE_METADATA = {
  contact: {
    id: 'contact',
    name: 'Contact Form',
    description: 'A simple contact form with name, email, phone, subject, and message fields.',
    category: 'communication',
    tags: ['contact', 'email', 'message', 'support'],
  },
  registration: {
    id: 'registration',
    name: 'Registration Form',
    description: 'User registration form with account creation fields including password validation.',
    category: 'authentication',
    tags: ['signup', 'account', 'user', 'registration'],
  },
  survey: {
    id: 'survey',
    name: 'Survey Form',
    description: 'Customer satisfaction survey with rating scales, checklists, and feedback fields.',
    category: 'feedback',
    tags: ['survey', 'feedback', 'rating', 'satisfaction'],
  },
  feedback: {
    id: 'feedback',
    name: 'Feedback Form',
    description: 'General feedback form for bug reports, feature requests, and general comments.',
    category: 'feedback',
    tags: ['feedback', 'bug', 'feature', 'comment'],
  },
  invoice: {
    id: 'invoice',
    name: 'Invoice Form',
    description: 'Invoice creation form with billing information, items, quantities, and pricing.',
    category: 'business',
    tags: ['invoice', 'billing', 'payment', 'business'],
  },
  order: {
    id: 'order',
    name: 'Order Form',
    description: 'E-commerce order form with customer details, product selection, and shipping options.',
    category: 'business',
    tags: ['order', 'ecommerce', 'shipping', 'purchase'],
  },
  'job-application': {
    id: 'job-application',
    name: 'Job Application Form',
    description: 'Job application form with personal information, experience, skills, and cover letter.',
    category: 'hr',
    tags: ['job', 'application', 'career', 'employment'],
  },
  'event-registration': {
    id: 'event-registration',
    name: 'Event Registration Form',
    description: 'Event registration form with attendee information, dietary restrictions, and preferences.',
    category: 'events',
    tags: ['event', 'registration', 'attendee', 'conference'],
  },
};

/**
 * Template schemas mapped by ID
 */
const TEMPLATE_SCHEMAS = {
  contact: contactTemplate,
  registration: registrationTemplate,
  survey: surveyTemplate,
  feedback: feedbackTemplate,
  invoice: invoiceTemplate,
  order: orderTemplate,
  'job-application': jobApplicationTemplate,
  'event-registration': eventRegistrationTemplate,
};

/**
 * Template Registry
 *
 * Manages form templates and provides access to template schemas and metadata.
 */
export class TemplateRegistry {
  /**
   * @constructor
   */
  constructor() {
    this._templates = this._buildTemplates();
  }

  /**
   * Get all available templates
   *
   * @param {Object} [options]
   * @param {string} [options.category] - Filter by category
   * @param {string} [options.search] - Search in name, description, or tags
   *
   * @returns {Template[]}
   */
  getTemplates(options = {}) {
    let templates = Object.values(this._templates);

    if (options.category) {
      templates = templates.filter((template) => template.category === options.category);
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      templates = templates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          (template.tags && template.tags.some((tag) => tag.toLowerCase().includes(searchLower))),
      );
    }

    return templates;
  }

  /**
   * Get a template by ID
   *
   * @param {string} id - Template ID
   *
   * @returns {Template|null}
   */
  getTemplate(id) {
    return this._templates[id] || null;
  }

  /**
   * Get template schema by ID
   *
   * @param {string} id - Template ID
   *
   * @returns {any|null}
   */
  getTemplateSchema(id) {
    const template = this.getTemplate(id);
    return template ? template.schema : null;
  }

  /**
   * Get all available categories
   *
   * @returns {string[]}
   */
  getCategories() {
    const categories = new Set();
    Object.values(this._templates).forEach((template) => {
      categories.add(template.category);
    });
    return Array.from(categories).sort();
  }

  /**
   * Build templates from metadata and schemas
   *
   * @private
   *
   * @returns {Object<string, Template>}
   */
  _buildTemplates() {
    const templates = {};

    Object.keys(TEMPLATE_METADATA).forEach((id) => {
      const metadata = TEMPLATE_METADATA[id];
      const schema = TEMPLATE_SCHEMAS[id];

      if (!schema) {
        console.warn(`Template schema not found for ID: ${id}`);
        return;
      }

      templates[id] = {
        ...metadata,
        schema: JSON.parse(JSON.stringify(schema)), // Deep clone
      };
    });

    return templates;
  }
}

/**
 * Default template registry instance
 */
export const defaultTemplateRegistry = new TemplateRegistry();

