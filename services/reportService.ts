
import { ReportData, SavedReportMetadata, ActivityItem } from '../types';

const STORAGE_KEY = 'rg_saved_reports';

export const reportService = {
    saveReport: (report: ReportData): void => {
        try {
            const existingStr = localStorage.getItem(STORAGE_KEY);
            let reports: ReportData[] = existingStr ? JSON.parse(existingStr) : [];
            
            // Update if exists, otherwise push
            const index = reports.findIndex(r => r.id === report.id);
            if (index >= 0) {
                reports[index] = report;
            } else {
                reports.unshift(report); // Add to top
            }

            // Limit storage to last 20 reports to prevent quota issues
            if (reports.length > 20) {
                reports = reports.slice(0, 20);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        } catch (e) {
            console.error("Failed to save report history", e);
        }
    },

    getHistory: (): SavedReportMetadata[] => {
        try {
            const existingStr = localStorage.getItem(STORAGE_KEY);
            const reports: ReportData[] = existingStr ? JSON.parse(existingStr) : [];
            
            return reports.map(r => ({
                id: r.id,
                title: r.title,
                date: r.date,
                type: r.type,
                thumbnailData: r.metrics
            }));
        } catch (e) {
            return [];
        }
    },

    loadReport: (id: string): ReportData | null => {
        try {
            const existingStr = localStorage.getItem(STORAGE_KEY);
            const reports: ReportData[] = existingStr ? JSON.parse(existingStr) : [];
            return reports.find(r => r.id === id) || null;
        } catch (e) {
            return null;
        }
    },

    deleteReport: (id: string): void => {
        try {
            const existingStr = localStorage.getItem(STORAGE_KEY);
            let reports: ReportData[] = existingStr ? JSON.parse(existingStr) : [];
            reports = reports.filter(r => r.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        } catch (e) {
            console.error("Failed to delete report", e);
        }
    },

    getRecentActivity: (): ActivityItem[] => {
        try {
            const reports = reportService.getHistory(); // Use internal method to get raw data if needed, but getHistory returns Metadata
            const existingStr = localStorage.getItem(STORAGE_KEY);
            const fullReports: ReportData[] = existingStr ? JSON.parse(existingStr) : [];

            const activities: ActivityItem[] = [];
    
            fullReports.forEach(r => {
                activities.push({
                    id: `gen_${r.id}`,
                    type: 'report_generated',
                    description: `Generated ${r.title}`,
                    timestamp: new Date(r.date),
                    meta: r.id
                });
            });
    
            // Add some dummy system events for the feed to look active for new users
            activities.push({
                id: 'sys_1',
                type: 'system_update',
                description: 'System updated to v2.4.0',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
            });
            
             activities.push({
                id: 'sys_2',
                type: 'data_connected',
                description: 'New Data Source: Sales SQL DB',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
            });
    
            return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
        } catch(e) {
            return [];
        }
    }
};
