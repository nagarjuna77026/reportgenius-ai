

import { GoogleGenAI, Type } from "@google/genai";
import { ReportData, AnalysisContext, DataSourceConfig, ChatMessage, Source } from "../types";
import { DEMO_SALES_REPORT } from "../constants";

// Helper to clean JSON string from Markdown fences
const cleanJsonString = (text: string): string => {
    let clean = text.trim();
    // Remove markdown code blocks if present
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json/, "").replace(/```$/, "");
    } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```/, "").replace(/```$/, "");
    }
    return clean.trim();
};

export const generateReport = async (
  context: AnalysisContext,
  sourceConfig: DataSourceConfig,
  userApiKey?: string
): Promise<ReportData> => {
  // This function is effectively replaced by AnalysisAgent.ts in the full orchestrator flow, 
  // but kept here as a fallback or for direct calls if needed.
  
  // Reuse the logic from the new AnalysisAgent
  const apiKey = userApiKey || process.env.API_KEY;

  if (!apiKey) {
      if (sourceConfig.type === 'demo') {
          await new Promise((resolve) => setTimeout(resolve, 1500)); 
          return DEMO_SALES_REPORT;
      } else {
          throw new Error("API Key is missing. Please add it in Settings.");
      }
  }

  // Fallback implementation using the new Agent class logic directly
  // In a real app, this file might be deprecated in favor of using the Orchestrator exclusively.
  const { AnalysisAgent } = await import('../agents/AnalysisAgent');
  const agent = new AnalysisAgent(apiKey);
  
  // Mock collecting data (simplified)
  let dataContext = '';
  if(sourceConfig.fileContent) dataContext = sourceConfig.fileContent.substring(0, 100000);
  else dataContext = "Use simulated demo data.";
  
  return agent.analyzeData(dataContext, context);
};

// Guard to check if we are in comparison mode
function isComparisonContext(ctx: any): ctx is { current: ReportData, comparison: ReportData } {
    return ctx && typeof ctx === 'object' && 'current' in ctx && 'comparison' in ctx && !!ctx.current && !!ctx.comparison;
}

export const chatWithData = async (
    message: string, 
    reportContext: ReportData | { current: ReportData, comparison: ReportData } | null, 
    history: ChatMessage[],
    userApiKey?: string
): Promise<{ text: string; sources?: Source[] }> => {
    const apiKey = userApiKey || process.env.API_KEY;
    
    if (!apiKey) {
        return { text: "I am currently in demo mode. Please configure an API Key in Settings to chat with your data dynamically." };
    }

    if (!reportContext) {
        return { text: "Please generate a report first so I can analyze the data for you." };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Determine context type and build appropriate system instruction
        let systemDataSection = "";
        
        if (isComparisonContext(reportContext)) {
             // Comparison Mode: Cleanse data to save tokens
             const currentLite = { 
                 title: reportContext.current.title,
                 date: reportContext.current.date,
                 metrics: reportContext.current.metrics,
                 summary: reportContext.current.summary,
                 insights: reportContext.current.insights,
                 tableData: reportContext.current.tableData?.slice(0, 8) || [] 
             };
             
             const comparisonLite = {
                 title: reportContext.comparison.title,
                 date: reportContext.comparison.date,
                 metrics: reportContext.comparison.metrics,
                 summary: reportContext.comparison.summary,
                 insights: reportContext.comparison.insights,
                 tableData: reportContext.comparison.tableData?.slice(0, 8) || [] 
             };

             systemDataSection = `
             MODE: COMPARISON ANALYSIS
             
             CURRENT REPORT:
             ${JSON.stringify(currentLite)}
     
             HISTORICAL REPORT FOR COMPARISON:
             ${JSON.stringify(comparisonLite)}
     
             INSTRUCTIONS:
             - Compare the two reports.
             - Analyze growth/decline in key metrics (Current vs Historical).
             - Highlight new risks or insights that appeared in the current report.
             - If the user asks about specific numbers, calculate the difference.
             `;
        } else {
             // Single Report Mode: Strip potentially huge arrays if they are too big
             // Check if it's a valid report object with data
             const r = reportContext as ReportData;
             if (!r.title && !r.metrics) {
                 return { text: "The report data seems incomplete. I cannot analyze it." };
             }

             const reportLite = { 
                 ...r, 
                 chartData: r.chartData?.slice(0, 20) || [],
                 tableData: r.tableData?.slice(0, 20) || []
             };

             systemDataSection = `
             REPORT DATA:
             ${JSON.stringify(reportLite)}
             `;
        }

        const systemInstruction = `You are an expert Senior Data Analyst.
        
        CONTEXT:
        User is asking questions about a business intelligence report.
        
        ${systemDataSection}

        INSTRUCTIONS:
        - Answer strictly based on the report data provided.
        - Be concise, professional, and insightful.
        - Use Markdown formatting (bold, bullet points, lists) to make your answer easy to read.
        - If asked for calculations, perform them based on the metrics available.
        - You have access to Google Search to fetch external benchmarks or clarify industry terms if asked.
        `;

        const relevantHistory = history.filter(h => h.role !== 'system' && !h.content.includes("error"));
        
        const currentMsg = relevantHistory[relevantHistory.length - 1];
        const previousHistory = relevantHistory.slice(0, -1);

        const historyForSdk = previousHistory.map(h => {
            const parts: any[] = [];
            
            if (h.attachment?.type === 'image') {
                // Handle base64 stripping safely
                const content = h.attachment.content || "";
                const base64Data = content.includes('base64,') ? content.split('base64,')[1] : content;
                
                parts.push({
                    inlineData: {
                        mimeType: h.attachment.mimeType,
                        data: base64Data
                    }
                });
            }
            
            if (h.content) {
                parts.push({ text: h.content });
            } else if (parts.length === 0) {
                parts.push({ text: "..." }); 
            }

            return {
                role: h.role === 'user' ? 'user' : 'model',
                parts: parts
            };
        });

        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: { 
                systemInstruction,
                tools: [{ googleSearch: {} }] // Enable Google Search Grounding for the Assistant
            },
            history: historyForSdk
        });
        
        const messageParts: any[] = [];
        
        if (currentMsg.attachment?.type === 'image') {
            const content = currentMsg.attachment.content || "";
            const base64Data = content.includes('base64,') ? content.split('base64,')[1] : content;
            
            messageParts.push({
                inlineData: {
                    mimeType: currentMsg.attachment.mimeType,
                    data: base64Data
                }
            });
        }
        
        if (message) {
            messageParts.push({ text: message });
        }

        const result = await chat.sendMessage({ 
            message: messageParts.length > 0 ? messageParts : message 
        });

        const responseText = result.text || "I couldn't generate a response.";
        
        // Extract Grounding Sources
        const sources: Source[] = [];
        const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (groundingChunks) {
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri && chunk.web?.title) {
                    sources.push({
                        title: chunk.web.title,
                        uri: chunk.web.uri
                    });
                }
            });
        }

        return { text: responseText, sources };

    } catch (error) {
        console.error("Chat API Error:", error);
        return { text: "I encountered an error connecting to the AI service. Please check your connection or API key." };
    }
}