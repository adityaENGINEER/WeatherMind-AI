import React, { useState } from 'react';
import { DailyForecastItem, TemperatureUnit } from '../types/weather';
import { formatDayName, formatTemp, getWeatherCondition } from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';
import { ChevronDown, Droplets, Wind, Sun, Clock } from 'lucide-react';

interface WeeklyForecastProps {
  daily: DailyForecastItem[];
  tempUnit: TemperatureUnit;
}

export const WeeklyForecast: React.FC<WeeklyForecastProps> = ({ daily, tempUnit }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Calculate global min and max temperatures for the week to render relative visual bars
  const globalMin = Math.min(...daily.map(d => d.temperatureMin));
  const globalMax = Math.max(...daily.map(d => d.temperatureMax));
  const tempRange = Math.max(1, globalMax - globalMin);

  return (
    <section className="py-10 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Multi-Day Trajectory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            7-Day Synoptic Forecast
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Click any day to examine detailed meteorological envelopes
        </p>
      </div>

      <div className="space-y-3">
        {daily.slice(0, 7).map((item, index) => {
          const condition = getWeatherCondition(item.weatherCode, true);
          const isExpanded = expandedIndex === index;
          const leftPercent = Math.max(0, ((item.temperatureMin - globalMin) / tempRange) * 100);
          const rightPercent = Math.min(100, ((item.temperatureMax - globalMin) / tempRange) * 100);
          const widthPercent = Math.max(8, rightPercent - leftPercent);

          const dateObj = new Date(item.date);
          const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return (
            <div
              key={item.date}
              className={`rounded-2xl transition-all duration-300 overflow-hidden ${
                isExpanded
                  ? 'bg-slate-900/90 border border-cyan-500/40 shadow-xl shadow-cyan-950/30'
                  : 'glass-panel hover:bg-slate-900/60 border border-slate-800/80 cursor-pointer'
              }`}
            >
              {/* Main Summary Row */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none cursor-pointer"
              >
                {/* Day name and date */}
                <div className="flex items-center gap-4 w-44">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base text-white font-['Outfit']">
                      {formatDayName(item.date, index === 0)}
                    </span>
                    <span className="text-xs text-slate-400">{formattedDate}</span>
                  </div>
                </div>

                {/* Weather condition label & icon */}
                <div className="flex items-center gap-3 w-52">
                  <WeatherIcon
                    name={condition.icon}
                    className="w-6 h-6 shrink-0"
                    color={condition.accentColor}
                  />
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {condition.label}
                  </span>
                </div>

                {/* Precipitation chance indicator */}
                <div className="flex items-center gap-1.5 w-24 text-xs font-medium text-cyan-400">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>{item.precipitationProbabilityMax}%</span>
                  {item.precipitationSum > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">({item.precipitationSum}mm)</span>
                  )}
                </div>

                {/* Relative thermal bar range */}
                <div className="flex-1 flex items-center gap-3 max-w-sm">
                  <span className="text-xs font-mono text-slate-400 w-10 text-right">
                    {formatTemp(item.temperatureMin, tempUnit)}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800/80 relative overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-400 to-amber-400 opacity-80"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-white w-10">
                    {formatTemp(item.temperatureMax, tempUnit)}
                  </span>
                </div>

                {/* Toggle chevron */}
                <div className="hidden sm:block text-slate-400">
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Detailed Breakdown */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in duration-200">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sunrise & Sunset</span>
                    </div>
                    <div className="text-xs font-mono text-slate-200">
                      ↑ {new Date(item.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      ↓ {new Date(item.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Wind className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Max Wind Velocity</span>
                    </div>
                    <div className="text-sm font-bold text-white font-['Outfit']">
                      {Math.round(item.windSpeedMax)} km/h
                    </div>
                    <span className="text-[10px] text-slate-400">Peak gusts anticipated</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Sun className="w-3.5 h-3.5 text-orange-400" />
                      <span>Max UV Index</span>
                    </div>
                    <div className="text-sm font-bold text-amber-300 font-['Outfit']">
                      {item.uvIndexMax.toFixed(1)} / 11
                    </div>
                    <span className="text-[10px] text-slate-400">Midday peak exposure</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Daylight Duration</span>
                    </div>
                    <div className="text-sm font-bold text-cyan-200 font-mono">
                      {Math.floor(item.daylightDuration / 3600)}h {Math.round((item.daylightDuration % 3600) / 60)}m
                    </div>
                    <span className="text-[10px] text-slate-400">Total diurnal irradiance</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
