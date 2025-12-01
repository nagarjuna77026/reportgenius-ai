
import React from 'react';

interface MarkdownTextProps {
  content: string;
  className?: string;
  highlight?: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ content, className = '', highlight = '' }) => {
  if (!content) return null;

  // Helper to highlight text case-insensitively
  const highlightText = (text: string) => {
    if (!highlight || !text) return text;
    
    // Escape regex special characters
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white rounded-sm px-0.5 mx-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const renderText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('### ')) return <h3 key={index} className="text-md font-bold mt-3 mb-1">{highlightText(parseInline(line.replace('### ', '')))}</h3>;
      if (line.startsWith('## ')) return <h2 key={index} className="text-lg font-bold mt-4 mb-2">{highlightText(parseInline(line.replace('## ', '')))}</h2>;
      if (line.startsWith('# ')) return <h1 key={index} className="text-xl font-bold mt-5 mb-3">{highlightText(parseInline(line.replace('# ', '')))}</h1>;
      
      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
            <div key={index} className="flex gap-2 ml-2 mb-1">
                <span className="text-brand-accent">•</span>
                <span>{highlightText(parseInline(line.replace(/^[\-*] /, '')))}</span>
            </div>
        );
      }
      
      // Ordered Lists
      if (/^\d+\./.test(line.trim())) {
           return (
            <div key={index} className="flex gap-2 ml-2 mb-1">
                <span className="font-bold text-gray-500 text-xs mt-1">{line.match(/^\d+\./)?.[0]}</span>
                <span>{highlightText(parseInline(line.replace(/^\d+\.\s/, '')))}</span>
            </div>
        );
      }

      // Empty lines
      if (line.trim() === '') return <div key={index} className="h-2"></div>;

      // Paragraphs
      return <p key={index} className="mb-1">{highlightText(parseInline(line))}</p>;
    });
  };

  // Strip bold markers for now when rendering inline to simplify mixing with highlight
  // In a full markdown parser, this would be an AST transformation
  const parseInline = (text: string) => {
    return text.replace(/\*\*/g, ''); 
  };

  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      {renderText(content)}
    </div>
  );
};

export default MarkdownText;
