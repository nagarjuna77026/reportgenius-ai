
import Logger from '../utils/Logger';
import { ReportData } from '../types';

/**
 * **ReportGenerationAgent**
 * 
 * Responsible for the final assembly of the report object.
 * It adds system metadata, version tracking, and ensures the structure is compliant
 * for storage or export.
 * 
 * @class ReportGenerationAgent
 */
export class ReportGenerationAgent {
  private logger = new Logger('ReportGenerationAgent');

  constructor() {
    this.logger.info('Agent Initialized');
  }

  /**
   * Generates the final report object with metadata.
   * 
   * @param data - The data processed by VisualizationAgent.
   * @param templateId - The ID of the template used (for tracking).
   * @returns ReportData - The immutable report object.
   */
  generateFinalReport(data: ReportData, templateId: string): ReportData {
    const startTime = performance.now();
    this.logger.info(`[START] Generating final report assembly for template: ${templateId}`);

    // Final metadata enrichment
    // Design Decision: We regenerate the ID here if needed to ensure uniqueness upon persistence
    const finalReport: ReportData = {
      ...data,
      id: data.id || `RPT-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      // Ensure all required fields exist even if AI missed them (Safety Fallback)
      scenarios: data.scenarios || [],
      forecastData: data.forecastData || [],
      versions: [{
        id: 'v1.0',
        date: new Date().toISOString(),
        author: 'ReportGenius AI',
        changes: 'Initial Generation'
      }]
    };

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    this.logger.info(`[COMPLETED] Report Generated in ${duration}ms: ${finalReport.id}`);
    
    return finalReport;
  }
}
