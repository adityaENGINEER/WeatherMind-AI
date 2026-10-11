import React, { useRef } from 'react';
import { HourlyForecastItem, TemperatureUnit, TimeFormat } from '../types/weather';
import { formatHour, formatTemp, getWeatherCondition } from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';
import { ChevronLeft, ChevronRight, Droplets, Wind } from 'lucide-react';

interface HourlyTimelineProps {
  hourly: HourlyForecastItem[];
  tempUnit: TemperatureUnit;
  timeFormat: TimeFormat;
}

export const HourlyTimeline: React.FC<HourlyTimelineProps> = ({
  hourly,
  tempUnit,
  timeFormat,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Find index of current hour
  const now = new Date();
  const currentHourString = now.getHours();

  return (
    <section id="forecast-timeline" className="py-12 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10 relative">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Temporal Telemetry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hourly Atmosphere Projection
          </h2>
        </div>

        {/* Scroll Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Scroll previous hours"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Scroll next hours"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Timeline Track */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-700/60 scrollbar-track-transparent select-none"
      >
        {hourly.slice(0, 36).map((item, index) => {
          const itemDate = new Date(item.time);
          const isCurrentHour = index === 0 || itemDate.getHours() === currentHourString;
          const condition = getWeatherCondition(item.weatherCode, item.isDay);

          return (
            <div
              key={item.time}
              className={`snap-start shrink-0 w-28 sm:w-32 p-4 rounded-3xl flex flex-col items-center justify-between text-center transition-all ${
                isCurrentHour
                  ? 'bg-gradient-to-b from-cyan-950/60 via-slate-900/80 to-[#0A101D] border-2 border-cyan-400/80 shadow-xl shadow-cyan-950/50 scale-[1.02]'
                  : 'glass-panel-interactive'
              }`}
            >
              {/* Time header */}
              <div className="flex flex-col items-center">
                <span className={`text-xs font-semibold ${isCurrentHour ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {isCurrentHour ? 'Now' : formatHour(item.time, timeFormat)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {itemDate.toLocaleDateString([], { weekday: 'narrow' })}
                </span>
              </div>

              {/* Weather Condition Icon */}
              <div className="my-3 py-1">
                <WeatherIcon
                  name={condition.icon}
                  className="w-8 h-8"
                  color={condition.accentColor}
                />
              </div>

              {/* Temperature */}
              <div className="font-['Outfit'] font-black text-xl text-white">
                {formatTemp(item.temperature, tempUnit)}
              </div>

              {/* Precipitation Chance pill */}
              <div className="mt-3 w-full pt-2 border-t border-slate-800/80 flex flex-col gap-1 items-center">
                <div className="flex items-center gap-1 text-[11px] text-cyan-400">
                  <Droplets className="w-3 h-3" />
                  <span>{item.precipitationProbability}%</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Wind className="w-3 h-3 text-slate-500" />
                  <span>{Math.round(item.windSpeed)}k</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
