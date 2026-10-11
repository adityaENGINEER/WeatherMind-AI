import React from 'react';
import { Compass, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#04060A]/95 py-12 px-4 sm:px-8 lg:px-12 xl:px-16 mt-16 z-10 relative">
      <div className="w-full max-w-none flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white font-['Outfit'] tracking-wider">
              ATMOS
            </span>
            <span className="text-xs text-slate-500 block">
              AI-Powered Atmospheric Intelligence & Telemetry Platform
            </span>
          </div>
        </div>

        {/* Source citation */}
        <div className="text-xs text-slate-400 text-center md:text-left space-y-1">
          <p>
            Data provided by <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Open-Meteo</a> API under CC BY 4.0.
          </p>
          <p className="text-slate-500">
            High-Resolution Numerical Forecast Models: ECMWF, GFS, ICON, and DWD.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>GLOBAL RADAR ONLINE</span>
        </div>
      </div>
    </footer>
  );
};
