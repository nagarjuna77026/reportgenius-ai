
import React, { useState } from 'react';
import { X, Moon, Sun, Globe, Bell, Save, Monitor, Key, CheckCircle2, Eye, EyeOff, ShieldCheck, Briefcase, Palette, Image, UploadCloud, ExternalLink, Code2, Copy } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
  const [settings, setSettings] = useState<UserSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'api'>('general');
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'none' | 'valid' | 'invalid'>('none');

  if (!isOpen) return null;

  const handleSave = () => {
      onSave(settings);
      onClose();
  };

  const testApiKey = () => {
      if (!settings.apiKey) return;
      setIsTestingKey(true);
      // Simulate validation
      setTimeout(() => {
          // Google API Keys typically start with AIza
          if (settings.apiKey?.startsWith('AIza')) {
              setKeyStatus('valid');
          } else if (settings.apiKey?.length && settings.apiKey.length > 20) {
               // Allow other long keys but warn slightly or just accept as valid for "any key" request
              setKeyStatus('valid');
          } else {
              setKeyStatus('invalid');
          }
          setIsTestingKey(false);
      }, 1000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({
          ...settings,
          branding: { ...settings.branding, logoUrl: reader.result as string }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Save size={20} className="text-brand-accent"/> Settings
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20}/></button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === 'general' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
                General
            </button>
            <button 
                onClick={() => setActiveTab('branding')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === 'branding' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
                Branding
            </button>
             <button 
                onClick={() => setActiveTab('api')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === 'api' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
                Developer
            </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto h-full">
            {activeTab === 'general' && (
                <>
                    {/* API Key Section */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-3 flex items-center gap-2">
                            <Key size={14} /> Google Gemini API Key
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                            To enable AI analysis, file uploads, and chat, you need a Google Gemini API Key.
                        </p>
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1 mb-3"
                        >
                            Get a free API key here <ExternalLink size={10}/>
                        </a>
                        <div className="relative">
                            <input 
                                type={showKey ? "text" : "password"}
                                value={settings.apiKey || ''}
                                onChange={(e) => {
                                    setSettings({...settings, apiKey: e.target.value});
                                    setKeyStatus('none');
                                }}
                                placeholder="AIzaSy..."
                                className="w-full pl-9 pr-20 py-2.5 rounded-lg text-sm border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                            />
                            <ShieldCheck size={16} className="absolute left-3 top-3 text-gray-400" />
                            <div className="absolute right-2 top-2 flex gap-1">
                                <button 
                                    onClick={() => setShowKey(!showKey)}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    title={showKey ? "Hide Key" : "Show Key"}
                                >
                                    {showKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                                <button
                                    onClick={testApiKey}
                                    disabled={!settings.apiKey}
                                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors"
                                >
                                    {isTestingKey ? '...' : 'Check'}
                                </button>
                            </div>
                        </div>
                        {keyStatus === 'valid' && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-green-600 dark:text-green-400 font-medium animate-in fade-in">
                                <CheckCircle2 size={12} /> Key format looks valid
                            </div>
                        )}
                        {keyStatus === 'invalid' && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-red-500 font-medium animate-in fade-in">
                                <X size={12} /> Invalid key format (should usually start with 'AIza')
                            </div>
                        )}
                    </div>

                    {/* Theme */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Appearance</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['light', 'dark', 'system'] as const).map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => setSettings({...settings, theme})}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                                        settings.theme === theme 
                                        ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                                        : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {theme === 'light' ? <Sun size={20}/> : theme === 'dark' ? <Moon size={20}/> : <Monitor size={20}/>}
                                    <span className="text-xs font-medium capitalize">{theme}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'branding' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                        <div className="w-24 h-24 mx-auto bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm mb-3 overflow-hidden border-2 border-gray-100 dark:border-gray-700 relative group">
                            {settings.branding?.logoUrl ? (
                                <img src={settings.branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Briefcase className="text-gray-400" size={32} />
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <UploadCloud className="text-white" size={24}/>
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoUpload} />
                            </div>
                        </div>
                        <div className="text-sm font-bold text-gray-800 dark:text-white">{settings.branding?.companyName || "My Company"}</div>
                        <div className="text-xs text-gray-500">Enterprise Preview</div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                             <Briefcase size={14} /> Company Name
                        </label>
                        <input 
                            type="text"
                            value={settings.branding?.companyName || ''}
                            onChange={(e) => setSettings({
                                ...settings, 
                                branding: { ...settings.branding, companyName: e.target.value }
                            })}
                            className="w-full p-3 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-accent"
                            placeholder="Acme Corp"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                             <Image size={14} /> Logo Upload
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={settings.branding?.logoUrl || ''}
                                readOnly
                                className="w-full p-3 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 focus:outline-none cursor-not-allowed"
                                placeholder="Upload image above or paste URL here"
                            />
                            {settings.branding?.logoUrl && (
                                <button 
                                    onClick={() => setSettings({...settings, branding: {...settings.branding, logoUrl: ''}})}
                                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-500"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Click the logo preview above to upload a new image.</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                             <Palette size={14} /> Brand Color
                        </label>
                        <div className="flex flex-wrap gap-3 mb-3">
                            {['#00BCD4', '#3B82F6', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#000000'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setSettings({
                                        ...settings, 
                                        branding: { ...settings.branding, primaryColor: color }
                                    })}
                                    className={`w-8 h-8 rounded-full transition-all ${
                                        settings.branding?.primaryColor === color 
                                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' 
                                        : 'hover:scale-105'
                                    }`}
                                    style={{backgroundColor: color}}
                                />
                            ))}
                        </div>
                        <input 
                             type="text"
                             value={settings.branding?.primaryColor || '#00BCD4'}
                             onChange={(e) => setSettings({
                                ...settings, 
                                branding: { ...settings.branding, primaryColor: e.target.value }
                            })}
                             className="w-full p-2 rounded-lg text-xs font-mono border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            )}

            {activeTab === 'api' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-white font-mono text-xs">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400"># Fetch your latest report</span>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            </div>
                        </div>
                        <div className="text-gray-300">
                            curl -X GET \<br/>
                            &nbsp;&nbsp;https://api.reportgenius.ai/v1/reports/latest \<br/>
                            &nbsp;&nbsp;-H "Authorization: Bearer <span className="text-brand-accent">rg_live_938...</span>"
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Code2 size={16}/> Programmatic Access
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                            Generate reports on demand via our REST API. Ideal for scheduled cron jobs or integration with internal dashboards.
                        </p>
                        
                        <div className="flex items-center gap-2 mb-2">
                             <input 
                                type="text"
                                readOnly
                                value="rg_live_93821048_test_token"
                                className="flex-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-mono text-gray-600 dark:text-gray-300"
                             />
                             <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors">
                                 <Copy size={16}/>
                             </button>
                        </div>
                        <button className="text-xs text-brand-accent hover:underline font-bold">Generate New Token</button>
                    </div>

                     <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg text-xs text-yellow-800 dark:text-yellow-200">
                        <strong>Note:</strong> API access is limited to 100 requests/day on the standard enterprise plan.
                    </div>
                </div>
            )}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
            <button 
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all text-white"
                style={{backgroundColor: settings.branding?.primaryColor || '#00BCD4'}}
            >
                Save Preferences
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
