import React from 'react';

interface Props {
  children: React.ReactNode;
  /** When this value changes, a caught error is cleared (e.g. pass the route path). */
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Catches render errors in the subtree so a single broken page shows a
 * recoverable message instead of white-screening the entire app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Something went wrong loading this page.</p>
          {this.state.error?.message && (
            <p className="text-red-600 text-sm mb-4 break-words">{this.state.error.message}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
