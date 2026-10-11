import React from 'react';
import { DailyForecastItem } from '../types/weather';
import { Sun, Moon, Sunrise, Sunset, Clock, Sparkles } from 'lucide-react';

interface SunTrackerProps {
  today: DailyForecastItem;
  currentTimeIso: string;
}

export const SunTracker: React.FC<SunTrackerProps> = ({ today, currentTimeIso }) => {
  const sunriseDate = new Date(today.sunrise);
  const sunsetDate = new Date(today.sunset);
  const now = new Date(currentTimeIso);

  const sunriseTime = sunriseDate.getTime();
  const sunsetTime = sunsetDate.getTime();
  const nowTime = now.getTime();

  // Calculate sun progression arc percentage (0 to 100)
  const isDay = nowTime >= sunriseTime && nowTime <= sunsetTime;
  let dayProgress = 0;

  if (nowTime < sunriseTime) {
    dayProgress = 0; // Pre-dawn
  } else if (nowTime > sunsetTime) {
    dayProgress = 100; // Dusk / Night
  } else {
    dayProgress = Math.min(100, Math.max(0, ((nowTime - sunriseTime) / (sunsetTime - sunriseTime)) * 100));
  }

  // Calculate daylight duration in hours & minutes
  const totalDaylightSec = today.daylightDuration || (sunsetTime - sunriseTime) / 1000;
  const daylightHours = Math.floor(totalDaylightSec / 3600);
  const daylightMinutes = Math.floor((totalDaylightSec % 3600) / 60);

  // Remaining daylight
  const remainingSec = Math.max(0, (sunsetTime - nowTime) / 1000);
  const remainingHours = Math.floor(remainingSec / 3600);
  const remainingMinutes = Math.floor((remainingSec % 3600) / 60);

  // SVG Arc calculation for smooth semi-circle
  // cx=150, cy=140, r=110
  const angle = (dayProgress / 100) * Math.PI; // 0 to PI
  const sunX = 150 - 110 * Math.cos(angle);
  const sunY = 130 - 100 * Math.sin(angle);

  return (
    <div className="glass-panel p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Solar Chronology
            </span>
            <h3 className="text-base font-extrabold text-white font-['Outfit']">
              Sun Arc & Daylight Tracker
            </h3>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
          isDay
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
        }`}>
          {isDay ? 'Daylight Cycle' : 'Nocturnal Phase'}
        </span>
      </div>

      {/* Visual Semi-Circular Arc Graphic */}
      <div className="relative w-full flex items-center justify-center my-3">
        <svg viewBox="0 0 300 150" className="w-full max-w-xs overflow-visible">
          {/* Base dashed celestial horizon track */}
          <path
            d="M 40 130 A 110 100 0 0 1 260 130"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="3"
            strokeDasharray="6 6"
          />

          {/* Golden traversed daylight path */}
          {dayProgress > 0 && (
            <path
              d="M 40 130 A 110 100 0 0 1 260 130"
              fill="none"
              stroke="url(#solarArcGradient)"
              strokeWidth="4"
              strokeDasharray="345"
              strokeDashoffset={345 - (345 * dayProgress) / 100}
            />
          )}

          {/* Horizon Line */}
          <line
            x1="20"
            y1="130"
            x2="280"
            y2="130"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1.5"
          />

          {/* Current Sun / Celestial Body Orb */}
          {isDay ? (
            <g transform={`translate(${sunX}, ${sunY})`}>
              <circle r="14" fill="rgba(245, 158, 11, 0.25)" className="animate-ping" />
              <circle r="8" fill="#F59E0B" filter="drop-shadow(0 0 8px #FBBF24)" />
            </g>
          ) : (
            <g transform="translate(150, 130)">
              <circle r="7" fill="#818CF8" />
            </g>
          )}

          <defs>
            <linearGradient id="solarArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Sunrise & Sunset Timestamp Milestones */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Sunrise className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-medium">Sunrise</span>
            <p className="text-base font-bold text-white font-mono">
              {sunriseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end text-right">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-medium">Sunset</span>
            <p className="text-base font-bold text-white font-mono">
              {sunsetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
            <Sunset className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Metrics footer: Daylight span & Remaining */}
      <div className="mt-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Total Daylight:</span>
          <span className="font-bold text-white font-mono">
            {daylightHours}h {daylightMinutes}m
          </span>
        </div>
        <div>
          {isDay ? (
            <span className="text-amber-300 font-medium font-mono">
              {remainingHours}h {remainingMinutes}m remaining
            </span>
          ) : (
            <span className="text-slate-400 font-mono">Sun below horizon</span>
          )}
        </div>
      </div>
    </div>
  );
};
