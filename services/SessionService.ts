
import Logger from '../utils/Logger';
import { ReportData, ConnectionHistoryItem } from '../types';

const SESSION_KEY = 'rg_session_data';
const HISTORY_KEY = 'rg_history_data';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultDataSource: string;
  autoSave: boolean;
}

interface UserSession {
  userId: string;
  createdAt: number;
  preferences: UserPreferences;
  recentConnections: ConnectionHistoryItem[];
}

class SessionService {
  private logger = new Logger('SessionService');
  private currentSession: UserSession | null = null;

  constructor() {
    this.logger.info('Initialized Session Service');
    this.loadSession();
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
        // Ensure recentConnections exists for migrated sessions
        if (!this.currentSession.recentConnections) {
            this.currentSession.recentConnections = [];
        }
        this.logger.info('Restored existing session', this.currentSession?.userId);
      }
    } catch (e) {
      this.logger.error('Failed to load session', e);
    }
  }

  createSession(userId: string) {
    // Check if we can just update the existing session for this user to preserve history
    if (this.currentSession && this.currentSession.userId === userId) {
        return;
    }

    this.currentSession = {
      userId,
      createdAt: Date.now(),
      preferences: {
        theme: 'dark',
        defaultDataSource: 'demo',
        autoSave: true
      },
      recentConnections: []
    };
    this.saveSession();
    this.logger.info(`Created new session for user: ${userId}`);
  }

  private saveSession() {
    if (this.currentSession) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentSession));
    }
  }

  savePreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    if (!this.currentSession) return;
    this.currentSession.preferences[key] = value;
    this.saveSession();
    this.logger.info(`Updated preference ${key} to ${value}`);
  }

  // --- Connection History Management ---

  addConnection(connection: ConnectionHistoryItem) {
    if (!this.currentSession) return;
    
    // Remove duplicates based on details/connection string
    this.currentSession.recentConnections = this.currentSession.recentConnections.filter(
        c => c.details !== connection.details && c.name !== connection.name
    );
    
    // Add to top
    this.currentSession.recentConnections.unshift(connection);
    
    // Limit to 5 recent connections per type
    if (this.currentSession.recentConnections.length > 10) {
        this.currentSession.recentConnections.pop();
    }
    
    this.saveSession();
    this.logger.info(`Saved connection: ${connection.name}`);
  }

  getRecentConnections(): ConnectionHistoryItem[] {
      return this.currentSession?.recentConnections || [];
  }

  // --- Report History Management ---

  addToHistory(report: ReportData) {
    if (!this.currentSession) return;
    
    try {
      const historyStr = localStorage.getItem(HISTORY_KEY);
      let history: ReportData[] = historyStr ? JSON.parse(historyStr) : [];
      
      // Check for duplicate ID and remove it (move to top)
      history = history.filter(h => h.id !== report.id);
      
      // Add to beginning, limit to 20
      history.unshift(report);
      if (history.length > 20) history = history.slice(0, 20);
      
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      this.logger.info(`Added report ${report.id} to history`);
    } catch (e) {
      this.logger.error('Failed to save history', e);
    }
  }

  getHistory(): ReportData[] {
    try {
      const historyStr = localStorage.getItem(HISTORY_KEY);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (e) {
      return [];
    }
  }
}

export const sessionService = new SessionService();
