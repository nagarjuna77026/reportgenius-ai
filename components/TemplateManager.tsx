import React, { useState } from 'react';
import { ReportTemplate, ThemeFont } from '../types';
import { Eye, EyeOff, Plus, Trash2, Check, Layout, Palette, Image } from 'lucide-react';
import { templateService } from '../services/templateService';

interface TemplateManagerProps {
  currentUser: any;
  onSelectTemplate: (template: ReportTemplate) => void;
  activeTemplateId: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ currentUser, onSelectTemplate, activeTemplateId }) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>(templateService.getTemplates(currentUser.id));
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'layout' | 'style' | 'branding'>('layout');

  const handleCreateNew = () => {
    const base = templates.find(t => t.id === 'sys_standard')!;
    const newTemplate: ReportTemplate = {
      ...base,
      id: `custom_${Date.now()}`,
      name: 'New Custom Template',
      userId: currentUser.id,
      sections: base.sections.map(s => ({...s})),
      theme: { ...base.theme, font: 'Inter' }
    };
    setEditingTemplate(newTemplate);
  };

  const handleEdit = (template: ReportTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
  };

  const handleSave = () => {
    if (editingTemplate) {
      templateService.saveTemplate(editingTemplate);
      setTemplates(templateService.getTemplates(currentUser.id));
      onSelectTemplate(editingTemplate);
      setEditingTemplate(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
        templateService.deleteTemplate(id);
        const updated = templateService.getTemplates(currentUser.id);
        setTemplates(updated);
        if (activeTemplateId === id) {
          onSelectTemplate(updated[0]);
        }
    }
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    if (!editingTemplate) return;
    const newSections = [...editingTemplate.sections];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newSections.length) return;
    
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setEditingTemplate({ ...editingTemplate, sections: newSections });
  };

  const toggleVisibility = (index: number) => {
    if (!editingTemplate) return;
    const newSections = [...editingTemplate.sections];
    newSections[index].isVisible = !newSections[index].isVisible;
    setEditingTemplate({ ...editingTemplate, sections: newSections });
  };

  if (editingTemplate) {
    return (
      <div className="space-y-4 bg-gray-900/50 rounded-xl border border-gray-700 p-4 text-gray-300 animate-in slide-in-from-right-4 duration-200">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <input 
            value={editingTemplate.name}
            onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
            className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-brand-accent w-2/3"
            placeholder="Template Name"
          />
          <div className="flex gap-2">
             <button onClick={() => setEditingTemplate(null)} className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600">Cancel</button>
             <button onClick={handleSave} className="px-2 py-1 text-xs bg-brand-accent rounded hover:bg-brand-accentHover text-white flex items-center gap-1"><Check size={12}/> Save</button>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
             {['layout', 'style', 'branding'].map((tab) => (
                 <button
                    key={tab}
                    onClick={() => setActiveEditTab(tab as any)}
                    className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition-all ${
                        activeEditTab === tab ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                 >
                    {tab}
                 </button>
             ))}
        </div>

        <div className="h-[300px] overflow-y-auto pr-2 scrollbar-dark">
            {activeEditTab === 'layout' && (
                <div className="space-y-1">
                    {editingTemplate.sections.map((section, idx) => (
                        <div key={section.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${section.isVisible ? 'bg-gray-800 border-gray-700' : 'bg-gray-900/30 border-transparent opacity-50'}`}>
                            <div className="flex flex-col gap-0.5">
                                <button onClick={() => moveSection(idx, -1)} className="hover:text-white" disabled={idx === 0}>▲</button>
                                <button onClick={() => moveSection(idx, 1)} className="hover:text-white" disabled={idx === editingTemplate.sections.length - 1}>▼</button>
                            </div>
                            <span className="flex-1 text-xs font-medium">{section.label}</span>
                            <button onClick={() => toggleVisibility(idx)} className={section.isVisible ? 'text-green-400' : 'text-gray-500'}>
                                {section.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {activeEditTab === 'style' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 mb-2 block">Primary Color</label>
                        <div className="flex flex-wrap gap-2">
                            {['#00BCD4', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#111827'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setEditingTemplate({...editingTemplate, theme: {...editingTemplate.theme, primary: color}})}
                                    className={`w-6 h-6 rounded-full ${editingTemplate.theme.primary === color ? 'ring-2 ring-white' : ''}`}
                                    style={{backgroundColor: color}}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                         <label className="text-[10px] uppercase text-gray-500 mb-2 block">Font Family</label>
                         <select 
                            value={editingTemplate.theme.font}
                            onChange={(e) => setEditingTemplate({...editingTemplate, theme: {...editingTemplate.theme, font: e.target.value as ThemeFont}})}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white"
                        >
                            <option value="Inter">Inter (Modern)</option>
                            <option value="Roboto">Roboto (Geometric)</option>
                            <option value="Playfair Display">Playfair (Elegant)</option>
                            <option value="Courier Prime">Courier (Tech)</option>
                        </select>
                    </div>
                </div>
            )}

            {activeEditTab === 'branding' && (
                <div className="space-y-4 text-center">
                    <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 hover:border-brand-accent cursor-pointer transition-colors">
                         <Image className="mx-auto mb-2 text-gray-500" size={24}/>
                         <span className="text-xs text-gray-400">Upload Company Logo</span>
                         <input type="file" className="hidden" accept="image/*" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Recommended size: 200x200px (PNG/SVG)</p>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in slide-in-from-left-4 duration-300">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available Templates</h2>
            <button onClick={handleCreateNew} className="text-xs text-brand-accent hover:text-white flex items-center gap-1 transition-colors">
                <Plus size={12}/> New
            </button>
        </div>
        
        {templates.map(template => (
            <div 
                key={template.id} 
                className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                    activeTemplateId === template.id 
                    ? 'bg-gray-800 border-brand-accent shadow-md' 
                    : 'bg-gray-900/30 border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => onSelectTemplate(template)}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-1">
                        <Layout size={14} style={{color: template.theme.primary}} />
                        <span className={`text-sm font-bold ${activeTemplateId === template.id ? 'text-white' : 'text-gray-300'}`}>{template.name}</span>
                    </div>
                    {template.userId && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => {e.stopPropagation(); handleEdit(template);}} className="p-1 hover:text-white text-gray-500"><Palette size={12}/></button>
                             <button onClick={(e) => {e.stopPropagation(); handleDelete(template.id);}} className="p-1 hover:text-red-400 text-gray-500"><Trash2 size={12}/></button>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                    <span className="capitalize">{template.category || 'General'}</span>
                    <span>•</span>
                    <span>{template.sections.filter(s => s.isVisible).length} sections</span>
                </div>
            </div>
        ))}
    </div>
  );
};

export default TemplateManager;