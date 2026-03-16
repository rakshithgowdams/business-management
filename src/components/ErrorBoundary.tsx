import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ background: '#0a0a0a', minHeight: '100vh' }}
          className="flex flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <AlertTriangle className="w-10 h-10 text-orange-400" />
          <h2 className="text-white text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-gray-400 max-w-md">
            {this.props.fallbackMessage || 'Something went wrong loading this section.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
