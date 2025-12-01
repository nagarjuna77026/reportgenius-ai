
import Logger from '../utils/Logger';
import { ReportData } from '../types';

/**
 * **VisualizationAgent**
 * 
 * Responsible for the "last mile" of data processing before rendering.
 * It transforms raw analysis data into formats optimized for UI libraries (Recharts).
 * 
 * @class VisualizationAgent
 * 
 * **Design Decision:**
 * Keeping visualization logic separate from the React components keeps the UI "dumb"
 * and purely presentational. This allows us to unit test data formatting logic independently.
 */
export class VisualizationAgent {
  private logger = new Logger('VisualizationAgent');

  constructor() {
    this.logger.info('Agent Initialized');
  }

  /**
   * Enhances and validates the visualizations within the report data.
   * Calculates derived metrics (totals, growth percentages) to save frontend computation.
   * 
   * @param data - The raw report data from the AnalysisAgent.
   * @returns ReportData - Enhanced data ready for rendering.
   */
  processVisualizations(data: ReportData): ReportData {
    const startTime = performance.now();
    this.logger.info('[START] Processing visualizations');

    // Safety checks for undefined arrays
    const rawChartData = data.chartData || [];
    const rawTableData = data.tableData || [];

    // 1. Enrich Chart Data
    // We calculate totals here so the Chart tooltip doesn't have to summing logic
    const processedChartData = rawChartData.map(point => ({
      ...point,
      total: (point.primary || 0) + (point.secondary || 0)
    }));

    // 2. Enrich Table Data
    // Calculate growth percentages for the "Detailed Breakdown" table
    const processedTableData = rawTableData.map(row => ({
      ...row,
      growth: row.secondary > 0 ? ((row.primary - row.secondary) / row.secondary) * 100 : 0
    }));

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    this.logger.info(`[COMPLETED] Visualizations processed in ${duration}ms`, { 
      chartPoints: processedChartData.length,
      tableRows: processedTableData.length
    });

    return {
      ...data,
      chartData: processedChartData,
      tableData: processedTableData
    };
  }
}
