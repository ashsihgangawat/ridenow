import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MapPin } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MapErrorBoundary] Map subsystem caught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[380px] bg-[#0c0c10] border border-yellow-500/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-black text-white">Interactive Map Standby</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              {this.props.fallbackMessage ||
                'Vector tile rendering encountered a temporary browser or WebGL pause. Your booking data remains preserved.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl shadow-neon-yellow transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Map</span>
            </button>
          </div>

          <div className="pt-2 flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono">
            <MapPin className="w-3.5 h-3.5 text-yellow-400" />
            <span>OpenFreeMap Liberty • Indian Mobility GIS</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

