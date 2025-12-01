
import React, { useState, useEffect } from 'react';
import { 
    Plus, UploadCloud, FileText, Clock, ArrowRight, BarChart2, TrendingUp, Search, 
    MoreVertical, Eye, Trash2, Download, Filter, ChevronDown, ChevronUp, LayoutTemplate, Activity, Layers
} from 'lucide-react';
import { User, SavedReportMetadata, ActivityItem, SortConfig } from '../types';
import { reportService } from '../services/reportService';
import { templateService } from '../services/templateService';

interface DashboardHomeProps {
  user: User;
  onNewReport: () => void;
  onLoadReport: (id: string) => void;
  recentReports: SavedReportMetadata[];
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, onNewReport, onLoadReport, recentReports }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, sources: 0 });

  useEffect(() => {
      setActivityFeed(reportService.getRecentActivity());
      
      // Calculate stats
      const total = recentReports.length;
      const now = new Date();
      const thisMonth = recentReports.filter(r => {
          const d = new Date(r.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      
      // Mock source count for demo, typically this would be distinct connection types
      setStats({ total, thisMonth, sources: Math.max(1, Math.floor(total / 3)) });
  }, [recentReports]);

  // Filtering & Sorting Logic
  const filteredReports = recentReports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || report.type === filterType;
      return matchesSearch && matchesType;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof SavedReportMetadata];
      let bVal: any = b[sortConfig.key as keyof SavedReportMetadata];
      
      if (sortConfig.key === 'date') {
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
  });

  const handleSort = (key: keyof SavedReportMetadata) => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
      }));
  };

  const getSortIcon = (key: string) => {
      if (sortConfig.key !== key) return null;
      return sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>;
  };

  const handleDelete = (id: string) => {
      if(confirm("Are you sure you want to delete this report?")) {
          reportService.deleteReport(id);
          // In a real app we'd trigger a reload callback, here we just force a re-render by letting parent pass new props eventually
          // For now, reload window to ensure sync
          window.location.reload(); 
      }
  };

  const templates = templateService.getTemplates(user.id).slice(0, 3);

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl">
            You have <span className="font-bold text-gray-800 dark:text-gray-200">{recentReports.length} {recentReports.length === 1 ? 'report' : 'reports'}</span> available. 
            Ready to generate your next insight?
            </p>
        </div>
        <div className="flex gap-3">
             <button onClick={onNewReport} className="bg-brand-accent hover:bg-brand-accentHover text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-brand-accent/30 transition-all flex items-center gap-2">
                 <Plus size={20}/> New Analysis
             </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText size={24}/>
            </div>
            <div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</div>
                <div className="text-xs text-gray-500 font-bold uppercase">Total Reports</div>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                <TrendingUp size={24}/>
            </div>
            <div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.thisMonth}</div>
                <div className="text-xs text-gray-500 font-bold uppercase">This Month</div>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                <UploadCloud size={24}/>
            </div>
            <div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.sources}</div>
                <div className="text-xs text-gray-500 font-bold uppercase">Data Sources</div>
            </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-2xl border border-gray-700 shadow-sm relative overflow-hidden group cursor-pointer" onClick={onNewReport}>
             <div className="relative z-10">
                <div className="text-lg font-bold mb-1">Start New</div>
                <div className="text-xs text-gray-400 mb-3">Launch analysis wizard</div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-colors">
                    <ArrowRight size={16}/>
                </div>
             </div>
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-brand-accent/20 transition-colors"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Content: Reports Table */}
         <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     <Clock size={20} className="text-gray-400"/> Recent Intelligence
                 </h2>
                 
                 <div className="flex gap-2">
                     <div className="relative">
                         <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>
                         <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-brand-accent outline-none w-40 focus:w-60 transition-all"
                         />
                     </div>
                     <div className="relative">
                         <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand-accent outline-none appearance-none pr-8 cursor-pointer"
                         >
                             <option value="all">All Types</option>
                             <option value="SALES REPORT">Sales</option>
                             <option value="FINANCIAL">Financial</option>
                             <option value="MARKETING">Marketing</option>
                         </select>
                         <Filter size={12} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
                     </div>
                 </div>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm min-h-[400px]">
                 {sortedReports.length === 0 ? (
                     <div className="p-12 text-center flex flex-col items-center h-full justify-center">
                         <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                             <FileText size={32} className="text-gray-400"/>
                         </div>
                         <h3 className="font-bold text-gray-900 dark:text-white mb-1">No reports found</h3>
                         <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or create a new analysis.</p>
                         <button onClick={onNewReport} className="text-brand-accent font-bold text-sm hover:underline">Create Report</button>
                     </div>
                 ) : (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('title')}>
                                        <div className="flex items-center gap-1">Report Name {getSortIcon('title')}</div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-1">Date {getSortIcon('date')}</div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('type')}>
                                        <div className="flex items-center gap-1">Type {getSortIcon('type')}</div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {sortedReports.map(report => (
                                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                                                    <BarChart2 size={16}/>
                                                </div>
                                                <button onClick={() => onLoadReport(report.id)} className="font-bold text-gray-900 dark:text-white hover:text-brand-accent text-sm text-left truncate max-w-[250px]">
                                                    {report.title}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {report.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                {report.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onLoadReport(report.id)} className="p-2 text-gray-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors" title="View">
                                                    <Eye size={16}/>
                                                </button>
                                                <button onClick={() => handleDelete(report.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 )}
             </div>
         </div>

         {/* Sidebar Content: Activity & Templates */}
         <div className="space-y-8">
             
             {/* Templates Gallery */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                 <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                     <LayoutTemplate size={16} className="text-brand-accent"/> Featured Templates
                 </h2>
                 <div className="space-y-3">
                     {templates.map(t => (
                         <div key={t.id} className="group p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all cursor-pointer" onClick={onNewReport}>
                             <div className="flex items-center gap-3 mb-2">
                                 <div className="w-1 h-8 rounded-full" style={{backgroundColor: t.theme.primary}}></div>
                                 <div className="flex-1">
                                     <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-accent">{t.name}</div>
                                     <div className="text-xs text-gray-500">{t.category}</div>
                                 </div>
                             </div>
                         </div>
                     ))}
                     <button onClick={onNewReport} className="w-full py-2 text-xs font-bold text-brand-accent hover:underline">
                         View All Templates
                     </button>
                 </div>
             </div>

             {/* Activity Feed */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                 <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                     <Activity size={16} className="text-orange-500"/> Activity Feed
                 </h2>
                 <div className="relative pl-2 space-y-6">
                     <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100 dark:bg-gray-700"></div>
                     {activityFeed.map((item) => (
                         <div key={item.id} className="relative pl-6">
                             <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${
                                 item.type === 'report_generated' ? 'bg-brand-accent' :
                                 item.type === 'system_update' ? 'bg-gray-400' : 'bg-green-500'
                             }`}></div>
                             <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{new Date(item.timestamp).toLocaleDateString()}</div>
                             <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.description}</div>
                         </div>
                     ))}
                     {activityFeed.length === 0 && <div className="text-xs text-gray-500 pl-6">No recent activity</div>}
                 </div>
             </div>

         </div>
      </div>
    </div>
  );
};

export default DashboardHome;
