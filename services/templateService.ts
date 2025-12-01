

import { ReportTemplate, SectionId } from '../types';

const TEMPLATES_KEY = 'rg_templates';

const DEFAULT_SECTIONS: { id: SectionId; label: string; isVisible: boolean }[] = [
  { id: 'header', label: 'Report Header', isVisible: true },
  { id: 'metrics', label: 'Key Metrics Dashboard', isVisible: true },
  { id: 'summary', label: 'Executive Summary', isVisible: true },
  { id: 'charts', label: 'Performance Visualization', isVisible: true },
  { id: 'outlook', label: 'Future Outlook', isVisible: true },
  { id: 'table', label: 'Detailed Data Table', isVisible: true },
  { id: 'insights', label: 'Key Insights', isVisible: true },
  { id: 'risks', label: 'Strategic Risks', isVisible: true },
  { id: 'recommendations', label: 'Recommendations', isVisible: true },
  { id: 'footer', label: 'Footer', isVisible: true },
];

const SYSTEM_TEMPLATES: ReportTemplate[] = [
  {
    id: 'sys_standard',
    name: 'Standard Business Report',
    category: 'General',
    userId: null,
    sections: DEFAULT_SECTIONS,
    theme: { primary: '#00BCD4', secondary: '#1a1a1a', background: '#FFFFFF', font: 'Inter' }
  },
  {
    id: 'sys_sales',
    name: 'Quarterly Sales Review',
    category: 'Sales',
    userId: null,
    sections: [
       { id: 'header', label: 'Header', isVisible: true },
       { id: 'metrics', label: 'KPIs', isVisible: true },
       { id: 'charts', label: 'Revenue Trends', isVisible: true },
       { id: 'table', label: 'Regional Breakdown', isVisible: true },
       { id: 'recommendations', label: 'Sales Strategy', isVisible: true },
       { id: 'summary', label: 'Summary', isVisible: false },
       { id: 'outlook', label: 'Forecast', isVisible: true },
       { id: 'insights', label: 'Insights', isVisible: false },
       { id: 'risks', label: 'Risks', isVisible: false },
       { id: 'footer', label: 'Footer', isVisible: true },
    ],
    theme: { primary: '#10B981', secondary: '#064E3B', background: '#F0FDF4', font: 'Roboto' }
  },
  {
    id: 'sys_exec',
    name: 'Executive Briefing',
    category: 'General',
    userId: null,
    sections: [
      { id: 'header', label: 'Header', isVisible: true },
      { id: 'summary', label: 'Executive Summary', isVisible: true },
      { id: 'risks', label: 'Critical Risks', isVisible: true },
      { id: 'recommendations', label: 'Action Items', isVisible: true },
      { id: 'metrics', label: 'Key Metrics', isVisible: false },
      { id: 'charts', label: 'Charts', isVisible: false },
      { id: 'outlook', label: 'Outlook', isVisible: false },
      { id: 'table', label: 'Table', isVisible: false },
      { id: 'insights', label: 'Insights', isVisible: false },
      { id: 'footer', label: 'Footer', isVisible: true },
    ],
    theme: { primary: '#1a1a1a', secondary: '#333333', background: '#fafafa', font: 'Playfair Display' }
  },
  {
    id: 'sys_hr',
    name: 'Workforce Analytics',
    category: 'HR',
    userId: null,
    sections: DEFAULT_SECTIONS.map(s => ({...s, isVisible: ['header', 'metrics', 'charts', 'insights', 'footer'].includes(s.id)})),
    theme: { primary: '#EC4899', secondary: '#831843', background: '#FFFFFF', font: 'Inter' }
  }
];

export const templateService = {
  getTemplates: (userId?: string): ReportTemplate[] => {
    try {
        const storedStr = localStorage.getItem(TEMPLATES_KEY);
        const stored: ReportTemplate[] = storedStr ? JSON.parse(storedStr) : [];
        const userTemplates = userId ? stored.filter(t => t.userId === userId) : [];
        return [...SYSTEM_TEMPLATES, ...userTemplates];
    } catch {
        return SYSTEM_TEMPLATES;
    }
  },

  saveTemplate: (template: ReportTemplate) => {
    const storedStr = localStorage.getItem(TEMPLATES_KEY);
    let stored: ReportTemplate[] = storedStr ? JSON.parse(storedStr) : [];
    
    const index = stored.findIndex(t => t.id === template.id);
    if (index >= 0) {
      stored[index] = template;
    } else {
      stored.push(template);
    }
    
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(stored));
  },

  deleteTemplate: (templateId: string) => {
    const storedStr = localStorage.getItem(TEMPLATES_KEY);
    let stored: ReportTemplate[] = storedStr ? JSON.parse(storedStr) : [];
    stored = stored.filter(t => t.id !== templateId);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(stored));
  }
};