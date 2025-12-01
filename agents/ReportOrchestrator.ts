
import { DataCollectionAgent } from './DataCollectionAgent';
import { AnalysisAgent } from './AnalysisAgent';
import { VisualizationAgent } from './VisualizationAgent';
import { ReportGenerationAgent } from './ReportGenerationAgent';
import { DataSourceConfig, AnalysisContext, ReportData, ReportTemplate } from '../types';
import Logger from '../utils/Logger';
import { DEMO_SALES_REPORT } from '../constants';

/**
 * **ReportOrchestrator**
 * 
 * The Master Controller. This class implements the **Multi-Agent Architecture** pattern.
 * It manages the lifecycle of a report request, passing state between agents,
 * handling global errors, and maintaining workflow observability.
 * 
 * @class ReportOrchestrator
 */
export class ReportOrchestrator {
  private logger = new Logger('ReportOrchestrator');
  
  // Child Agents
  private dataAgent: DataCollectionAgent;
  private analysisAgent: AnalysisAgent;
  private vizAgent: VisualizationAgent;
  private reportAgent: ReportGenerationAgent;
  private apiKey: string;

  constructor(apiKey?: string) {
    if (!apiKey) {
      this.logger.warn('No API Key provided. Orchestrator will run in limited mode (Demo only).');
    }
    this.apiKey = apiKey || '';
    
    // Initialize all agents
    this.dataAgent = new DataCollectionAgent();
    // Default to empty key if missing (will fail gracefully in AnalysisAgent if called with non-demo data)
    this.analysisAgent = new AnalysisAgent(this.apiKey);
    this.vizAgent = new VisualizationAgent();
    this.reportAgent = new ReportGenerationAgent();
  }

  /**
   * Executes the full report generation pipeline.
   * 
   * Pipeline Stages:
   * 1. **Collection**: Fetch raw data.
   * 2. **Analysis**: AI Reasoning (Gemini).
   * 3. **Visualization**: Data transformation.
   * 4. **Assembly**: Final document creation.
   */
  async generateReport(
    context: AnalysisContext, 
    sourceConfig: DataSourceConfig,
    template: ReportTemplate
  ): Promise<ReportData> {
    const workflowStart = performance.now();
    
    this.logger.info('==========================================');
    this.logger.info('🚀 REPORT GENERATION WORKFLOW STARTED');
    this.logger.info('==========================================');

    try {
      // --- Step 1: Data Collection ---
      this.logger.info('--- Step 1: Data Collection ---');
      const dataContext = await this.dataAgent.collectData(sourceConfig);

      // --- Step 2: Analysis (The "Brain") ---
      this.logger.info('--- Step 2: Analysis ---');
      let rawReportData: ReportData;
      
      // Fallback Logic: If no API key is present but user selected Demo, use static fallback
      if (!this.apiKey && sourceConfig.type === 'demo') {
        this.logger.warn('⚠️ Skipping AI Analysis (No Key), utilizing static demo dataset.');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
        
        const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 to 1.25
        
        // Randomize Chart Data so different reports look distinct
        const randomizedChartData = DEMO_SALES_REPORT.chartData.map(d => ({
            ...d,
            primary: Math.floor(d.primary * randomFactor),
            secondary: Math.floor(d.secondary * randomFactor),
            amt: Math.floor(d.amt * randomFactor)
        }));

        const randomizedTableData = DEMO_SALES_REPORT.tableData.map(d => ({
            ...d,
            primary: Math.floor(d.primary * randomFactor),
            secondary: Math.floor(d.secondary * randomFactor)
        }));

        const randomizedCompetitors = DEMO_SALES_REPORT.competitors?.map(c => ({
            ...c,
            marketShare: Math.min(100, Math.max(0, c.marketShare + (Math.random() * 10 - 5))),
            growth: parseFloat((c.growth + (Math.random() * 10 - 5)).toFixed(1))
        })) || [];
        
        const randomizedRadar = DEMO_SALES_REPORT.strategicMap?.map(p => ({
            ...p,
            A: Math.min(100, Math.max(0, p.A + (Math.random() * 20 - 10)))
        })) || [];

        // Dynamically patch the static report with the user's selected period
        // This ensures visual feedback even in demo mode
        rawReportData = { 
            ...DEMO_SALES_REPORT,
            title: `${context.period} Sales Performance Review`,
            id: `RPT-${context.period.replace(/\s/g, '-')}-${Date.now()}`.toUpperCase(),
            date: new Date().toLocaleDateString(),
            metrics: DEMO_SALES_REPORT.metrics.map(m => ({
                 ...m,
                 value: m.iconType === 'volume' || m.iconType === 'chart' 
                    ? (parseInt(m.value.toString().replace(/,/g, '')) * (Math.random() * 0.4 + 0.8)).toLocaleString().split('.')[0]
                    : m.value,
                 trend: parseFloat((m.trend + (Math.random() * 5 - 2.5)).toFixed(1))
             })),
            chartData: randomizedChartData,
            tableData: randomizedTableData,
            competitors: randomizedCompetitors,
            strategicMap: randomizedRadar
        };
      } else {
        if (!this.apiKey) throw new Error("API Key is missing. Please add it in Settings.");
        rawReportData = await this.analysisAgent.analyzeData(dataContext, context);
      }

      // --- Step 3: Visualization Processing ---
      this.logger.info('--- Step 3: Visualization Processing ---');
      const visualizedData = this.vizAgent.processVisualizations(rawReportData);

      // --- Step 4: Final Report Assembly ---
      this.logger.info('--- Step 4: Report Assembly ---');
      
      // Consistency Check: Ensure title reflects the requested period even if AI hallucinated
      const safeTitle = visualizedData.title && visualizedData.title.includes(context.period)
         ? visualizedData.title 
         : `${context.period} ${visualizedData.type || 'Analysis'} Report`;

      const finalReportPayload = {
          ...visualizedData,
          title: safeTitle
      };
      
      const finalReport = this.reportAgent.generateFinalReport(finalReportPayload, template.id);

      const workflowEnd = performance.now();
      const totalTime = ((workflowEnd - workflowStart) / 1000).toFixed(2);

      this.logger.info('==========================================');
      this.logger.info(`✅ REPORT GENERATION WORKFLOW COMPLETED in ${totalTime}s`);
      this.logger.info('==========================================');

      return finalReport;

    } catch (error) {
      this.logger.error('❌ Workflow Failed', error);
      throw error;
    }
  }
}
