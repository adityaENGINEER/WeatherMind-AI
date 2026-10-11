import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ProcessedWeatherData, TemperatureUnit } from '../types/weather';
import { formatHour, formatTempRaw } from '../utils/weatherUtils';
import { BarChart2, TrendingUp, Droplets, Wind } from 'lucide-react';

interface WeatherAnalyticsProps {
  weather: ProcessedWeatherData;
  tempUnit: TemperatureUnit;
}

export const WeatherAnalytics: React.FC<WeatherAnalyticsProps> = ({
  weather,
  tempUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'temperature' | 'precipitation' | 'wind' | 'humidity'>('temperature');

  // Format 24 hour slice for charts
  const chartData = weather.hourly.slice(0, 24).map(item => {
    return {
      time: formatHour(item.time, '12h'),
      temp: formatTempRaw(item.temperature, tempUnit),
      feelsLike: formatTempRaw(item.apparentTemperature, tempUnit),
      humidity: item.relativeHumidity,
      pop: item.precipitationProbability,
      precip: item.precipitation,
      wind: Math.round(item.windSpeed),
    };
  });

  return (
    <section id="weather-analytics" className="py-12 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Atmospheric Telemetry Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            24-Hour Microclimate Analytics
          </h2>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('temperature')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'temperature'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </button>

          <button
            onClick={() => setActiveTab('precipitation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'precipitation'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Precipitation %</span>
          </button>

          <button
            onClick={() => setActiveTab('wind')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'wind'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Speed</span>
          </button>

          <button
            onClick={() => setActiveTab('humidity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'humidity'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Humidity %</span>
          </button>
        </div>
      </div>

      {/* Analytics Chart Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="h-72 sm:h-80 w-full">
          {activeTab === 'temperature' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="feelsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="°" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(13, 19, 33, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value}°`,
                    name === 'temp' ? 'Temperature' : 'Feels Like',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tempGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="feelsLike"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#feelsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'precipitation' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(13, 19, 33, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Precipitation Probability']}
                />
                <Bar dataKey="pop" fill="#0EA5E9" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'wind' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="k" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(13, 19, 33, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(val: any) => [`${val} km/h`, 'Wind Speed']}
                />
                <Area
                  type="monotone"
                  dataKey="wind"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#windGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'humidity' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(13, 19, 33, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Relative Humidity']}
                />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke="#A855F7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#humGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend notes */}
        <div className="flex flex-wrap items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Observed Ambient
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Biometeorological Apparent
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Source: Open-Meteo High-Resolution Numerical Model
          </span>
        </div>
      </div>
    </section>
  );
};
