
import React, { useState, useRef, useEffect } from 'react';
import { 
    Save, 
    LayoutDashboard, 
    FileText, 
    User as UserIcon, 
    LogOut, 
    FileSpreadsheet, 
    Presentation, 
    DownloadCloud,
    CalendarClock,
    Share2,
    Users,
    CheckCircle2, 
    X,
    Printer,
    Moon,
    Sun,
    Settings,
    FileJson,
    HelpCircle,
    Maximize2,
    Menu,
    BarChart,
    PieChart,
    ChevronRight,
    Home,
    Copy,
    Mail,
    Lock,
    Globe,
    RefreshCw
} from 'lucide-react';
import { User, ReportViewMode, ScheduleConfig, ReportData } from '../types';

interface TopNavProps {
  user: User | null;
  onLogout: () => void;
  viewMode: ReportViewMode;
  setViewMode: (mode: ReportViewMode) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  branding?: { logoUrl?: string; primaryColor?: string; companyName?: string; };
  reportData?: ReportData | null;
  onToggleFocus?: () => void;
  onToggleSidebar?: () => void;
  onBackToDashboard?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

const TopNav: React.FC<TopNavProps> = ({ user, onLogout, viewMode, setViewMode, isDarkMode, toggleDarkMode, branding, reportData, onToggleFocus, onToggleSidebar, onBackToDashboard, addToast }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Modals State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareAccess, setShareAccess] = useState<'view' | 'edit'>('view');
  const [copied, setCopied] = useState(false);

  // Mock Schedule Data
  const [schedule, setSchedule] = useState<ScheduleConfig>({
      isActive: false,
      frequency: 'Weekly',
      time: '09:00',
      recipients: [],
      format: 'PDF'
  });
  
  const brandColor = branding?.primaryColor || '#00BCD4';
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
            setShowProfileMenu(false);
        }
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setShowExportMenu(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: string) => {
      if (isExporting) return;
      setIsExporting(true);
      setShowExportMenu(false);
      addToast?.('info', `Generating ${format} export...`);
      
      try {
          if (format === 'PDF') {
               const element = document.getElementById('report-container');
               if (element && (window as any).html2pdf) {
                   // Ensure no hidden elements cause issues
                   const originalStyle = element.getAttribute('style');
                   
                   // Force visibility logic for PDF capture
                   element.style.width = '100%';
                   element.style.maxWidth = 'none';
                   element.style.display = 'block';
                   element.style.height = 'auto';
                   element.style.overflow = 'visible';
                   
                   const opt = {
                       margin: [10, 10, 10, 10],
                       filename: reportData ? `${reportData.title.replace(/\s+/g, '_')}.pdf` : 'report.pdf',
                       image: { type: 'jpeg', quality: 0.98 },
                       html2canvas: { 
                           scale: 2, 
                           useCORS: true, 
                           logging: false,
                           windowWidth: 1200 // Force desktop width render
                       },
                       jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                       pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                   };
                   
                   // @ts-ignore
                   await (window as any).html2pdf().set(opt).from(element).save();
                   
                   // Restore style safely
                   if (originalStyle) {
                       element.setAttribute('style', originalStyle);
                   } else {
                       element.removeAttribute('style');
                   }
               } else {
                   // Fallback if library missing
                   window.print();
               }
          } else if (format === 'Print') {
              window.print();
          } else if (format === 'Excel' || format === 'Tableau' || format === 'PowerBI') {
              if (reportData) {
                  // Generate proper CSV with escaping
                  const escapeCsv = (str: string | number) => {
                      const stringValue = String(str);
                      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                          return `"${stringValue.replace(/"/g, '""')}"`;
                      }
                      return stringValue;
                  };

                  let headers = ['Category', 'Primary_Metric', 'Secondary_Metric', 'Contribution_Pct'];
                  let rows = reportData.tableData.map(row => 
                      [row.category, row.primary, row.secondary, row.contribution].map(escapeCsv).join(',')
                  );

                  // Specialized Headers for BI Tools
                  if (format === 'Tableau' || format === 'PowerBI') {
                      headers = ['Region/Segment', 'Current_Period_Value', 'Previous_Period_Value', 'Growth_Contribution', 'Report_Date', 'Source'];
                      rows = reportData.tableData.map(row => 
                        [row.category, row.primary, row.secondary, row.contribution, reportData.date, 'ReportGenius_AI'].map(escapeCsv).join(',')
                      );
                  }

                  const csvContent = [headers.join(','), ...rows].join('\n');
                  const ext = format === 'Excel' ? 'csv' : 'txt'; // Tableau prefers txt/csv
                  downloadFile(`${reportData.title.replace(/\s+/g, '_')}_${format}.${ext}`, csvContent, "text/csv");
              } else {
                   throw new Error("No data");
              }
          } else if (format === 'PPT') {
              if (reportData) {
                  // Generate a structured "Slide Deck" text representation
                  const slides = [
                      `SLIDE 1: Title\n=================================\n${reportData.title}\n${reportData.audience}\n${reportData.date}\n`,
                      `SLIDE 2: Executive Summary\n=================================\n${reportData.summary}\n`,
                      `SLIDE 3: Key Metrics\n=================================\n${reportData.metrics.map(m => `- ${m.label}: ${m.value} (${m.trend > 0 ? '+' : ''}${m.trend}%)`).join('\n')}\n`,
                      `SLIDE 4: Top Insights\n=================================\n${reportData.insights.map(i => `- ${i}`).join('\n')}\n`,
                      `SLIDE 5: Strategic Recommendations\n=================================\n${reportData.recommendations.map(r => `- ${r}`).join('\n')}\n`
                  ].join('\n\n---------------------------------\n\n');
                  
                  downloadFile(`${reportData.title.replace(/\s+/g, '_')}_presentation.txt`, slides, "text/plain");
              } else {
                   throw new Error("No data");
              }
          } else if (format === 'JSON') {
              if (reportData) {
                  const jsonContent = JSON.stringify(reportData, null, 2);
                  downloadFile(`${reportData.id}_full.json`, jsonContent, "application/json");
              } else {
                   throw new Error("No data");
              }
          }
          addToast?.('success', `${format} export completed successfully`);
      } catch (e) {
          console.error(e);
          addToast?.('error', `Failed to export ${format}. See console for details.`);
      } finally {
          setIsExporting(false);
      }
  };

  const copyShareLink = () => {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast?.('success', 'Link copied to clipboard');
  };

  const ShareModal = () => (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X size={20}/>
              </button>
              
              <div className="mb-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                      <Share2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Share Report</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invite team members or copy a link to share.</p>
              </div>

              <div className="space-y-4">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Share via Email</label>
                      <div className="flex gap-2">
                          <div className="relative flex-1">
                              <Mail size={16} className="absolute left-3 top-3 text-gray-400"/>
                              <input 
                                  type="email" 
                                  value={shareEmail}
                                  onChange={(e) => setShareEmail(e.target.value)}
                                  placeholder="colleague@company.com" 
                                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                              />
                          </div>
                          <select 
                              value={shareAccess}
                              onChange={(e) => setShareAccess(e.target.value as any)}
                              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-sm text-gray-700 dark:text-gray-300 outline-none"
                          >
                              <option value="view">Can View</option>
                              <option value="edit">Can Edit</option>
                          </select>
                      </div>
                      <button className="mt-2 w-full py-2 bg-brand-accent hover:bg-brand-accentHover text-white rounded-lg text-sm font-bold transition-colors">
                          Send Invite
                      </button>
                  </div>

                  <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or copy link</span>
                      </div>
                  </div>

                  <div>
                      <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Public Link</label>
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                              <Globe size={10} /> Anyone with link can view
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              readOnly 
                              value="https://app.reportgenius.ai/r/RPT-2024-Q2-001" 
                              className="flex-1 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 select-all outline-none"
                          />
                          <button 
                              onClick={copyShareLink}
                              className={`px-4 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          >
                              {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
                              {copied ? 'Copied' : 'Copy'}
                          </button>
                      </div>
                  </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
                  <div className="flex -space-x-2">
                       <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center border-2 border-white dark:border-gray-800 text-[10px]">JD</div>
                       <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center border-2 border-white dark:border-gray-800 text-[10px]">AS</div>
                       <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800 text-[10px]">+3</div>
                  </div>
                  <span>5 people have access</span>
              </div>
          </div>
      </div>
  );

  return (
    <nav className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm transition-colors duration-300 no-print">
      {showShareModal && <ShareModal />}
      
      <div className="flex items-center gap-4">
         {/* Mobile Toggle */}
         <button 
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
         >
             <Menu size={24}/>
         </button>

         {/* Breadcrumbs for easier navigation */}
         <div className="flex items-center text-sm">
             <button onClick={onBackToDashboard} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 flex items-center gap-1 transition-colors" title="Go to Home">
                 <Home size={16} /> <span className="hidden sm:inline font-medium">Home</span>
             </button>
             {reportData && (
                 <>
                    <ChevronRight size={14} className="text-gray-400 mx-1" />
                    <button onClick={onBackToDashboard} className="font-medium text-gray-500 dark:text-gray-400 hover:text-brand-accent dark:hover:text-brand-accent hover:underline transition-colors">Reports</button>
                    <ChevronRight size={14} className="text-gray-400 mx-1" />
                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">{reportData.title}</span>
                 </>
             )}
         </div>
         
         {/* View Mode Toggler - Desktop */}
         {reportData && (
            <div id="view-mode-toggle" className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg items-center hidden sm:flex ml-4">
                <button 
                    onClick={() => setViewMode('document')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'document' 
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    <FileText size={14} /> Document
                </button>
                <button 
                    onClick={() => setViewMode('dashboard')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'dashboard' 
                        ? 'bg-white dark:bg-gray-700 shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    style={viewMode === 'dashboard' ? { color: brandColor } : {}}
                >
                    <LayoutDashboard size={14} /> Dashboard
                </button>
            </div>
         )}
      </div>

      <div className="flex items-center gap-3">
        {/* Action Buttons */}
        <div className="flex items-center gap-2 mr-4 border-r border-gray-200 dark:border-gray-700 pr-4">
             {/* Refresh Button */}
             {reportData && (
                 <button
                    onClick={() => { addToast?.('info', 'Refreshing data connections...'); setTimeout(() => addToast?.('success', 'Data updated'), 1500); }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors hidden sm:block"
                    title="Refresh Data"
                >
                    <RefreshCw size={16} />
                </button>
             )}

            <div className="group relative flex items-center justify-center hidden sm:flex">
                <div className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help">
                    <HelpCircle size={16} />
                </div>
                <div className="absolute top-full mt-2 right-0 w-48 bg-gray-800 text-white text-xs p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    <div className="font-bold mb-2 border-b border-gray-600 pb-1">Shortcuts</div>
                    <div className="flex justify-between mb-1"><span>?</span> <span className="text-gray-400">Show Help</span></div>
                    <div className="flex justify-between mb-1"><span>n</span> <span className="text-gray-400">New Analysis</span></div>
                    <div className="flex justify-between mb-1"><span>/</span> <span className="text-gray-400">Search</span></div>
                </div>
            </div>

            <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                title="Toggle Dark Mode"
            >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

             {reportData && onToggleFocus && (
                <button
                    onClick={onToggleFocus}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors hidden sm:block"
                    title="Enter Focus Mode"
                >
                    <Maximize2 size={16} />
                </button>
            )}

            {reportData && (
                <>
                <button 
                    onClick={() => setShowScheduleModal(true)}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold ${
                        schedule.isActive ? 'bg-brand-accent/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                    style={schedule.isActive ? { color: brandColor } : {}}
                >
                    <CalendarClock size={16} />
                    <span className="hidden lg:inline">{schedule.isActive ? 'Scheduled' : 'Schedule'}</span>
                </button>
                
                <button 
                    onClick={() => setShowShareModal(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                >
                    <Share2 size={16} />
                    <span className="hidden lg:inline">Share</span>
                </button>
                </>
            )}
        </div>

        {reportData && (
            <div className="relative" ref={exportMenuRef}>
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
                >
                    {isExporting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
                    <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
                </button>
                {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in duration-200">
                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Document Formats</div>
                        <button onClick={() => handleExport('PDF')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><Printer size={14} className="text-gray-400"/> Download PDF</button>
                        <button onClick={() => handleExport('Print')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><Printer size={14} className="text-gray-400"/> Print View</button>
                        <button onClick={() => handleExport('Excel')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><FileSpreadsheet size={14} className="text-green-500"/> Excel (.csv)</button>
                        <button onClick={() => handleExport('PPT')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><Presentation size={14} className="text-orange-500"/> Slide Deck (.txt)</button>
                        
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Enterprise Integration</div>
                        <button onClick={() => handleExport('Tableau')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><BarChart size={14} className="text-blue-600"/> Export for Tableau</button>
                        <button onClick={() => handleExport('PowerBI')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><PieChart size={14} className="text-yellow-500"/> Export for PowerBI</button>
                        
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                        <button onClick={() => handleExport('JSON')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><FileJson size={14} className="text-blue-400"/> Raw JSON</button>
                    </div>
                )}
            </div>
        )}
        
        {user && (
          <div className="relative ml-2" ref={profileMenuRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center overflow-hidden">
                 {user.avatar ? <img src={user.avatar} alt={user.name} /> : <UserIcon size={16} style={{color: brandColor}} />}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                   <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                   <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-brand-accent/10 rounded-full font-bold uppercase" style={{color: brandColor}}>{user.role}</span>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 dark:text-gray-300">
                     <Settings size={14} /> Settings
                </button>
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 flex items-center gap-2 mt-1"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </nav>
  );
};

export default TopNav;
