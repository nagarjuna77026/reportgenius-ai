
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, Target } from 'lucide-react';
import { TutorialStep } from '../types';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const STEPS: TutorialStep[] = [
  {
    target: 'center',
    title: 'Welcome to ReportGenius AI',
    content: 'Your intelligent companion for professional business reporting. Let\'s take a quick tour of the interface.',
    position: 'center'
  },
  {
    target: 'sidebar-data-tab',
    title: '1. Connect Your Data',
    content: 'Use the Data Source tab to connect APIs, Databases, or upload CSV/Excel files. You can also use Demo data to test.',
    position: 'right'
  },
  {
    target: 'sidebar-template-tab',
    title: '2. Choose a Template',
    content: 'Switch to the Templates tab to customize the layout, color scheme, and specific sections of your report.',
    position: 'right'
  },
  {
    target: 'analysis-context-area',
    title: '3. Define Context',
    content: 'In the Data tab, set your time period and specific analysis instructions to guide the AI.',
    position: 'right'
  },
  {
    target: 'generate-btn',
    title: '4. Generate Intelligence',
    content: 'Once configured, click here. The AI will analyze your data and write a full report with charts and insights.',
    position: 'right'
  },
  {
    target: 'view-mode-toggle',
    title: '5. View Modes',
    content: 'Switch between the Document view (for reading/printing) and Dashboard view (for presentations).',
    position: 'bottom'
  },
  {
    target: 'assistant-tab',
    title: '6. AI Assistant',
    content: 'Have questions about the report? Switch to the Assistant tab to chat with your data directly.',
    position: 'left'
  }
];

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [coords, setCoords] = useState<{top: number, left: number, width: number, height: number} | null>(null);
  const [elementFound, setElementFound] = useState(true);

  const currentStep = STEPS[currentStepIndex];

  const updateCoords = () => {
    if (currentStep.target === 'center') {
      setCoords(null);
      setElementFound(true);
      return;
    }

    const element = document.getElementById(currentStep.target);
    if (element) {
        const rect = element.getBoundingClientRect();
        // Check if element is actually visible in viewport
        if (rect.width === 0 || rect.height === 0 || element.offsetParent === null) {
             setCoords(null);
             setElementFound(false);
        } else {
            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
            setElementFound(true);
        }
    } else {
        setCoords(null);
        setElementFound(false);
    }
  };

  useEffect(() => {
    // Initial update
    updateCoords();
    
    // Add retry for dynamic content
    const timer = setTimeout(updateCoords, 300);

    // Add resize listener
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
    };
  }, [currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Calculate position styles
  const getCardStyle = () => {
      // Default center style if element not found or explicit center
      if (!coords || !elementFound || currentStep.position === 'center') {
          return {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              position: 'fixed' as const
          };
      }

      // Position relative to target
      const gap = 20;
      let top = 0;
      let left = 0;

      switch(currentStep.position) {
          case 'right':
              top = coords.top;
              left = coords.left + coords.width + gap;
              break;
          case 'left':
              top = coords.top;
              left = coords.left - 340; // width of card + gap
              break;
          case 'bottom':
              top = coords.top + coords.height + gap;
              left = coords.left;
              break;
          case 'top':
              top = coords.top - 250; // height of card approx
              left = coords.left;
              break;
          default:
               // fallback to center if logic fails
               return {
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  position: 'fixed' as const
              };
      }

      // Bounds checking (basic)
      if (top < 20) top = 20;
      if (top > window.innerHeight - 300) top = window.innerHeight - 300;

      return {
          top,
          left,
          position: 'absolute' as const
      };
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 transition-all duration-500" />

      {/* Highlight Box */}
      {coords && elementFound && (
        <div 
          className="absolute border-2 border-brand-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-lg transition-all duration-300 pointer-events-none z-10"
          style={{
            top: coords.top - 4,
            left: coords.left - 4,
            width: coords.width + 8,
            height: coords.height + 8,
          }}
        >
             {/* Pulse effect */}
            <div className="absolute inset-0 border border-brand-accent/50 rounded-lg animate-ping"></div>
        </div>
      )}

      {/* Card Container */}
      <div 
        className="z-20 transition-all duration-500"
        style={getCardStyle()}
      >
        <div className="bg-white dark:bg-gray-800 w-80 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300">
           {/* Progress Bar */}
           <div className="h-1 bg-gray-100 dark:bg-gray-700">
               <div 
                  className="h-full bg-brand-accent transition-all duration-300" 
                  style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }} 
               />
           </div>
           
           <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-brand-accent uppercase tracking-wider flex items-center gap-2">
                      <Target size={14}/> Step {currentStepIndex + 1} of {STEPS.length}
                  </span>
                  <button onClick={onComplete} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <X size={16} />
                  </button>
              </div>

              {!elementFound && currentStep.target !== 'center' && (
                  <div className="mb-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-lg border border-yellow-100 dark:border-yellow-900">
                      Tip: This feature is currently hidden or on another tab.
                  </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{currentStep.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  {currentStep.content}
              </p>

              <div className="flex justify-between items-center">
                  <button 
                    onClick={handlePrev}
                    disabled={currentStepIndex === 0}
                    className={`p-2 rounded-lg transition-colors ${
                        currentStepIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                      <ChevronLeft size={20} />
                  </button>

                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-accentHover text-white rounded-lg font-bold text-sm transition-colors shadow-md"
                  >
                      {currentStepIndex === STEPS.length - 1 ? 'Get Started' : 'Next'}
                      {currentStepIndex === STEPS.length - 1 ? <CheckCircle size={16}/> : <ChevronRight size={16} />}
                  </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
