
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import ReportView from './components/ReportView';
import DataAssistant from './components/DataAssistant';
import AuthScreen from './components/AuthScreen';
import DashboardHome from './components/DashboardHome';
import Toast, { ToastMessage } from './components/Toast';
import SettingsModal from './components/SettingsModal';
import OnboardingTutorial from './components/OnboardingTutorial';
import DataQualityModal from './components/DataQualityModal';
import ErrorBoundary from './components/ErrorBoundary';

import { ReportData, PipelineStage, AnalysisContext, User, ReportTemplate, DataSourceConfig, ReportViewMode, UserSettings } from './types';
import { authService } from './services/authService';
import { templateService } from './services/templateService';
import { reportService } from './services/reportService';
import { sessionService } from './services/SessionService';
import { ReportOrchestrator } from './agents/ReportOrchestrator';
import { LayoutGrid, MessageSquare, Minimize2, Plus, AlertTriangle, Keyboard, X } from 'lucide-react';
import { DEMO_SALES_REPORT } from './constants';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App State
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>(PipelineStage.Collection);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'report' | 'chat'>('report');
  const [activeTemplate, setActiveTemplate] = useState<ReportTemplate | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [viewMode, setViewMode] = useState<ReportViewMode>('document');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Settings & Onboarding
  const [userSettings, setUserSettings] = useState<UserSettings>({
      theme: 'dark',
      language: 'en',
      notifications: { email: true, browser: true },
      autoSave: true,
      defaultDataSource: 'demo',
      onboardingComplete: false,
      branding: {
          primaryColor: '#00BCD4',
          companyName: 'ReportGenius'
      },
      // Initialize with env variable if available
      apiKey: process.env.API_KEY || ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Data Quality
  const [showDataQuality, setShowDataQuality] = useState(false);
  const [pendingFile, setPendingFile] = useState<{name: string, content: string, size: number} | null>(null);
  const [pendingGeneration, setPendingGeneration] = useState<{context: AnalysisContext, config: DataSourceConfig} | null>(null);
  
  // Custom Confirmation for New Analysis
  const [showNewAnalysisConfirm, setShowNewAnalysisConfirm] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      setUser(session.user);
      sessionService.createSession(session.user.id); // Init Session
      
      const templates = templateService.getTemplates(session.user.id);
      setActiveTemplate(templates[0]);
      
      // Load settings
      const savedSettings = localStorage.getItem('rg_user_settings');
      if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          // Inject env key if missing in saved settings (e.g. newly added to .env)
          if (!parsed.apiKey && process.env.API_KEY) {
              parsed.apiKey = process.env.API_KEY;
          }
          setUserSettings(parsed);
          if (!parsed.onboardingComplete) setShowTutorial(true);
          if (parsed.theme === 'light') setIsDarkMode(false);
          else if (parsed.theme === 'dark') setIsDarkMode(true);
      } else {
          setShowTutorial(true);
      }

      // Seed history for comparison feature if empty
      const history = reportService.getHistory();
      if (history.length === 0) {
          // Create a historical version of the demo report
          const historicalReport = {
              ...DEMO_SALES_REPORT,
              id: "RPT-HIST-Q1",
              title: "Q1 2024 Sales Performance Review",
              date: "3/31/2024",
              metrics: DEMO_SALES_REPORT.metrics.map(m => ({
                  ...m,
                  value: (parseInt(m.value.toString().replace(/,/g, '')) * 0.85).toFixed(0),
                  trend: m.trend - 2
              }))
          };
          reportService.saveReport(historicalReport);
      }
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (user && !activeTemplate) {
      const templates = templateService.getTemplates(user.id);
      setActiveTemplate(templates[0]);
    }
  }, [user, activeTemplate]);

  // Global Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Ignore if input is active
          if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

          if (e.key === '?') {
              setShowShortcuts(prev => !prev);
          }
          if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
             e.preventDefault();
             addToast('info', 'Focus Search (Demo)');
          }
          if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              triggerNewReport();
          }
          if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              confirmNewReportAction();
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionService.createSession(loggedInUser.id);
    addToast('success', `Welcome back, ${loggedInUser.name}`);
    if (!localStorage.getItem('rg_user_settings')) {
        setShowTutorial(true);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setReportData(null);
    setActiveTemplate(null);
    setShowTutorial(false);
  };

  const triggerNewReport = () => {
      if (reportData) {
          setShowNewAnalysisConfirm(true);
      } else {
          confirmNewReportAction();
      }
  };

  const confirmNewReportAction = () => {
      setReportData(null);
      setPipelineStage(PipelineStage.Collection);
      setSidebarOpen(true);
      setIsFocusMode(false);
      setActiveMainTab('report');
      setShowNewAnalysisConfirm(false);
      addToast('info', 'Ready for new analysis');
  };

  const handleLoadReport = (id: string) => {
      const report = reportService.loadReport(id);
      if (report) {
          setReportData(report);
          setSidebarOpen(false); 
          addToast('success', `Loaded "${report.title}"`);
      } else {
          addToast('error', 'Failed to load report.');
      }
  };

  const handleReportUpdate = (updatedReport: ReportData) => {
      setReportData(updatedReport);
      if (userSettings.autoSave) {
          reportService.saveReport(updatedReport);
      }
  };

  const animatePipeline = async (signal: AbortSignal) => {
    const stages = [
      PipelineStage.Collection,
      PipelineStage.Analysis,
      PipelineStage.Visualization,
      PipelineStage.ReportGen,
      PipelineStage.Delivery,
      PipelineStage.Complete
    ];

    for (const stage of stages) {
      if (signal.aborted) return;
      setPipelineStage(stage);
      await new Promise(resolve => setTimeout(resolve, stage === PipelineStage.Analysis ? 1200 : 600));
    }
  };

  const handleCancel = () => {
      if (abortController) {
          abortController.abort();
          setIsGenerating(false);
          setPipelineStage(PipelineStage.Collection);
          addToast('info', 'Generation cancelled');
      }
  };

  const handleGenerateRequest = (context: AnalysisContext, sourceConfig: DataSourceConfig) => {
      if (sourceConfig.type === 'file' && sourceConfig.fileContent) {
          setPendingFile({
              name: sourceConfig.fileName || 'data.csv',
              content: sourceConfig.fileContent,
              size: sourceConfig.fileSize || 0
          });
          setPendingGeneration({ context, config: sourceConfig });
          setShowDataQuality(true);
          return;
      }
      startGeneration(context, sourceConfig);
  };

  const proceedFromDataQuality = () => {
      setShowDataQuality(false);
      if (pendingGeneration) {
          startGeneration(pendingGeneration.context, pendingGeneration.config);
          setPendingGeneration(null);
      }
  };

  const startGeneration = async (context: AnalysisContext, sourceConfig: DataSourceConfig) => {
    setIsGenerating(true);
    setReportData(null); 
    setPipelineStage(PipelineStage.Collection);
    setActiveMainTab('report');
    setSidebarOpen(true); // Keep open to show progress
    
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
        const animationPromise = animatePipeline(controller.signal);
        
        // Use the new Orchestrator
        const orchestrator = new ReportOrchestrator(userSettings.apiKey);
        const dataPromise = orchestrator.generateReport(
            context, 
            sourceConfig, 
            activeTemplate || templateService.getTemplates(user!.id)[0]
        );

        const data = await dataPromise;
        if (controller.signal.aborted) return;

        await animationPromise;
        
        setReportData(data);
        
        // Save using new SessionService and existing ReportService
        if (userSettings.autoSave) {
            reportService.saveReport(data);
            sessionService.addToHistory(data);
        }

        setSidebarOpen(false);
        addToast('success', 'Report generated successfully');
    } catch (e: any) {
        console.error("Generation failed", e);
        
        let msg = "An unexpected error occurred during generation.";
        if (e.message.includes("API Key is missing")) {
            msg = "Missing API Key. Please check your Settings.";
        }
        
        addToast('error', msg);
        setPipelineStage(PipelineStage.Collection); 
    } finally {
        setIsGenerating(false);
        setAbortController(null);
    }
  };

  const handleTemplateUpdate = (updatedTemplate: ReportTemplate) => {
    templateService.saveTemplate(updatedTemplate);
    setActiveTemplate(updatedTemplate);
  };

  const toggleDarkMode = () => {
      const newTheme = !isDarkMode ? 'dark' : 'light';
      setIsDarkMode(!isDarkMode);
      handleUpdateSettings({...userSettings, theme: newTheme});
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
      setUserSettings(newSettings);
      localStorage.setItem('rg_user_settings', JSON.stringify(newSettings));
      // Also update session service
      sessionService.savePreference('theme', newSettings.theme);
      
      if (newSettings.theme === 'dark') setIsDarkMode(true);
      else if (newSettings.theme === 'light') setIsDarkMode(false);
  };

  const completeOnboarding = () => {
      setShowTutorial(false);
      handleUpdateSettings({...userSettings, onboardingComplete: true});
  };

  const handleCheckDataQuality = (file: {name: string, content: string, size: number}) => {
      setPendingFile(file);
      setShowDataQuality(true);
      setPendingGeneration(null);
  };

  // Skeleton Loader Component (Internal for now)
  const SkeletonLoader = () => (
      <div className="max-w-5xl mx-auto p-8 space-y-8 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl w-3/4 mb-8"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>)}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-8"></div>
          <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
          </div>
      </div>
  );

  const ShortcutsModal = () => (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
              <button onClick={() => setShowShortcuts(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X size={20}/>
              </button>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Keyboard size={20}/> Keyboard Shortcuts</h3>
              <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">New Analysis</span>
                      <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-bold font-mono">n</kbd>
                  </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Go Home</span>
                      <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-bold font-mono">h</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Focus Search</span>
                      <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-bold font-mono">/</kbd>
                  </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Show Help</span>
                      <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-bold font-mono">?</kbd>
                  </div>
              </div>
          </div>
      </div>
  );

  if (authLoading) {
    return <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!user) {
    return (
      <ErrorBoundary componentName="Authentication Screen">
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </ErrorBoundary>
    );
  }

  const renderMainContent = () => {
    if (isGenerating) {
        return <SkeletonLoader />;
    }

    if (!reportData) {
        return (
            <DashboardHome 
                user={user}
                onNewReport={confirmNewReportAction}
                onLoadReport={handleLoadReport}
                recentReports={reportService.getHistory()}
            />
        );
    }

    if (activeMainTab === 'report') {
        return (
            <ErrorBoundary componentName="Report View">
                <ReportView 
                    data={reportData} 
                    isGenerating={isGenerating} 
                    template={activeTemplate || templateService.getTemplates(user.id)[0]}
                    onUpdateTemplate={handleTemplateUpdate}
                    onReportUpdate={handleReportUpdate}
                    viewMode={viewMode}
                    branding={userSettings.branding}
                    user={user}
                    isVisible={activeMainTab === 'report'}
                    addToast={addToast}
                    isDarkMode={isDarkMode}
                />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary componentName="Data Assistant">
            <DataAssistant 
                reportData={reportData}
                apiKey={userSettings.apiKey}
            />
        </ErrorBoundary>
    );
  };

  return (
    <ErrorBoundary componentName="Application Root">
    <div className={`${isDarkMode ? 'dark' : ''}`}>
    <div 
        className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300"
        style={{ '--brand-primary': userSettings.branding?.primaryColor || '#00BCD4' } as React.CSSProperties}
    >
      
      <div className="fixed top-5 right-5 z-[120] flex flex-col items-end pointer-events-none">
          {toasts.map(toast => (
              <Toast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
      </div>

      <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          currentSettings={userSettings}
          onSave={handleUpdateSettings}
      />

      <DataQualityModal 
          isOpen={showDataQuality}
          onClose={pendingGeneration ? proceedFromDataQuality : () => setShowDataQuality(false)}
          fileName={pendingFile?.name}
          fileContent={pendingFile?.content}
      />
      
      {showShortcuts && <ShortcutsModal />}

      {/* New Report Confirmation Modal */}
      {showNewAnalysisConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-6 animate-in zoom-in duration-200">
                  <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                          <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Start New Analysis?</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                          This will clear your current report view. Make sure you have exported any data you wish to keep.
                      </p>
                      <div className="flex gap-3 w-full">
                          <button 
                            onClick={() => setShowNewAnalysisConfirm(false)}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-sm font-medium transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                            onClick={confirmNewReportAction}
                            className="flex-1 px-4 py-2 bg-brand-accent hover:bg-brand-accentHover text-white rounded-xl text-sm font-bold transition-colors"
                          >
                              Confirm
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showTutorial && <OnboardingTutorial onComplete={completeOnboarding} />}

      <div className={`${isFocusMode ? 'hidden' : 'block'}`}>
          <ErrorBoundary componentName="Sidebar">
            <Sidebar 
                isOpen={sidebarOpen}
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                pipelineStage={pipelineStage}
                onGenerate={handleGenerateRequest}
                onCancel={handleCancel}
                isGenerating={isGenerating}
                currentUser={user}
                activeTemplate={activeTemplate || templateService.getTemplates(user.id)[0]}
                onSelectTemplate={setActiveTemplate}
                onCheckDataQuality={handleCheckDataQuality}
                branding={userSettings.branding}
                apiKey={userSettings.apiKey}
                onOpenSettings={() => setShowSettings(true)}
                onLoadReport={handleLoadReport}
            />
          </ErrorBoundary>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
        <div className={`${isFocusMode ? 'hidden' : 'block'}`}>
            <ErrorBoundary componentName="Navigation">
                <TopNav 
                    user={user} 
                    onLogout={handleLogout} 
                    viewMode={viewMode} 
                    setViewMode={setViewMode}
                    isDarkMode={isDarkMode}
                    toggleDarkMode={toggleDarkMode}
                    branding={userSettings.branding}
                    reportData={reportData}
                    onToggleFocus={() => setIsFocusMode(true)}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onBackToDashboard={confirmNewReportAction}
                    addToast={addToast}
                />
            </ErrorBoundary>
        </div>

        <div className={`flex-1 overflow-y-auto scrollbar-dark bg-gray-100 dark:bg-gray-950 relative transition-colors duration-300 ${isFocusMode ? 'p-0' : 'p-4 lg:p-6'}`}>
            
            {reportData && !isFocusMode && (
                <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center no-print gap-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 items-center">
                        <span className="cursor-pointer hover:text-brand-accent" onClick={confirmNewReportAction}>Home</span> 
                        <span className="text-gray-300 dark:text-gray-600">/</span> 
                        <span>Reports</span> 
                        <span className="text-gray-300 dark:text-gray-600">/</span> 
                        <span className="text-gray-800 dark:text-gray-200 font-bold bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm max-w-[200px] truncate">{reportData?.title || 'Dashboard'}</span>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm inline-flex border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
                            <button 
                                onClick={() => setActiveMainTab('report')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeMainTab === 'report' 
                                    ? 'bg-brand-dark text-white shadow-md' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                                style={activeMainTab === 'report' ? { backgroundColor: userSettings.branding?.primaryColor } : {}}
                            >
                                <LayoutGrid size={16} />
                                Report View
                            </button>
                            <button 
                                id="assistant-tab"
                                onClick={() => setActiveMainTab('chat')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeMainTab === 'chat' 
                                    ? 'bg-brand-dark text-white shadow-md' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                                style={activeMainTab === 'chat' ? { backgroundColor: userSettings.branding?.primaryColor } : {}}
                            >
                                <MessageSquare size={16} />
                                Assistant
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isFocusMode && (
                <button 
                    onClick={() => setIsFocusMode(false)}
                    className="fixed top-6 right-6 z-50 bg-gray-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 hover:bg-black transition-all border border-gray-700 font-bold text-xs"
                >
                    <Minimize2 size={16} /> Exit Focus Mode
                </button>
            )}

            {!isFocusMode && !isGenerating && reportData && (
                <div className="fixed bottom-8 right-8 z-50 group">
                    <button
                        onClick={triggerNewReport}
                        className="w-14 h-14 bg-brand-accent hover:bg-brand-accentHover text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 border-2 border-white dark:border-gray-700 z-[100]"
                        title="New Analysis"
                        style={{backgroundColor: userSettings.branding?.primaryColor}}
                    >
                        <Plus size={28} />
                    </button>
                    {/* Tooltip for FAB */}
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                        Start New Analysis
                    </div>
                </div>
            )}

            <div className={`h-full ${!isFocusMode ? 'pb-20' : ''} ${isFocusMode ? 'max-w-5xl mx-auto' : ''}`}>
                <div className={activeMainTab === 'chat' ? 'h-[600px] w-full max-w-5xl mx-auto' : 'h-full w-full'}>
                     {renderMainContent()}
                </div>
            </div>

        </div>
      </div>
    </div>
    </div>
    </ErrorBoundary>
  );
};

export default App;
