import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.componentName || 'Component'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }

      return (
        <div className="p-6 m-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl flex flex-col items-center justify-center text-center min-h-[200px] h-full">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {this.props.componentName ? `${this.props.componentName} Error` : 'Something went wrong'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 max-w-sm">
            {this.state.error?.message || "An unexpected error occurred while rendering this section."}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-gray-700 dark:text-gray-200"
          >
            <RefreshCw size={14} /> Attempt Recovery
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;