import React from 'react';
import {
  Compass,
  Star,
  Settings,
  Sparkles,
  BarChart3,
  Map as MapIcon,
  BellRing,
  Sun,
  Moon,
  Shirt,
} from 'lucide-react';
import { TemperatureUnit, WindSpeedUnit, TimeFormat } from '../types/weather';
import { LocationSolarTimeInfo } from '../services/themeService';

interface NavbarProps {
  tempUnit: TemperatureUnit;
  onToggleTempUnit: () => void;
  windUnit: WindSpeedUnit;
  onToggleWindUnit: () => void;
  timeFormat: TimeFormat;
  onToggleTimeFormat: () => void;
  activeAlertCount?: number;
  onScrollTo: (sectionId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  solarInfo?: LocationSolarTimeInfo;
}

export const Navbar: React.FC<NavbarProps> = ({
  tempUnit,
  onToggleTempUnit,
  windUnit,
  onToggleWindUnit,
  timeFormat,
  onToggleTimeFormat,
  activeAlertCount = 0,
  onScrollTo,
  isFavorite,
  onToggleFavorite,
  solarInfo,
}) => {
  const isDay = solarInfo ? solarInfo.isDay : false;

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#06080F]/80 border-b border-slate-800/80 transition-colors duration-700">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-wider text-white font-['Outfit']">
                ATMOS
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest">
                AI 2.0
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight -mt-0.5 hidden sm:inline">
              Weather Intelligence Platform
            </span>
          </div>
        </div>

        {/* Quick Nav Anchors */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onScrollTo('forecast-timeline')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => onScrollTo('radar-map')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <MapIcon className="w-4 h-4 text-emerald-400" />
            <span>Radar Map</span>
          </button>
          <button
            onClick={() => onScrollTo('weather-analytics')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => onScrollTo('ai-prediction-dashboard')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Predictions</span>
          </button>
          <button
            onClick={() => onScrollTo('ai-outfit-planner')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <Shirt className="w-4 h-4 text-emerald-400" />
            <span>AI Outfits</span>
          </button>
          <button
            onClick={() => onScrollTo('ai-assistant')}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Assistant</span>
          </button>
          {activeAlertCount > 0 && (
            <button
              onClick={() => onScrollTo('weather-alerts')}
              className="text-amber-400 flex items-center gap-1.5 animate-pulse"
            >
              <BellRing className="w-4 h-4" />
              <span>Alerts ({activeAlertCount})</span>
            </button>
          )}
        </nav>

        {/* Controls & Unit Switches */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Automatic Solar Theme Indicator (Icon only - no text label) */}
          {solarInfo && (
            <div
              className={`hidden sm:flex items-center justify-center p-2 rounded-xl border transition-all ${
                isDay
                  ? 'bg-amber-400/20 border-amber-400/50 text-amber-500 shadow-md shadow-amber-300/30'
                  : 'bg-navy-900/60 border-blue-500/30 text-blue-300 shadow-md shadow-blue-950/50'
              }`}
              title={solarInfo.solarStatusDescription}
            >
              {isDay ? (
                <Sun className="w-4 h-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </div>
          )}

          {/* Favorite City Button */}
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-xl border transition-all ${
              isFavorite
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Save as favorite city'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Unit Switch: C / F */}
          <button
            onClick={onToggleTempUnit}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1"
            title="Toggle Celsius / Fahrenheit"
          >
            <span className={tempUnit === 'celsius' ? 'text-cyan-400 font-bold' : 'text-slate-400'}>°C</span>
            <span className="text-slate-600">/</span>
            <span className={tempUnit === 'fahrenheit' ? 'text-cyan-400 font-bold' : 'text-slate-400'}>°F</span>
          </button>

          {/* Wind Unit Switch */}
          <button
            onClick={onToggleWindUnit}
            className="hidden sm:flex px-2 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-[11px] font-mono text-slate-300 uppercase transition-colors"
            title="Toggle Wind Speed Units"
          >
            {windUnit}
          </button>
        </div>
      </div>
    </header>
  );
};
