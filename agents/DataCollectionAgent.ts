
import Logger from '../utils/Logger';
import { DataSourceConfig } from '../types';

/**
 * **DataCollectionAgent**
 * 
 * Responsible for the first stage of the report generation pipeline: gathering raw data.
 * 
 * @class DataCollectionAgent
 * 
 * **Design Decision:**
 * We decoupled data collection from analysis to ensure:
 * 1. **Modularity:** New data sources (e.g., GraphQL, Salesforce) can be added without touching analysis logic.
 * 2. **Testability:** We can mock this agent easily to test the AnalysisAgent with known data structures.
 * 3. **Error Isolation:** Connection failures are caught here before expensive AI tokens are wasted.
 */
export class DataCollectionAgent {
  private logger = new Logger('DataCollectionAgent');

  constructor() {
    this.logger.info('Agent Initialized');
  }

  /**
   * Main entry point for data collection. Routes to specific internal methods based on config type.
   * 
   * @param config - The user-defined configuration (API credentials, file content, DB query).
   * @returns Promise<string> - A stringified context representation of the data for the LLM.
   */
  async collectData(config: DataSourceConfig): Promise<string> {
    const startTime = performance.now();
    this.logger.info(`[START] Collecting data from source: ${config.type.toUpperCase()}`);

    try {
      let dataContext = '';

      // Route to specific handler
      switch (config.type) {
        case 'demo':
          dataContext = this.loadDemoData(config.demoId);
          break;
        case 'file':
          dataContext = this.loadFile(config);
          break;
        case 'api':
          dataContext = this.connectApi(config);
          break;
        case 'sql':
        case 'mongodb':
          dataContext = this.connectDatabase(config);
          break;
        default:
          throw new Error(`Unsupported data source type: ${(config as any).type}`);
      }

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      this.logger.info(`[COMPLETED] Data collection finished in ${duration}ms`, { 
        source: config.type,
        dataSizeChars: dataContext.length 
      });
      
      return dataContext;

    } catch (error) {
      this.logger.error('[FAILED] Error during data collection', error);
      throw error;
    }
  }

  /**
   * Loads static demo data for testing purposes.
   * @private
   */
  private loadDemoData(demoId?: string): string {
    this.logger.info(`Loading demo scenario: ${demoId || 'default'}`);
    return `Source Type: Demo Scenario (${demoId || 'General'}).\nUsing predefined demo data for simulation.`;
  }

  /**
   * Processes uploaded files.
   * 
   * **Design Decision:**
   * We truncate files larger than 100k characters to prevent context window overflow
   * in the Gemini model, ensuring the prompt remains efficient.
   * @private
   */
  private loadFile(config: DataSourceConfig): string {
    if (!config.fileContent) {
      throw new Error("File content is missing");
    }
    
    // Safety Limit: 100,000 characters (approx 25k tokens)
    const limit = 100000;
    const truncated = config.fileContent.length > limit;
    const content = config.fileContent.substring(0, limit);
    
    this.logger.info(`Processing file: ${config.fileName}`, { 
      originalSize: config.fileSize, 
      truncated 
    });

    return `
      Source Type: File Upload
      Filename: ${config.fileName}
      Original Size: ${config.fileSize} bytes
      
      === RAW DATA CONTENT START ${truncated ? '(Truncated)' : ''} ===
      ${content}
      === RAW DATA CONTENT END ===
      
      Task: Parse the data above. Calculate Total Volume, Trends, and Key Metrics.
    `;
  }

  /**
   * Formats API configuration for the LLM context.
   * Note: In a real server-side agent, this would actually fetch the API.
   * @private
   */
  private connectApi(config: DataSourceConfig): string {
    this.logger.info(`Connecting to REST API: ${config.apiConfig?.url}`);
    return `
      Source Type: REST API
      Endpoint: ${config.apiConfig?.url}
      Method: ${config.apiConfig?.method}
      Task: Simulate a response from this endpoint and analyze it based on typical schema for this kind of data.
    `;
  }

  /**
   * Formats Database configuration for the LLM context.
   * @private
   */
  private connectDatabase(config: DataSourceConfig): string {
    this.logger.info(`Connecting to Database: ${config.type}`);
    return `
      Source Type: ${config.type.toUpperCase()} Database
      Query: ${config.dbConfig?.query}
      HostContext: ${config.dbConfig?.host || 'Local'}
      Task: Simulate the result of this query and analyze it.
    `;
  }
}
