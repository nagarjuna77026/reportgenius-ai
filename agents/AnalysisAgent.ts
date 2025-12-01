
import { GoogleGenAI, Type } from "@google/genai";
import Logger from '../utils/Logger';
import { AnalysisContext, ReportData } from '../types';

/**
 * **AnalysisAgent**
 * 
 * The core intelligence of the application. This agent interfaces with the **Google Gemini API**
 * to perform complex reasoning, pattern recognition, and report generation.
 * 
 * @class AnalysisAgent
 */
export class AnalysisAgent {
  private logger = new Logger('AnalysisAgent');
  private ai: GoogleGenAI | null = null;

  /**
   * @param apiKey - Google Gemini API Key.
   */
  constructor(apiKey: string) {
    this.logger.info('Agent Initialized with Google GenAI SDK');
    // Initialize the official Google GenAI Client only if key is present
    // This prevents crashes in Demo Mode where apiKey might be empty
    if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
    } else {
        this.logger.warn('AnalysisAgent initialized without API Key (Demo/Safe Mode)');
    }
  }

  /**
   * Sends data context and user instructions to Gemini to generate the report JSON.
   * 
   * @param dataContext - Raw string data collected by the DataCollectionAgent.
   * @param analysisContext - User parameters (Time period, focus area, instructions).
   * @returns Promise<ReportData> - Structured JSON report.
   */
  async analyzeData(dataContext: string, analysisContext: AnalysisContext): Promise<ReportData> {
    if (!this.ai) {
        throw new Error("Gemini API Key is missing. Cannot perform AI analysis.");
    }

    const startTime = performance.now();
    this.logger.info(`[START] Analyzing data for period: ${analysisContext.period}`, { focus: analysisContext.type });

    // 1. Construct Prompts
    const systemInstruction = this.buildSystemPrompt(dataContext, analysisContext);
    const userPrompt = this.buildUserPrompt(dataContext, analysisContext);

    try {
      // 2. Call Gemini Model
      // DESIGN DECISION: We use 'gemini-2.5-flash' for low latency and high reasoning capability.
      // We enable 'thinkingConfig' (Chain of Thought) when dealing with raw data to ensure accurate math.
      const isRawData = dataContext.includes('RAW DATA');
      
      /**
       * CAPSTONE FEATURE: Chain of Thought / Thinking Budget
       * We allocate 4096-8192 tokens for the model to "think" before generating the JSON.
       * This significantly improves mathematical accuracy when summarizing CSV data.
       */
      const budget = isRawData ? 8192 : 4096;

      this.logger.info(`Sending request to model: gemini-2.5-flash`, {
         thinkingBudget: budget 
      });

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          // Allocate "Thinking Tokens" to allow the model to verify calculations before outputting JSON
          thinkingConfig: { thinkingBudget: budget }, 
          responseSchema: this.getSchema() // Force Structured Output
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      // 3. Parse Response
      const cleanText = this.cleanJsonString(text);
      const parsedData = JSON.parse(cleanText) as ReportData;

      // 4. Sanitize Data (Safety Check)
      // Ensure all arrays are present to prevent "undefined" errors in UI or subsequent agents
      const sanitizedData: ReportData = {
          ...parsedData,
          insights: parsedData.insights || [],
          risks: parsedData.risks || [],
          recommendations: parsedData.recommendations || [],
          chartData: parsedData.chartData || [],
          tableData: parsedData.tableData || [],
          metrics: parsedData.metrics || [],
          scenarios: parsedData.scenarios || [],
          forecastData: parsedData.forecastData || [],
          strategicMap: parsedData.strategicMap || [],
          competitors: parsedData.competitors || []
      };

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      this.logger.info(`[COMPLETED] AI Analysis finished in ${duration}ms`, { 
        insightsGenerated: sanitizedData.insights.length, 
        risksIdentified: sanitizedData.risks.length 
      });

      return sanitizedData;

    } catch (error) {
      this.logger.error('[FAILED] Gemini Analysis Failed', error);
      throw error;
    }
  }

  /**
   * Cleans Markdown code fences if the model outputs them despite MIME type settings.
   */
  private cleanJsonString(text: string): string {
    let clean = text.trim();
    // Sometimes the model outputs just the JSON, sometimes wrapped in markdown
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json/, "").replace(/```$/, "");
    } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```/, "").replace(/```$/, "");
    }
    return clean.trim();
  }

  /**
   * **Prompt Engineering Strategy - System Prompt**
   * Sets the persona (C-Suite Advisor) and defines strict output rules.
   * Dynamic injection of "Data Mode" helps the model switch between simulation and strict analysis.
   */
  private buildSystemPrompt(dataContext: string, analysisContext: AnalysisContext): string {
    const isRealData = dataContext.includes('RAW DATA');
    
    // === PERSONA SWITCHING LOGIC (CAPSTONE ADVANCED FEATURE) ===
    // We now instruct the AI to think as multiple personas simultaneously for the Executive Brief
    return `You are acting as a Strategic C-Suite Advisor for a high-growth enterprise.
    Your goal is to generate a highly detailed, professional, JSON-structured business report (ReportGenius).

    OUTPUT RULES:
    - Return ONLY valid JSON matching the schema.
    - **CRITICAL: DETAIL LEVEL = HIGH.** Do not be brief. Be verbose, analytical, and professional in all text fields.
    - **MATH SAFETY:** When calculating metrics from raw data, double-check your arithmetic.
    
    SPECIAL INSTRUCTIONS FOR ENTERPRISE FEATURES:
    1. **Multi-Persona Brief:** In the 'executiveBrief' section, provide 3 distinct, detailed paragraphs (at least 3-4 sentences each) written in the voice of a CFO (Financial), CRO (Sales/Revenue), and COO (Operations). Do not summarize; analyze.
    2. **Key Insights:** Provide 6-8 deep insights. Each 'text' field should be a full paragraph explaining the "what", "why", and "impact". Include specific numbers and % changes.
    3. **Future Outlook:** The 'outlook' field must be a comprehensive forecast (at least 2 paragraphs) including potential headwinds, tailwinds, and strategic pivot points.
    4. **Recommendations:** For each recommendation, the 'description' must be detailed and actionable (e.g., specific steps, expected outcome), not just generic advice.
    5. **Market Context:** Use your expert knowledge to provide detailed current market trends relevant to the data/industry. Add detailed context to 'marketContext'.
    6. **Competitors:** If you can infer the industry, generate a 'competitors' array benchmarking the company against 3 likely competitors.
    
    ${isRealData ? `
    DATA MODE: **STRICT ANALYSIS**
    You have been provided with raw data.
    1. Use ONLY the provided data for calculations. Do not hallucinate new numbers.
    2. If the data is a list of transactions, aggregate them to form the metrics.
    3. Identify outliers and explain *why* they might be happening based on the context.
    4. **CRITICAL:** Before generating the JSON, THINK about the key trends. Identify the biggest riser and faller.
    ` : `
    DATA MODE: **SIMULATION / GENERATIVE**
    You are simulating a realistic business scenario based on the user instructions: "${analysisContext.instructions}".
    1. Generate consistent, realistic, and HIGHLY DETAILED business data.
    2. Ensure the numbers mathematically align (e.g., individual regional sales sum up to total sales).
    3. Create a cohesive narrative (e.g., if you say Q2 was bad in the summary, the charts must show a dip).
    `}
    `;
  }

  /**
   * **Prompt Engineering Strategy - User Prompt**
   * Injects the dynamic context, user instructions, and specific data constraints.
   */
  private buildUserPrompt(dataContext: string, context: AnalysisContext): string {
    return `
      GENERATE REPORT JSON.
      
      ANALYSIS CONTEXT:
      Period: ${context.period}
      Analysis Focus: ${context.type}
      User Instructions: ${context.instructions || "General performance review"}
      
      DATA SOURCE:
      ${dataContext}

      REQUIREMENTS:
      1. **Metrics**: Provide 4 distinct "metrics" for the dashboard header. Ensure 'trend' is a percentage (e.g., 12.5).
      2. **Table**: "tableData" must have at least 8-10 rows of categorical breakdown.
      3. **Chart**: "chartData" must have 12 data points for time-series trends (e.g., monthly).
      4. **Radar Map**: Populate "strategicMap" with 6 key qualitative dimensions.
      5. **Competitors**: Benchmarking data against 3 competitors.
      6. **Executive Brief**: Distinct CFO/CRO/COO summaries (Detailed paragraphs).
      7. **Insights**: Generate 6-8 deep insights explaining key drivers.
      8. **Risks**: Identify 4 specific risks with impact/priority.
      9. **Recommendations**: 4 Actionable steps with Effort/Impact ratings.
    `;
  }

  /**
   * Defines the Typescript schema for Gemini Structured Output.
   * This ensures the API returns valid JSON matching our ReportData interface.
   */
  private getSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        type: { type: Type.STRING },
        date: { type: Type.STRING },
        audience: { type: Type.STRING },
        summary: { type: Type.STRING },
        marketContext: { type: Type.STRING },
        executiveBrief: {
            type: Type.OBJECT,
            properties: {
                cfoView: { type: Type.STRING },
                croView: { type: Type.STRING },
                cooView: { type: Type.STRING }
            }
        },
        metrics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.STRING },
              trend: { type: Type.NUMBER },
              iconType: { type: Type.STRING, enum: ["volume", "trend", "growth", "chart"] }
            }
          }
        },
        insights: {
          type: Type.ARRAY,
          items: { 
              type: Type.OBJECT,
              properties: {
                  text: { type: Type.STRING },
                  source: { type: Type.STRING }
              }
          }
        },
        risks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              priority: { type: Type.STRING, enum: ["Critical", "Monitor", "Low"] }
            }
          }
        },
        recommendations: {
          type: Type.ARRAY,
          items: { 
              type: Type.OBJECT,
              properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  effort: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
              }
           }
        },
        competitors: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    marketShare: { type: Type.NUMBER },
                    growth: { type: Type.NUMBER },
                    sentiment: { type: Type.NUMBER }
                }
            }
        },
        chartData: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              primary: { type: Type.NUMBER },
              secondary: { type: Type.NUMBER },
              amt: { type: Type.NUMBER }
            }
          }
        },
        tableData: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              primary: { type: Type.NUMBER },
              secondary: { type: Type.NUMBER },
              contribution: { type: Type.NUMBER }
            }
          }
        },
        scenarios: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    min: { type: Type.NUMBER },
                    max: { type: Type.NUMBER },
                    defaultValue: { type: Type.NUMBER },
                    step: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    impactFactor: { type: Type.NUMBER }
                }
            }
        },
        forecastData: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    lowerBound: { type: Type.NUMBER },
                    upperBound: { type: Type.NUMBER }
                }
            }
        },
        strategicMap: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    dim: { type: Type.STRING },
                    A: { type: Type.NUMBER },
                    B: { type: Type.NUMBER },
                    fullMark: { type: Type.NUMBER }
                }
            }
        }
      }
    };
  }
}
