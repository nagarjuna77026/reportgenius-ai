

/**
 * Represents the stages of the report generation pipeline.
 * Used for the progress bar visualization.
 */
export enum PipelineStage {
  Collection = 0,
  Analysis = 1,
  Visualization = 2,
  ReportGen = 3,
  Delivery = 4,
  Complete = 5
}

/**
 * Key Performance Indicator (KPI) metric displayed at the top of reports.
 */
export interface Metric {
  label: string;
  value: string | number;
  trend: number; // percentage change vs previous period
  iconType: 'volume' | 'trend' | 'growth' | 'chart';
}

/**
 * Risk item for the Risk Assessment section.
 */
export interface Risk {
  id: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  priority: 'Critical' | 'Monitor' | 'Low';
}

/**
 * Data point for Recharts visualization.
 * 'primary' usually refers to current period, 'secondary' to previous.
 */
export interface ChartDataPoint {
  name: string;
  primary: number;
  secondary: number;
  amt: number;
  [key: string]: string | number;
}

export interface Annotation {
  id: string;
  sectionId: SectionId;
  text: string;
  author: string;
  date: Date;
}

export interface ReportVersion {
  id: string;
  date: string;
  author: string;
  changes: string;
}

// --- NEW: Predictive Analytics Types ---
export interface ScenarioParam {
  id: string;
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  step: number;
  unit: '%' | '$' | 'x';
  impactFactor: number; // Multiplier for calculation
}

// --- NEW: Strategic Radar Map ---
export interface StrategicMapPoint {
    dim: string; // Dimension name (e.g., "Innovation", "Efficiency")
    A: number;   // Current Score (0-100)
    B: number;   // Benchmark/Target (0-100)
    fullMark: number;
}

// --- NEW: Enterprise Features ---
export interface RecommendationItem {
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
    effort: 'High' | 'Medium' | 'Low';
    status?: 'Pending' | 'Synced';
}

export interface InsightItem {
    text: string;
    source?: string; // Reasoning source or "AI Analysis"
}

export interface CompetitorMetric {
    name: string; // Company Name
    marketShare: number;
    growth: number;
    sentiment: number; // 0-100
}

export interface ExecutiveBrief {
    cfoView: string; // Financial focus
    croView: string; // Sales focus
    cooView: string; // Ops focus
}

export interface DataQualityReport {
    score: number;
    lastUpdated: string;
    sourceIntegrity: 'High' | 'Medium' | 'Low';
    issuesFound: number;
}

/**
 * The main data structure holding the generated report content.
 * This is the JSON structure returned by the AI.
 */
export interface ReportData {
  id: string;
  title: string;
  type: string;
  date: string;
  audience: string;
  metrics: Metric[];
  summary: string; // Default summary
  executiveBrief?: ExecutiveBrief; // New Multi-Persona Summary
  insights: InsightItem[]; // Enhanced from string[]
  risks: Risk[];
  recommendations: RecommendationItem[]; // Enhanced from string[]
  outlook: string;
  chartData: ChartDataPoint[];
  tableData: {
    category: string;
    primary: number;
    secondary: number;
    contribution: number;
  }[];
  annotations?: Annotation[];
  versions?: ReportVersion[];
  scenarios?: ScenarioParam[]; 
  forecastData?: {
      name: string;
      value: number;
      lowerBound: number;
      upperBound: number;
  }[];
  strategicMap?: StrategicMapPoint[];
  competitors?: CompetitorMetric[]; // New
  marketContext?: string; // New
  dataQuality?: DataQualityReport; // New
}

export interface SavedReportMetadata {
    id: string;
    title: string;
    date: string;
    type: string;
    thumbnailData?: Metric[]; // Store just metrics for preview
}

/**
 * User inputs defining what kind of report to generate.
 */
export interface AnalysisContext {
  period: string;
  type: 'Trends' | 'Anomalies' | 'Forecast' | 'Benchmarks';
  instructions: string;
}

export interface Attachment {
  type: 'image';
  content: string; // base64
  mimeType: string;
}

export interface Source {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachment?: Attachment;
  timestamp: Date;
  sources?: Source[];
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

// Template Types
export type SectionId = 
  | 'header' 
  | 'metrics' 
  | 'summary' 
  | 'charts' 
  | 'predictive'
  | 'competitors' // New
  | 'outlook' 
  | 'table' 
  | 'insights' 
  | 'risks' 
  | 'recommendations' 
  | 'footer';

export interface ReportSection {
  id: SectionId;
  label: string;
  isVisible: boolean;
  chartType?: 'bar' | 'line' | 'area' | 'pie' | 'forecast' | 'radar'; 
  width?: 'full' | 'half'; // For Dashboard Layout
  order?: number;
  style?: {
    backgroundColor?: string;
    padding?: 'compact' | 'normal' | 'spacious';
  };
}

export type ThemeFont = 'Inter' | 'Playfair Display' | 'Roboto' | 'Courier Prime';

export interface ReportTemplate {
  id: string;
  name: string;
  userId: string | null; // null for system templates
  category?: 'General' | 'Sales' | 'HR' | 'Marketing' | 'Financial';
  sections: ReportSection[];
  theme: {
    primary: string;
    secondary: string;
    background: string;
    font: ThemeFont;
    logoUrl?: string;
  };
}

// Data Source Types
export type DataSourceType = 'demo' | 'file' | 'api' | 'mongodb' | 'sql';

export interface ConnectionHistoryItem {
    id: string;
    type: DataSourceType;
    name: string;
    lastUsed: Date;
    details: string;
}

export interface DataSourceConfig {
  type: DataSourceType;
  demoId?: string;
  fileContent?: string; 
  fileName?: string;
  fileSize?: number;
  apiConfig?: {
    url: string;
    method: 'GET' | 'POST';
    headers?: string;
  };
  dbConfig?: {
    useProxy: boolean;
    connectionString?: string; // Preferred secure method
    host?: string;
    port?: string;
    user?: string;
    password?: string; // Warn if used in frontend
    query: string; 
    dbName?: string; 
    collection?: string; // For Mongo
  };
}

// Advanced Features Types
export type ReportViewMode = 'document' | 'dashboard' | 'presentation';

export interface ScheduleConfig {
  isActive: boolean;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  time: string;
  recipients: string[];
  format: 'PDF' | 'HTML' | 'Excel';
}

export interface DrillDownRow {
  id: string;
  date: string;
  entity: string;
  detail: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    browser: boolean;
  };
  autoSave: boolean;
  defaultDataSource: DataSourceType;
  apiKey?: string; // For user-provided keys
  onboardingComplete: boolean;
  recentConnections?: ConnectionHistoryItem[];
  branding?: {
      logoUrl?: string;
      primaryColor?: string;
      companyName?: string;
  };
}

export interface DataProfile {
  score: number;
  rowCount: number;
  columnCount: number;
  completeness: number; // percentage
  issues: string[];
  preview: any[];
}

export interface TutorialStep {
  target: string; // ID of element
  title: string;
  content: string;
  position: 'top' | 'right' | 'bottom' | 'left' | 'center';
}

// Dashboard Enhancements
export interface ActivityItem {
  id: string;
  type: 'report_generated' | 'data_connected' | 'viewed_report' | 'system_update';
  description: string;
  timestamp: Date;
  meta?: string; // e.g., report ID
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof SavedReportMetadata | 'action';
  direction: SortDirection;
}