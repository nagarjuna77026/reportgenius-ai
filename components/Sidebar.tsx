
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Network, 
  FileText, 
  PieChart, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock,
  Activity,
  Play,
  LayoutTemplate,
  Database,
  Server,
  UploadCloud,
  Settings2,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Info,
  History,
  Trash2,
  FileBarChart2,
  HelpCircle,
  Code,
  BookOpen,
  ExternalLink,
  Search,
  MessageSquare,
  Send,
  X
} from 'lucide-react';
import { AnalysisContext, PipelineStage, ReportTemplate, DataSourceConfig, DataSourceType, ConnectionHistoryItem, SavedReportMetadata } from '../types';
import { PIPELINE_STEPS } from '../constants';
import TemplateManager from './TemplateManager';
import { reportService } from '../services/reportService';
import { sessionService } from '../services/SessionService';
import { parseCSV, formatFileSize } from '../utils/fileHelpers';

interface SidebarProps {
  /** Controls visibility of the sidebar */
  isOpen: boolean;
  /** Toggles sidebar visibility */
  toggleSidebar: () => void;
  /** Current progress stage of report generation (0-5) */
  pipelineStage: PipelineStage;
  /** Main function to trigger report generation flow */
  onGenerate: (context: AnalysisContext, sourceConfig: DataSourceConfig) => void;
  /** Function to abort current generation */
  onCancel: () => void;
  /** Loading state indicator */
  isGenerating: boolean;
  /** Current authenticated user */
  currentUser: any;
  /** Currently selected report template */
  activeTemplate: ReportTemplate;
  /** Callback to change active template */
  onSelectTemplate: (t: ReportTemplate) => void;
  /** Callback to trigger Data Quality modal (for file uploads) */
  onCheckDataQuality: (file: {name: string, content: string, size: number}) => void;
  /** Branding configuration for visual customization */
  branding?: { logoUrl?: string; primaryColor?: string; companyName?: string; };
  /** User provided API Key for Google Gemini */
  apiKey?: string;
  /** Callback to open settings modal */
  onOpenSettings: () => void;
  /** Callback to load a specific saved report */
  onLoadReport?: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  pipelineStage, 
  onGenerate,
  onCancel,
  isGenerating,
  currentUser,
  activeTemplate,
  onSelectTemplate,
  onCheckDataQuality,
  branding,
  apiKey,
  onOpenSettings,
  onLoadReport
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'templates' | 'history'>('data');
  const [sourceType, setSourceType] = useState<DataSourceType>('demo');
  
  // Source States
  const [selectedDemo, setSelectedDemo] = useState<string>('sales');
  const [apiConfig, setApiConfig] = useState({ url: '', method: 'GET' as 'GET'|'POST', headers: '{\n  "Authorization": "Bearer ..."\n}' });
  const [dbConfig, setDbConfig] = useState({ 
    useProxy: true,
    host: '', port: '', user: '', password: '', 
    query: '', dbName: '', collection: '', connectionString: ''
  });
  const [fileData, setFileData] = useState<{name: string, content: string, size: number} | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [granularStatus, setGranularStatus] = useState<string>('');
  
  // History State
  const [savedReports, setSavedReports] = useState<SavedReportMetadata[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  
  // Feedback Modal State
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  
  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false);

  // Context States
  const [timePeriod, setTimePeriod] = useState('Q2 2024');
  const [analysisType, setAnalysisType] = useState<'Trends' | 'Anomalies' | 'Forecast' | 'Benchmarks'>('Trends');
  const [instructions, setInstructions] = useState('');
  
  // Connection History
  const [recentConnections, setRecentConnections] = useState<ConnectionHistoryItem[]>([]);

  const progressPercent = Math.min(100, Math.round((pipelineStage / 5) * 100));
  const brandColor = branding?.primaryColor || '#00BCD4';

  const hasErrors = Object.keys(errors).length > 0;

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const isValidJson = (string: string) => {
    try {
      JSON.parse(string);
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
        setSavedReports(reportService.getHistory());
    }
  }, [activeTab]);

  useEffect(() => {
    // Load recent connections from session
    setRecentConnections(sessionService.getRecentConnections());
  }, [sourceType]);

  useEffect(() => {
    if (hasAttemptedGenerate) {
        validateConfig();
    }
  }, [sourceType, apiConfig, dbConfig, fileData, fileError, hasAttemptedGenerate, apiKey]);

  // Clear file error if API key is added
  useEffect(() => {
    if (apiKey && fileError.includes("API Key")) {
        setFileError('');
    }
  }, [apiKey]);

  const validateConfig = () => {
    const newErrors: Record<string, string> = {};

    if (sourceType === 'file') {
        if (!apiKey) newErrors.file = "Gemini API Key required for file analysis.";
        if (!fileData) newErrors.file = "Please upload a file to proceed.";
        if (fileError) newErrors.file = fileError;
    }

    if (sourceType === 'api') {
        if (!apiKey) newErrors.general = "Gemini API Key required for API analysis.";
        if (!apiConfig.url) newErrors.apiUrl = "Endpoint URL is required.";
        else if (!isValidUrl(apiConfig.url)) newErrors.apiUrl = "Invalid URL format (include http/https).";
        
        if (apiConfig.headers && !isValidJson(apiConfig.headers)) {
            newErrors.apiHeaders = "Headers must be valid JSON.";
        }
    }

    if (sourceType === 'sql' || sourceType === 'mongodb') {
        if (!apiKey) newErrors.general = "Gemini API Key required for DB analysis.";
        if (!dbConfig.query.trim()) {
            newErrors.dbQuery = "Query cannot be empty.";
        }
        
        if (dbConfig.useProxy) {
            if (!dbConfig.connectionString.trim()) {
                newErrors.dbConnection = "Connection string required.";
            }
        } else {
            if (!dbConfig.host.trim()) newErrors.dbHost = "Host is required.";
            if (!dbConfig.user.trim()) newErrors.dbUser = "User is required.";
            if (sourceType === 'mongodb' && !dbConfig.dbName.trim()) newErrors.dbName = "Database Name is required.";
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadSampleConfig = () => {
      if (sourceType === 'api') {
          setApiConfig({
              url: 'https://api.example.com/v1/sales_data',
              method: 'GET',
              headers: '{\n  "Authorization": "Bearer sample_token_123"\n}'
          });
      } else if (sourceType === 'sql') {
          setDbConfig({
              ...dbConfig,
              useProxy: true,
              connectionString: 'postgres://user:pass@localhost:5432/analytics',
              query: 'SELECT * FROM monthly_revenue WHERE year = 2024'
          });
      } else if (sourceType === 'mongodb') {
          setDbConfig({
              ...dbConfig,
              useProxy: true,
              connectionString: 'mongodb+srv://cluster0.example.net/analytics',
              query: '{\n  "find": "sales",\n  "filter": { "status": "completed" }\n}'
          });
      }
      // Reset errors
      setErrors({});
      setConnectionStatus('idle');
  };

  const handleFinalGenerate = () => {
      setHasAttemptedGenerate(true);
      if (!validateConfig()) return;
      
       const config: DataSourceConfig = {
        type: sourceType,
        demoId: sourceType === 'demo' ? selectedDemo : undefined,
        fileName: sourceType === 'file' ? fileData?.name : undefined,
        fileContent: sourceType === 'file' ? fileData?.content : undefined,
        fileSize: sourceType === 'file' ? fileData?.size : undefined,
        apiConfig: sourceType === 'api' ? { url: apiConfig.url, method: apiConfig.method, headers: apiConfig.headers } : undefined,
        dbConfig: (sourceType === 'mongodb' || sourceType === 'sql') ? {
            useProxy: dbConfig.useProxy,
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            query: dbConfig.query,
            dbName: dbConfig.dbName,
            collection: dbConfig.collection,
            connectionString: dbConfig.connectionString || `${sourceType}://${dbConfig.host}:${dbConfig.port}/${dbConfig.dbName}`
        } : undefined
      };

      onGenerate({
        period: timePeriod,
        type: analysisType,
        instructions
      }, config);
  };

  const handleSaveConnection = () => {
      if (!validateConfig()) return;
      
      let name = '';
      let details = '';

      if (sourceType === 'api') {
          name = `API: ${apiConfig.url.substring(0, 25)}${apiConfig.url.length > 25 ? '...' : ''}`;
          details = JSON.stringify(apiConfig);
      } else if (sourceType === 'sql' || sourceType === 'mongodb') {
          name = `${sourceType.toUpperCase()} DB: ${dbConfig.useProxy ? 'Connection String' : dbConfig.host}`;
          details = JSON.stringify(dbConfig);
      }

      if (name) {
          sessionService.addConnection({
              id: Date.now().toString(),
              type: sourceType,
              name,
              lastUsed: new Date(),
              details
          });
          setRecentConnections(sessionService.getRecentConnections());
          setConnectionStatus('success');
          setTimeout(() => setConnectionStatus('idle'), 1500);
      }
  };

  const restoreConnection = (connId: string) => {
      const conn = recentConnections.find(c => c.id === connId);
      if (!conn) return;

      try {
          if (conn.type === 'api') {
              const data = JSON.parse(conn.details);
              setApiConfig(data);
          } else if (conn.type === 'sql' || conn.type === 'mongodb') {
              const data = JSON.parse(conn.details);
              setDbConfig(data);
          }
          setErrors({});
          setConnectionStatus('idle');
      } catch (e) {
          console.error("Failed to restore connection", e);
      }
  };

  const processFile = (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        setFileError('File size exceeds 10MB limit.');
        setFileData(null);
        return;
      }

      const allowedTypes = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(file.type) && !['csv', 'json', 'xlsx'].includes(extension || '')) {
         setFileError('Invalid file type. Please upload CSV, JSON, or Excel.');
         setFileData(null);
         return;
      }

      setGranularStatus('Reading file...');
      const reader = new FileReader();
      reader.onload = (event) => {
        let content = event.target?.result as string;
        
        if (extension === 'csv' || file.type === 'text/csv') {
          try {
            setGranularStatus('Parsing CSV...');
            const parsed = parseCSV(content);
            content = JSON.stringify(parsed.slice(0, 100), null, 2);
            if (parsed.length > 100) {
              content += `\n...and ${parsed.length - 100} more rows.`;
            }
          } catch (e) {
            console.warn("CSV parse failed, using raw text");
          }
        }

        setFileData({ name: file.name, content, size: file.size });
        setFileError('');
        setGranularStatus('');
      };
      reader.onerror = () => {
          setFileError('Error reading file');
          setGranularStatus('');
      };
      reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Early check for API Key
    if (!apiKey) {
        setFileError("Gemini API Key required");
        return;
    }
    setFileError('');
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!apiKey) {
         setFileError("Gemini API Key required");
         return;
      }
      setFileError('');
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
  };

  const handleDeleteReport = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm('Delete this report?')) {
          reportService.deleteReport(id);
          setSavedReports(reportService.getHistory());
      }
  };

  const handleSendFeedback = () => {
      if (!feedbackText.trim()) return;
      setFeedbackStatus('sending');
      setTimeout(() => {
          setFeedbackStatus('sent');
          setFeedbackText('');
          setTimeout(() => {
              setShowFeedback(false);
              setFeedbackStatus('idle');
          }, 1500);
      }, 1000);
  };

  const testConnection = () => {
    setHasAttemptedGenerate(true);
    const valid = validateConfig();
    if (!valid) return;

    setConnectionStatus('testing');
    setGranularStatus('Resolving host...');
    
    // Simulate realistic connection steps
    setTimeout(() => {
        setGranularStatus('Authenticating...');
        setTimeout(() => {
            setGranularStatus('Validating schema...');
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    setConnectionStatus('success');
                    setGranularStatus('Ready');
                } else {
                    setConnectionStatus('error');
                    setGranularStatus('Timeout');
                }
                setTimeout(() => {
                    setConnectionStatus('idle');
                    setGranularStatus('');
                }, 3000);
            }, 800);
        }, 800);
    }, 800);
  };

  const filteredReports = savedReports.filter(r => r.title.toLowerCase().includes(historySearch.toLowerCase()));

  // Mobile Styles: Fixed overlay on mobile, static on desktop
  const containerClasses = `
    bg-brand-dark h-screen flex flex-col border-r border-gray-800 shadow-2xl z-40
    transition-transform duration-300 ease-in-out
    lg:relative lg:translate-x-0 lg:w-[400px] lg:flex-shrink-0
    fixed inset-y-0 left-0 w-80
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
    {/* Feedback Modal */}
    {showFeedback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-sm p-6 relative">
                 <button 
                    onClick={() => setShowFeedback(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                 >
                     <X size={20} />
                 </button>
                 
                 <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                         <MessageSquare size={20} />
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-white">Send Feedback</h3>
                         <p className="text-xs text-gray-400">Help us improve ReportGenius</p>
                     </div>
                 </div>

                 {feedbackStatus === 'sent' ? (
                     <div className="py-8 text-center">
                         <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4 animate-in zoom-in"/>
                         <p className="text-white font-bold">Feedback Sent!</p>
                         <p className="text-sm text-gray-400">Thank you for your input.</p>
                     </div>
                 ) : (
                     <>
                        <textarea 
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Tell us what you think or report a bug..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white placeholder-gray-500 h-32 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent resize-none mb-4"
                            autoFocus
                        />
                        <button 
                            onClick={handleSendFeedback}
                            disabled={!feedbackText.trim() || feedbackStatus === 'sending'}
                            className="w-full py-2.5 bg-brand-accent hover:bg-brand-accentHover text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {feedbackStatus === 'sending' ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                            ) : (
                                <>Send Feedback <Send size={16} /></>
                            )}
                        </button>
                     </>
                 )}
            </div>
        </div>
    )}

    {/* Mobile Backdrop */}
    {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={toggleSidebar}
        />
    )}

    <div id="sidebar" className={containerClasses}>
      {/* Header */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-brand-surface/10">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg overflow-hidden"
            style={{ backgroundColor: branding?.logoUrl ? 'transparent' : brandColor }}
          >
            {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
                <Activity className="text-white" size={22} />
            )}
          </div>
          <div>
              <h1 className="text-white font-bold text-lg tracking-tight">{branding?.companyName || "ReportGenius"}</h1>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">Enterprise Intelligence</p>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-white transition-colors lg:hidden bg-gray-800/50 p-2 rounded-lg">
            <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-brand-dark/50">
        <button
          id="sidebar-data-tab"
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all border-b-2 ${
            activeTab === 'data' 
                ? 'text-white bg-gray-800/50' 
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/30'
          }`}
          style={activeTab === 'data' ? { borderColor: brandColor } : {}}
        >
          <LayoutDashboard size={16} /> Data
        </button>
        <button
          id="sidebar-template-tab"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all border-b-2 ${
            activeTab === 'templates' 
                ? 'text-white bg-gray-800/50' 
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/30'
          }`}
          style={activeTab === 'templates' ? { borderColor: brandColor } : {}}
        >
          <LayoutTemplate size={16} /> Theme
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all border-b-2 ${
            activeTab === 'history' 
                ? 'text-white bg-gray-800/50' 
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/30'
          }`}
          style={activeTab === 'history' ? { borderColor: brandColor } : {}}
        >
          <History size={16} /> History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-dark p-5 space-y-8 pb-32">
        
        {activeTab === 'templates' && (
          <TemplateManager 
            currentUser={currentUser} 
            activeTemplateId={activeTemplate.id}
            onSelectTemplate={onSelectTemplate}
          />
        )}

        {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <History size={12} /> Saved Reports
                    </h2>
                </div>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                    <input 
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Search history..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none"
                    />
                </div>

                {filteredReports.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        {savedReports.length === 0 ? "No saved reports found. Generate one to see it here." : "No matching reports found."}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredReports.map(report => (
                            <div 
                                key={report.id}
                                onClick={() => onLoadReport?.(report.id)}
                                className="bg-gray-800/40 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-xl p-3 cursor-pointer transition-all group relative"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded bg-brand-dark text-gray-300">
                                            <FileBarChart2 size={14} style={{color: brandColor}}/>
                                        </div>
                                        <div className="text-sm font-bold text-gray-200 truncate max-w-[180px]">{report.title}</div>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDeleteReport(e, report.id)}
                                        className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Report"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>{report.date}</span>
                                    <span className="uppercase">{report.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'data' && (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                 <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Settings2 size={12} /> Connection Type
                 </h2>
                 <div title="Select a source to feed data into the AI engine." className="cursor-help">
                    <Info size={14} className="text-gray-500"/>
                 </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                 {[
                   { id: 'demo', icon: LayoutDashboard, label: 'Demo Data', desc: 'Instant Preview' },
                   { id: 'file', icon: FileSpreadsheet, label: 'Upload File', desc: 'CSV, JSON, XLSX' },
                   { id: 'api', icon: Network, label: 'REST API', desc: 'Connect Endpoint' },
                   { id: 'sql', icon: Database, label: 'SQL DB', desc: 'MySQL, Postgres' },
                   { id: 'mongodb', icon: Server, label: 'MongoDB', desc: 'NoSQL Database' },
                 ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSourceType(item.id as any); setErrors({}); setHasAttemptedGenerate(false); setGranularStatus(''); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 h-24 relative overflow-hidden group ${
                        sourceType === item.id 
                          ? 'text-white shadow-lg' 
                          : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-800'
                      }`}
                      style={sourceType === item.id ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                      title={item.desc}
                    >
                      {item.id === 'demo' && (
                          <span className="absolute top-1 right-1 text-[8px] bg-white/20 text-white px-1 rounded">RECO</span>
                      )}
                      <item.icon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className={`text-[9px] mt-1 ${sourceType === item.id ? 'text-white/80' : 'text-gray-500'}`}>{item.desc}</span>
                    </button>
                 ))}
              </div>

              {/* ... (Rest of existing sidebar code for configuration) ... */}
              <div className="mt-4 bg-gray-800/30 border border-gray-700 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {sourceType !== 'demo' && sourceType !== 'file' && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-bold text-gray-500">Recent Connections</span>
                        </div>
                        <select 
                            className="w-full bg-brand-dark border border-gray-600 rounded-lg p-2 text-xs text-gray-300 outline-none"
                            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                            onChange={(e) => restoreConnection(e.target.value)}
                        >
                            <option value="">Select a saved connection...</option>
                            {recentConnections.filter(c => c.type === sourceType).map(c => (
                                <option key={c.id} value={c.id}>{c.name} - {new Date(c.lastUsed).toLocaleDateString()}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                {sourceType === 'demo' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'sales', label: 'Sales Report', icon: FileText, desc: 'Revenue & Growth' },
                      { id: 'finance', label: 'Financial', icon: PieChart, desc: 'P&L, Balance Sheet' },
                      { id: 'hr', label: 'HR Metrics', icon: Users, desc: 'Retention & Hiring' },
                      { id: 'ops', label: 'Operations', icon: Briefcase, desc: 'Logistics & Supply' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedDemo(item.id)}
                        className={`text-left p-3 rounded-lg border transition-all group hover:scale-[1.02] ${
                          selectedDemo === item.id
                            ? 'bg-white/10'
                            : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                        }`}
                        style={selectedDemo === item.id ? { borderColor: brandColor } : {}}
                      >
                        <item.icon size={20} className="mb-2" style={{ color: selectedDemo === item.id ? brandColor : undefined }} />
                        <div className={`text-sm font-medium ${selectedDemo === item.id ? 'text-white' : 'text-gray-300'}`}>{item.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {sourceType === 'file' && (
                  <div className="text-center">
                    {!apiKey && (
                         <div className="mb-3 p-3 bg-blue-900/30 border border-blue-500/30 rounded text-[10px] text-blue-200 text-left relative">
                             <div className="flex items-start gap-2 mb-2">
                                <Info size={14} className="shrink-0 mt-0.5"/>
                                <span><strong>Why is a key needed?</strong><br/>
                                This is a browser-based AI tool. To analyze your file, we send the text securely to Google's Gemini AI. This requires a Google Gemini API key. 
                                </span>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                    onClick={onOpenSettings}
                                    className="flex-1 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded font-bold transition-colors border border-blue-500/30"
                                >
                                    Configure API Key
                                </button>
                                <button
                                    onClick={() => setSourceType('demo')}
                                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                                >
                                    Use Demo
                                </button>
                             </div>
                         </div>
                    )}
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all group relative overflow-hidden ${
                            isDragging 
                                ? 'bg-white/10 scale-105' 
                                : (errors.file || fileError) 
                                    ? 'border-red-500 bg-red-900/10' 
                                    : 'border-gray-600 hover:bg-gray-800/50'
                        }`}
                        style={isDragging ? { borderColor: brandColor } : {}}
                    >
                         <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileUpload} accept=".csv,.json,.xlsx,application/json" title="Click to upload or drag file here" />
                        
                         {isDragging ? (
                             <div className="animate-bounce flex flex-col items-center" style={{ color: brandColor }}>
                                 <UploadCloud size={32} />
                                 <span className="text-sm font-bold mt-2">Drop file here</span>
                             </div>
                         ) : (
                             <>
                                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform z-10">
                                    <UploadCloud className={(errors.file || fileError) ? "text-red-400" : "text-gray-400"} style={{ color: !(errors.file || fileError) ? undefined : undefined }} size={24} />
                                </div>
                                <span className="text-sm text-gray-300 font-medium z-10">{fileData?.name || "Drag & drop or click to browse"}</span>
                                <span className="text-xs text-gray-500 mt-1 z-10">Max 10MB • CSV, JSON, Excel</span>
                                {granularStatus && <span className="text-xs text-brand-accent mt-2 animate-pulse">{granularStatus}</span>}
                                <div className="flex gap-2 mt-3 opacity-50 z-10">
                                    <div title="CSV" className="bg-gray-700 p-1 rounded text-[8px] font-mono text-gray-300">CSV</div>
                                    <div title="JSON" className="bg-gray-700 p-1 rounded text-[8px] font-mono text-gray-300">JSON</div>
                                    <div title="Excel" className="bg-gray-700 p-1 rounded text-[8px] font-mono text-gray-300">XLSX</div>
                                </div>
                             </>
                         )}
                    </div>
                    
                    {/* Explicit File Error (e.g. Size/Type) or Missing Key from Validation */}
                    {(errors.file || fileError) && (
                        <div className="text-red-400 text-xs mt-2 flex flex-col items-center gap-1 animate-in fade-in">
                            <div className="flex items-center gap-1"><XCircle size={12}/> {errors.file || fileError}</div>
                            {(errors.file === "Gemini API Key required" || fileError === "Gemini API Key required") && (
                                <button onClick={onOpenSettings} className="underline text-[10px] hover:text-white">Open Settings</button>
                            )}
                        </div>
                    )}
                    
                    {fileData && !errors.file && !fileError && !granularStatus && (
                        <div className="mt-3 flex items-center justify-between text-xs text-green-400 bg-green-900/20 p-3 rounded-lg border border-green-900/50 animate-in zoom-in">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                <div className="flex flex-col items-start">
                                    <span className="font-bold text-white truncate max-w-[150px]">{fileData.name}</span>
                                    <span className="opacity-70">{formatFileSize(fileData.size)}</span>
                                </div>
                            </div>
                            <button onClick={() => {setFileData(null); setFileError('');}} className="p-1 hover:bg-green-900/30 rounded"><XCircle size={14}/></button>
                        </div>
                    )}
                  </div>
                )}
                
                {sourceType === 'api' && (
                   // ... (Same as original API section)
                   <div className="space-y-3">
                     {!apiKey && (
                         <div className="mb-3 p-3 bg-blue-900/30 border border-blue-500/30 rounded text-[10px] text-blue-200 text-left relative animate-in fade-in">
                             <div className="flex items-start gap-2 mb-2">
                                <Info size={14} className="shrink-0 mt-0.5"/>
                                <span><strong>Gemini API Key Required</strong><br/>
                                To simulate an API analysis, the AI engine requires a valid API Key.
                                </span>
                             </div>
                             <button 
                                onClick={onOpenSettings}
                                className="w-full py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded font-bold transition-colors border border-blue-500/30"
                             >
                                Configure API Key
                             </button>
                         </div>
                     )}
                     {/* ... API inputs ... */}
                      <div className="flex items-center justify-between">
                         <div title="Connect to a REST endpoint. The response must be JSON." className="text-[10px] text-gray-500 flex items-center gap-1 cursor-help">
                             <HelpCircle size={10}/> Help
                         </div>
                         <div className="flex gap-3">
                             <a href="#" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"><ExternalLink size={10}/> API Docs</a>
                             <button onClick={loadSampleConfig} className="text-[10px] text-brand-accent hover:text-white flex items-center gap-1">
                                 <Code size={10}/> Load Sample
                             </button>
                         </div>
                     </div>
                     <div className="flex gap-2">
                          <select 
                             value={apiConfig.method}
                             onChange={(e) => setApiConfig({...apiConfig, method: e.target.value as any})}
                             className="bg-brand-dark border border-gray-600 rounded-lg p-2 text-xs text-white outline-none"
                             title="HTTP Method"
                          >
                              <option>GET</option>
                              <option>POST</option>
                          </select>
                         <input 
                           type="text" 
                           placeholder="https://api.example.com/v1/analytics"
                           value={apiConfig.url}
                           onChange={(e) => setApiConfig({...apiConfig, url: e.target.value})}
                           className={`flex-1 bg-brand-dark border rounded-lg p-2 text-xs text-white outline-none placeholder-gray-600 ${errors.apiUrl ? 'border-red-500' : 'border-gray-600'}`}
                           title="Full Endpoint URL (including https://)"
                         />
                     </div>
                     {errors.apiUrl && <p className="text-red-400 text-[10px] flex items-center gap-1"><AlertCircle size={10}/> {errors.apiUrl}</p>}
                     
                     <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block flex justify-between">
                            <span>Headers (JSON)</span>
                            <span title="JSON object for Authorization headers or API keys" className="cursor-help">
                                <Info size={10} className="text-gray-600" />
                            </span>
                        </label>
                        <textarea 
                        value={apiConfig.headers}
                        onChange={(e) => setApiConfig({...apiConfig, headers: e.target.value})}
                        className={`w-full bg-brand-dark border rounded-lg p-2 text-xs text-white outline-none h-16 font-mono ${errors.apiHeaders ? 'border-red-500' : 'border-gray-600'}`}
                        placeholder='{ "Authorization": "Bearer ..." }'
                        title="Enter valid JSON headers"
                        />
                        {errors.apiHeaders && <p className="text-red-400 text-[10px] flex items-center gap-1"><AlertCircle size={10}/> {errors.apiHeaders}</p>}
                        {errors.general && <div className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.general}</div>}
                     </div>
                     
                     <div className="flex gap-2">
                         <button 
                            onClick={testConnection} 
                            disabled={!apiKey}
                            className={`flex-1 btn-secondary text-xs py-2 rounded-lg border hover:bg-gray-700 text-white transition-colors flex items-center justify-center gap-2 ${
                                connectionStatus === 'error' ? 'border-red-500 bg-red-900/20' : 
                                connectionStatus === 'success' ? 'border-green-500 bg-green-900/20' : 'border-gray-600'
                            } ${!apiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {connectionStatus === 'testing' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
                            {connectionStatus === 'idle' && "Test Connection"}
                            {connectionStatus === 'testing' && (granularStatus || "Connecting...")}
                            {connectionStatus === 'success' && <><CheckCircle2 size={14} className="text-green-400"/> Success</>}
                            {connectionStatus === 'error' && <><XCircle size={14} className="text-red-400"/> Failed</>}
                        </button>
                        <button 
                            onClick={handleSaveConnection}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg border border-gray-600 text-xs font-bold transition-colors" 
                            title="Save Connection"
                        >
                            <Settings2 size={14}/>
                        </button>
                     </div>
                   </div>
                )}
                
                {(sourceType === 'sql' || sourceType === 'mongodb') && (
                  // ... (Same as original DB section)
                  <div className="space-y-3">
                    {!apiKey && (
                         <div className="mb-3 p-3 bg-blue-900/30 border border-blue-500/30 rounded text-[10px] text-blue-200 text-left relative animate-in fade-in">
                             <div className="flex items-start gap-2 mb-2">
                                <Info size={14} className="shrink-0 mt-0.5"/>
                                <span><strong>Gemini API Key Required</strong><br/>
                                To simulate database analysis, the AI engine requires a valid API Key.
                                </span>
                             </div>
                             <button 
                                onClick={onOpenSettings}
                                className="w-full py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded font-bold transition-colors border border-blue-500/30"
                             >
                                Configure API Key
                             </button>
                         </div>
                     )}
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Config</span>
                        <div className="flex gap-3">
                            <a href="#" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"><BookOpen size={10}/> Guide</a>
                            <button onClick={loadSampleConfig} className="text-[10px] text-brand-accent hover:text-white flex items-center gap-1">
                                <Code size={10}/> Load Sample
                            </button>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-700">
                        <button
                            onClick={() => setDbConfig({...dbConfig, useProxy: true})}
                            className={`flex-1 py-1 text-[10px] rounded transition-colors ${dbConfig.useProxy ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Connection String
                        </button>
                        <button
                            onClick={() => setDbConfig({...dbConfig, useProxy: false})}
                            className={`flex-1 py-1 text-[10px] rounded transition-colors ${!dbConfig.useProxy ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Manual Fields
                        </button>
                    </div>
                     {/* ... inputs ... */}
                    {!dbConfig.useProxy && (
                        <div className="bg-yellow-900/20 border border-yellow-700/50 p-2 rounded text-[10px] text-yellow-200 flex gap-2 items-start">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5"/>
                            Warning: Direct DB connection from browser is insecure. Use a proxy or connection string for production.
                        </div>
                    )}
                     <div className="space-y-2">
                        {dbConfig.useProxy ? (
                            <div>
                                <input 
                                    type="text" 
                                    placeholder={sourceType === 'mongodb' ? "mongodb+srv://..." : "postgres://..."}
                                    value={dbConfig.connectionString}
                                    onChange={(e) => setDbConfig({...dbConfig, connectionString: e.target.value})}
                                    className={`w-full bg-brand-dark border rounded-lg p-2 text-xs text-white outline-none ${errors.dbConnection ? 'border-red-500' : 'border-gray-600'}`}
                                    title="Enter full connection URI"
                                />
                                {errors.dbConnection && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.dbConnection}</p>}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <input 
                                            type="text" 
                                            placeholder="Host" 
                                            value={dbConfig.host}
                                            onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})}
                                            className={`w-full bg-brand-dark border rounded-lg p-2 text-xs text-white ${errors.dbHost ? 'border-red-500' : 'border-gray-600'}`}
                                            title="Database Host IP or Domain"
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Port" 
                                        value={dbConfig.port}
                                        onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})}
                                        className="bg-brand-dark border border-gray-600 rounded-lg p-2 text-xs text-white"
                                        title="Port Number"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="User" 
                                        value={dbConfig.user}
                                        onChange={(e) => setDbConfig({...dbConfig, user: e.target.value})}
                                        className={`bg-brand-dark border rounded-lg p-2 text-xs text-white ${errors.dbUser ? 'border-red-500' : 'border-gray-600'}`}
                                        title="Database Username"
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Password" 
                                        value={dbConfig.password}
                                        onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})}
                                        className="bg-brand-dark border border-gray-600 rounded-lg p-2 text-xs text-white"
                                        title="Database Password"
                                    />
                                </div>
                                {sourceType === 'mongodb' && (
                                     <input 
                                        type="text" 
                                        placeholder="Database Name" 
                                        value={dbConfig.dbName}
                                        onChange={(e) => setDbConfig({...dbConfig, dbName: e.target.value})}
                                        className={`w-full bg-brand-dark border rounded-lg p-2 text-xs text-white ${errors.dbName ? 'border-red-500' : 'border-gray-600'}`}
                                        title="Target Database Name"
                                    />
                                )}
                            </>
                        )}
                         <div>
                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Query / Filter</label>
                            <textarea 
                                placeholder={sourceType === 'sql' ? "SELECT * FROM sales_2024..." : '{"$match": ...}'}
                                value={dbConfig.query}
                                onChange={(e) => setDbConfig({...dbConfig, query: e.target.value})}
                                className={`w-full bg-brand-dark border rounded-lg p-2 text-xs text-white outline-none h-20 font-mono ${errors.dbQuery ? 'border-red-500' : 'border-gray-600'}`}
                                title="SQL Query or Mongo Aggregation Pipeline"
                            />
                            {errors.dbQuery && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.dbQuery}</p>}
                            {errors.general && <div className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12}/> {errors.general}</div>}
                         </div>

                         <div className="flex gap-2">
                            <button 
                                onClick={testConnection} 
                                disabled={!apiKey}
                                className={`flex-1 btn-secondary text-xs py-2 rounded-lg border hover:bg-gray-700 text-white transition-colors flex items-center justify-center gap-2 ${
                                    connectionStatus === 'error' ? 'border-red-500 bg-red-900/20' : 
                                    connectionStatus === 'success' ? 'border-green-500 bg-green-900/20' : 'border-gray-600'
                                } ${!apiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {connectionStatus === 'testing' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
                                {connectionStatus === 'idle' && "Test Connection"}
                                {connectionStatus === 'testing' && (granularStatus || "Connecting...")}
                                {connectionStatus === 'success' && <><CheckCircle2 size={14} className="text-green-400"/> Success</>}
                                {connectionStatus === 'error' && <><XCircle size={14} className="text-red-400"/> Failed</>}
                            </button>
                            <button 
                                onClick={handleSaveConnection}
                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg border border-gray-600 text-xs font-bold transition-colors" 
                                title="Save Connection"
                            >
                                <Settings2 size={14}/>
                            </button>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline Progress */}
            {isGenerating && (
                 <div className="mb-8 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <Activity size={12} className="animate-pulse" style={{color: brandColor}}/> Generating...
                        </h2>
                        <span className="text-xs font-mono" style={{color: brandColor}}>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4 overflow-hidden">
                        <div 
                            className="h-1.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,188,212,0.6)]" 
                            style={{width: `${progressPercent}%`, backgroundColor: brandColor}}
                        />
                    </div>
                    <div className="space-y-3 pl-2 relative">
                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-800" />
                        {PIPELINE_STEPS.map((step, index) => {
                        const isActive = pipelineStage === index;
                        const isComplete = pipelineStage > index;
                        return (
                            <div key={step} className="relative flex items-center gap-3 z-10">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    isComplete ? 'bg-green-500 border-green-500' : isActive ? 'bg-brand-dark' : 'bg-brand-dark border-gray-700'
                                }`}
                                style={isActive ? { borderColor: brandColor } : {}}
                                >
                                    {isComplete && <CheckCircle2 size={14} className="text-white" />}
                                    {isActive && <div className="w-2 h-2 rounded-full animate-ping" style={{backgroundColor: brandColor}} />}
                                </div>
                                <span className={`text-xs font-medium ${isComplete || isActive ? 'text-white' : 'text-gray-600'}`}>{step}</span>
                            </div>
                        );
                        })}
                    </div>
                </div>
            )}

            {/* Analysis Context */}
            {!isGenerating && (
                <div id="analysis-context-area">
                    <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock size={12} /> Analysis Context
                    </h2>
                    <div className="space-y-4 bg-gray-800/30 p-4 rounded-xl border border-gray-700">
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Time Period</label>
                            <select 
                                value={timePeriod} 
                                onChange={(e) => setTimePeriod(e.target.value)} 
                                className="w-full bg-brand-dark border border-gray-600 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-accent transition-all"
                                title="Select the specific period for analysis"
                            >
                                <option value="Q2 2024">Q2 2024 (Current)</option>
                                <option value="Q1 2024">Q1 2024</option>
                                <option value="FY 2023">FY 2023</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-2 block">Focus</label>
                            <div className="flex flex-wrap gap-2">
                                {['Trends', 'Anomalies', 'Forecast', 'Benchmarks'].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setAnalysisType(item as any)}
                                    className={`px-3 py-1.5 rounded-md text-xs border transition-all flex items-center gap-2 ${
                                    analysisType === item ? 'bg-white/10 text-white' : 'bg-brand-dark border-gray-600 text-gray-400'
                                    }`}
                                    style={analysisType === item ? { borderColor: brandColor } : {}}
                                    title={`Focus analysis on ${item}`}
                                >
                                    {item}
                                </button>
                                ))}
                            </div>
                        </div>
                        <textarea 
                            value={instructions} 
                            onChange={(e) => setInstructions(e.target.value)} 
                            placeholder="Specific instructions..." 
                            className="w-full bg-brand-dark border border-gray-600 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-accent transition-all h-20"
                            title="Add any specific business context or questions for the AI"
                        />
                    </div>
                </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 bg-brand-surface/30 backdrop-blur-sm absolute bottom-0 w-full z-20">
        {isGenerating ? (
             <button 
                onClick={onCancel}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
            >
                <XCircle size={18} /> Cancel Generation
            </button>
        ) : (
            <div className="space-y-2">
                {hasErrors && (
                    <div className="text-[10px] text-red-400 text-center animate-pulse flex items-center justify-center gap-1">
                        <AlertCircle size={10} /> Please resolve configuration errors above
                    </div>
                )}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFeedback(true)}
                        className="p-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors border border-gray-700"
                        title="Send Feedback"
                    >
                        <MessageSquare size={18} />
                    </button>
                    <button 
                        id="generate-btn"
                        onClick={handleFinalGenerate}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                            hasErrors
                            ? 'bg-gray-800 opacity-50 cursor-not-allowed border border-gray-700' 
                            : 'hover:scale-[1.02]'
                        }`}
                        style={!hasErrors ? { backgroundColor: brandColor, boxShadow: `0 4px 14px 0 ${brandColor}40` } : {}}
                    >
                        <Play size={18} fill="currentColor" />
                        Generate Intelligence
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Sidebar;
