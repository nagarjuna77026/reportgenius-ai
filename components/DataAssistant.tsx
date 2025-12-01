

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BarChart2, Activity, Sparkles, Paperclip, X, Image as ImageIcon, Mic, Download, GitCompare, ArrowRightLeft, ExternalLink } from 'lucide-react';
import { ReportData, ChatMessage, Attachment, SavedReportMetadata } from '../types';
import { chatWithData } from '../services/geminiService';
import { reportService } from '../services/reportService';
import MarkdownText from './MarkdownText';

interface DataAssistantProps {
  reportData: ReportData | null;
  apiKey?: string;
}

const DataAssistant: React.FC<DataAssistantProps> = ({ reportData, apiKey }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Analysis complete. I've reviewed the data and your focus areas. What specific details would you like to explore?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Comparison State
  const [comparisonReport, setComparisonReport] = useState<ReportData | null>(null);
  const [showHistorySelector, setShowHistorySelector] = useState(false);
  const [historyList, setHistoryList] = useState<SavedReportMetadata[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setAttachment({
                  type: 'image',
                  content: ev.target?.result as string,
                  mimeType: file.type
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const startListening = () => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          
          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
          recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setInput(prev => prev + (prev ? ' ' : '') + transcript);
          };
          
          recognition.start();
      } else {
          alert("Voice input is not supported in this browser.");
      }
  };

  const exportChat = () => {
      const text = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_history_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const toggleHistorySelector = () => {
      if (!showHistorySelector) {
          // Load history, excluding current report
          const list = reportService.getHistory().filter(r => r.id !== reportData?.id);
          setHistoryList(list);
      }
      setShowHistorySelector(!showHistorySelector);
  };

  const selectComparison = (id: string) => {
      const report = reportService.loadReport(id);
      if (report) {
          setComparisonReport(report);
          setShowHistorySelector(false);
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: `**Comparison Mode Active**: I've loaded "**${report.title}**" (${report.date}). You can now ask me to compare trends, metrics, and risks between the two reports.`,
              timestamp: new Date()
          }]);
      }
  };

  const clearComparison = () => {
      setComparisonReport(null);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Comparison disabled. Focusing on the current report only.`,
        timestamp: new Date()
    }]);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !attachment) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      attachment: attachment ? {...attachment} : undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
    setIsTyping(true);

    try {
        const history = [...messages, userMsg];
        
        // Prepare context: either single report or comparison object
        const contextPayload = comparisonReport && reportData 
            ? { current: reportData, comparison: comparisonReport } 
            : reportData || {} as any;

        const response = await chatWithData(textToSend, contextPayload, history, apiKey);
        
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.text,
            sources: response.sources,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
        const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I encountered an error processing your request.",
            timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMsg]);
    }
    
    setIsTyping(false);
  };

  const suggestions = [
      "What are the top 3 risks?",
      "Summarize the growth trends",
      "Show breakdown by region",
      "Predict next quarter revenue"
  ];

  if (comparisonReport) {
      suggestions.push("Compare key metrics");
      suggestions.push("What changed since last report?");
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300 relative z-0">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 z-50 rounded-t-lg relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center text-brand-accent relative">
             <Bot size={20} />
             <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white">AI Data Analyst</h3>
            <p className="text-xs text-green-600 font-medium">Online • Vision Enabled</p>
          </div>
        </div>
        <div className="flex gap-1 relative">
            <button 
                onClick={comparisonReport ? clearComparison : toggleHistorySelector} 
                className={`p-2 rounded-lg transition-colors ${comparisonReport ? 'bg-brand-accent text-white shadow-sm' : 'hover:bg-white dark:hover:bg-gray-800 text-gray-400 hover:text-brand-accent'}`} 
                title={comparisonReport ? "Clear Comparison" : "Compare Reports"}
            >
                <GitCompare size={18} />
            </button>
            <button onClick={exportChat} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-brand-accent transition-colors" title="Export Chat">
                <Download size={18} />
            </button>
            <button className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-brand-accent transition-colors" title="Bar Chart">
                <BarChart2 size={18} />
            </button>

             {/* History Selector Dropdown */}
            {showHistorySelector && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 z-[100] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-bold text-[10px] text-gray-500 uppercase flex justify-between items-center">
                        <span>Select for Comparison</span>
                        <button onClick={() => setShowHistorySelector(false)}><X size={12}/></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {historyList.length === 0 ? (
                            <div className="p-4 text-xs text-gray-500 text-center">No other reports found in history.</div>
                        ) : (
                            historyList.map(h => (
                                <button 
                                    key={h.id}
                                    onClick={() => selectComparison(h.id)}
                                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors group"
                                >
                                    <div className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-accent">{h.title}</div>
                                    <div className="text-xs text-gray-500 flex justify-between mt-1">
                                        <span>{h.date}</span>
                                        <span className="uppercase text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 rounded">{h.type}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Comparison Indicator Bar */}
      {comparisonReport && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center animate-in slide-in-from-top-2 relative z-10">
              <div className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <ArrowRightLeft size={14}/>
                  <span>Comparing current data with <strong>{comparisonReport.title}</strong></span>
              </div>
              <button onClick={clearComparison} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"><X size={14}/></button>
          </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50 relative z-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-brand-dark text-brand-accent'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className="max-w-[80%] space-y-2">
                {msg.attachment && msg.attachment.type === 'image' && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={msg.attachment.content} alt="Uploaded analysis" className="max-w-full h-auto max-h-48 object-cover" />
                    </div>
                )}
                {msg.content && (
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                        ? 'bg-brand-accent text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                    }`}>
                      {msg.role === 'user' ? msg.content : <MarkdownText content={msg.content} />}
                      
                      {/* Render Grounding Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sources</div>
                              <div className="flex flex-wrap gap-2">
                                  {msg.sources.map((source, idx) => (
                                      <a 
                                        key={idx} 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-[10px] text-gray-600 dark:text-gray-300 transition-colors"
                                      >
                                          <ExternalLink size={10} />
                                          <span className="truncate max-w-[100px]">{source.title}</span>
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}
                    </div>
                )}
            </div>
          </div>
        ))}
        {isTyping && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-dark text-brand-accent flex-shrink-0 flex items-center justify-center mt-1">
                    <Activity size={14} className="animate-spin" />
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions & Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 rounded-b-lg relative z-20">
        {/* Chips */}
        <div className="flex gap-2 overflow-x-auto mb-3 pb-1 scrollbar-none">
            {suggestions.map(s => (
                <button 
                    key={s} 
                    onClick={() => handleSend(s)}
                    className="whitespace-nowrap px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-medium border border-brand-accent/20 hover:bg-brand-accent/20 transition-colors flex items-center gap-1"
                >
                    <Sparkles size={10} /> {s}
                </button>
            ))}
        </div>

        {attachment && (
            <div className="flex items-center gap-2 mb-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg w-max">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                    <ImageIcon size={14} className="text-gray-500 dark:text-gray-300"/>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-300 font-medium">Image attached</span>
                <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500 ml-1"><X size={14}/></button>
            </div>
        )}

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-brand-accent focus-within:ring-1 focus-within:ring-brand-accent/20 transition-all">
          <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept="image/*"
             onChange={handleFileSelect}
          />
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 transition-colors"
             title="Upload Image"
          >
             <Paperclip size={18} />
          </button>
          <button 
             onClick={startListening}
             className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'}`}
             title="Voice Input"
          >
             <Mic size={18} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={comparisonReport ? "Ask about differences between reports..." : "Ask a question about your data..."}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 py-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
          />
          <button 
            onClick={() => handleSend()}
            className={`p-2 rounded-lg transition-colors ${
                input.trim() || attachment
                ? 'bg-brand-accent text-white hover:bg-brand-accentHover shadow-sm' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataAssistant;