
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, FileText, Database, Activity, Play } from 'lucide-react';
import { DataProfile } from '../types';

interface DataQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  fileContent?: string;
}

const DataQualityModal: React.FC<DataQualityModalProps> = ({ isOpen, onClose, fileName, fileContent }) => {
  const [profile, setProfile] = useState<DataProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen && fileContent) {
      analyzeData();
    }
  }, [isOpen, fileContent]);

  const analyzeData = () => {
    setIsAnalyzing(true);
    
    // Simulated Analysis
    setTimeout(() => {
        const rows = fileContent?.split('\n').filter(r => r.trim()).length || 0;
        const cols = fileContent?.split('\n')[0]?.split(',').length || 0;
        
        // Pseudo-random quality logic for demo
        const score = Math.floor(Math.random() * (98 - 70) + 70);
        const completeness = Math.floor(Math.random() * (100 - 85) + 85);
        const issues = [];
        
        if (score < 90) issues.push("Found 3 potential duplicate records");
        if (completeness < 100) issues.push(`${100 - completeness}% of cells contain null values`);
        if (cols > 15) issues.push("High dimensionality detected (15+ columns)");

        const preview = fileContent 
            ? fileContent.split('\n').slice(0, 5).map(row => row.split(',')) 
            : [];

        setProfile({
            score,
            rowCount: rows,
            columnCount: cols,
            completeness,
            issues,
            preview
        });
        setIsAnalyzing(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent">
                    <Activity size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Data Quality Analysis</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Profiling: {fileName}</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Scanning data structure...</p>
                </div>
            ) : profile ? (
                <div className="space-y-8">
                    {/* Score Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Quality Score</div>
                            <div className={`text-3xl font-black ${
                                profile.score > 90 ? 'text-green-500' : 
                                profile.score > 75 ? 'text-orange-500' : 'text-red-500'
                            }`}>
                                {profile.score}/100
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Dimensions</div>
                            <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                {profile.rowCount.toLocaleString()} <span className="text-xs font-normal text-gray-400">Rows</span>
                            </div>
                            <div className="text-xs text-gray-400">{profile.columnCount} Columns</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Completeness</div>
                            <div className="text-2xl font-bold text-brand-accent">
                                {profile.completeness}%
                            </div>
                        </div>
                    </div>

                    {/* Issues List */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-orange-500" /> Potential Issues
                        </h4>
                        {profile.issues.length > 0 ? (
                             <div className="space-y-2">
                                {profile.issues.map((issue, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg text-sm text-orange-800 dark:text-orange-200">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                        {issue}
                                    </div>
                                ))}
                             </div>
                        ) : (
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                                <CheckCircle size={16} /> No critical issues found.
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <FileText size={16} className="text-brand-accent" /> Data Preview
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-xs text-left">
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                    {profile.preview.map((row, i) => (
                                        <tr key={i}>
                                            {row.map((cell: string, j: number) => (
                                                <td key={j} className="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap border-r border-gray-100 dark:border-gray-700 last:border-none">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Close
            </button>
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-brand-accent hover:bg-brand-accentHover transition-colors shadow-lg flex items-center gap-2"
            >
                <Play size={16} fill="currentColor" /> Proceed to Generation
            </button>
        </div>
      </div>
    </div>
  );
};

export default DataQualityModal;
