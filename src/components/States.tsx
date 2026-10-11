import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Retrieving atmospheric telemetry from global radar network...',
}) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center z-20 relative">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-cyan-400/20 animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white font-['Outfit'] mb-2">
        Calibrating Weather Grid
      </h3>
      <p className="text-sm text-slate-400 max-w-sm">
        {message}
      </p>
    </div>
  );
};

export const ErrorState: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center z-20 relative">
      <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 mb-5">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h3 className="text-2xl font-bold text-white font-['Outfit'] mb-2">
        Telemetry Signal Interrupted
      </h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {error || 'Unable to retrieve live numerical forecasts from the Open-Meteo API. Please verify network access or query parameters.'}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Re-establish Uplink</span>
      </button>
    </div>
  );
};
