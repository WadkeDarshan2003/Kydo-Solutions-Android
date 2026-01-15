import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-xl font-bold">Something went wrong</h2>
            </div>
            
            <p className="text-gray-600 mb-4 text-sm">
              An unexpected error occurred while rendering this page.
            </p>

            <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-6 overflow-auto max-h-48">
              <code className="text-xs text-red-800 block whitespace-pre-wrap font-mono">
                {this.state.error && this.state.error.toString()}
              </code>
              {this.state.errorInfo && (
                <details className="mt-2 text-xs text-red-700">
                    <summary className="cursor-pointer font-semibold mb-1">Stack Trace</summary>
                    <pre className="whitespace-pre-wrap pl-2 border-l-2 border-red-200">
                        {this.state.errorInfo.componentStack}
                    </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-gray-800 transition-colors"
                title="Reload Application"
              >
                <RefreshCw className="w-4 h-4" />
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
