import React, { useState } from 'react';
import {
  AIPredictionSuite,
  TemperatureUnit,
  TimeFormat,
} from '../types/weather';
import { formatHour, formatTemp } from '../utils/weatherUtils';
import {
  Sparkles,
  CloudRain,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Compass,
  TrendingUp,
  Droplets,
  Wind,
  ThermometerSun,
  ThermometerSnowflake,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  BellRing,
  BellOff,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AIPredictionDashboardProps {
  suite: AIPredictionSuite;
  tempUnit: TemperatureUnit;
  timeFormat: TimeFormat;
  notificationsEnabled: boolean;
  onRequestNotifications: () => void;
  onDisableNotifications: () => void;
  notificationPermission: NotificationPermission;
}

export const AIPredictionDashboard: React.FC<AIPredictionDashboardProps> = ({
  suite,
  tempUnit,
  timeFormat,
  notificationsEnabled,
  onRequestNotifications,
  onDisableNotifications,
  notificationPermission,
}) => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'rain' | 'warnings' | 'trends'>('all');

  const { smartRain, predictions, officialWarnings, atmosAdvisories, location } = suite;

  const toggleExpand = (id: string) => {
    setExpandedCardId(prev => (prev === id ? null : id));
  };

  // Format hourly rain chart data
  const rainChartData = smartRain.hourlyRainProfile.slice(0, 18).map(item => ({
    time: formatHour(item.time, timeFormat),
    probability: item.probability,
    amount: item.amountMm,
    condition: item.condition,
  }));

  const totalWarningsCount = officialWarnings.length + atmosAdvisories.length;

  return (
    <section id="ai-prediction-dashboard" className="py-12 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10 relative">
      {/* Header with Title and Notification Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Autonomous Intelligence Suite</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            AI Weather Prediction & Hazard Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-horizon analysis, smart rain trajectory, and transparent safety thresholds for{' '}
            <span className="text-slate-200 font-semibold">{location.name}</span>.
          </p>
        </div>

        {/* Browser Notification Controls & Source Meta */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {notificationPermission === 'granted' && notificationsEnabled ? (
            <button
              onClick={onDisableNotifications}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all text-xs font-semibold flex items-center gap-2 shadow-sm"
              title="Browser notifications active. Click to mute alerts."
            >
              <BellRing className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart Alerts Active</span>
            </button>
          ) : (
            <button
              onClick={onRequestNotifications}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs font-medium flex items-center gap-2"
              title="Enable instant desktop/mobile browser alerts before severe weather or rain"
            >
              <BellOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Enable Browser Alerts</span>
            </button>
          )}

          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Sync: {new Date(suite.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Smart Rain Outlook */}
        <div
          className={`glass-panel p-5 rounded-3xl border transition-all ${
            smartRain.isRainExpected
              ? 'border-cyan-500/40 bg-cyan-950/20'
              : 'border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">Smart Rain Intel</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Outfit'] mb-1">
            {smartRain.isRainExpected ? `${smartRain.peakProbability}% Peak Chance` : 'Zero Rain Risk'}
          </div>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {smartRain.timeWindowLabel}
          </p>
          {smartRain.isRainExpected && (
            <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-mono text-cyan-300">
              <span>Expected: ~{smartRain.expectedPrecipitationMm}mm</span>
              <span className="uppercase">{smartRain.intensityCategory} intensity</span>
            </div>
          )}
        </div>

        {/* Card 2: Official Warnings Status */}
        <div
          className={`glass-panel p-5 rounded-3xl border transition-all ${
            officialWarnings.length > 0
              ? 'border-red-500/50 bg-red-950/25'
              : 'border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-400">Official Warning Feeds</span>
            {officialWarnings.length > 0 ? (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Outfit'] mb-1">
            {officialWarnings.length > 0 ? `${officialWarnings.length} Active Official` : 'None in Effect'}
          </div>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {officialWarnings.length > 0
              ? officialWarnings[0].event
              : 'Official civil meteorological agencies report nominal conditions.'}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            Source: NOAA / National Weather Service
          </div>
        </div>

        {/* Card 3: ATMOS Autonomous Advisories */}
        <div
          className={`glass-panel p-5 rounded-3xl border transition-all ${
            atmosAdvisories.length > 0
              ? 'border-amber-500/40 bg-amber-950/20'
              : 'border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400">ATMOS Advisories</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Outfit'] mb-1">
            {atmosAdvisories.length > 0 ? `${atmosAdvisories.length} Scientific Advisories` : 'Nominal Thresholds'}
          </div>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {atmosAdvisories.length > 0
              ? atmosAdvisories[0].event
              : 'Parameters reside within normal WMO physiological safety limits.'}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            Basis: WMO Extreme Meteorological Criteria
          </div>
        </div>

        {/* Card 4: Scientific Horizon & Data Integrity */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-purple-400">Forecast Horizon</span>
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Outfit'] mb-1">
            48-Hour Precision
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Unbiased numerical integration. Zero fabricated probabilities or synthetic alarms.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>ECMWF / Open-Meteo Ground Truth</span>
          </div>
        </div>
      </div>

      {/* Smart Rain Feature Highlight Block */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl mb-8 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900/60 to-blue-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <CloudRain className="w-5 h-5" />
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
                Smart Rain Trajectory & Hourly Probability Engine
              </h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              {smartRain.summary}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {smartRain.precautions.map((prec, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-300 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {prec}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Hourly Rain Bar Visualizer */}
          <div className="w-full lg:w-96 h-36 bg-slate-900/80 p-3 rounded-2xl border border-slate-800/90">
            <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Hourly Rain Probability (%)</span>
              <span>Next 18 Hours</span>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rainChartData} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={9} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(13, 19, 33, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val}% (${item.payload.amount}mm)`,
                      'Precipitation Chance',
                    ]}
                  />
                  <Bar dataKey="probability" fill="#06B6D4" radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Official Warnings & ATMOS Advisories Dual Feeds */}
      {totalWarningsCount > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Active Hazard Warnings & Transparent Advisories</span>
            </h3>
            <span className="text-xs text-slate-400">
              Clear distinction between government feeds and scientific calculations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Official Civil Warnings */}
            {officialWarnings.map(alert => (
              <div
                key={alert.id}
                className="p-5 rounded-3xl border border-red-500/50 bg-red-950/20 backdrop-blur-xl shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
                      Official Government Warning
                    </span>
                    <span className="text-[11px] font-mono text-red-300 uppercase">
                      {alert.severity} SEVERITY
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-['Outfit'] mb-1.5">
                    {alert.event}
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed mb-3">
                    {alert.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-red-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-red-300/80 font-mono">
                  <span>Authority: {alert.senderName}</span>
                  {alert.end && <span>Expires: {new Date(alert.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
              </div>
            ))}

            {/* ATMOS Generated Advisories */}
            {atmosAdvisories.map(alert => (
              <div
                key={alert.id}
                className="p-5 rounded-3xl border border-amber-500/40 bg-amber-950/20 backdrop-blur-xl shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ATMOS Autonomous Advisory
                    </span>
                    <span className="text-[11px] font-mono text-amber-300 uppercase">
                      {alert.severity} THRESHOLD
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-['Outfit'] mb-1.5">
                    {alert.event}
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed mb-3">
                    {alert.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-300/80 font-mono">
                  <span>Calculated via: {alert.source}</span>
                  <span>Non-official advisory</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Weather Predictions Section (Extreme Heat, Cold Waves, Gale Winds, Thunderstorms, Heavy Rain) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>AI Multi-Hazard Meteorological Predictions</span>
          </h3>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click cards to review scientific reasoning, impacts & safety directives
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map(item => {
            const isExpanded = expandedCardId === item.id;
            const borderStyle =
              item.severity === 'severe'
                ? 'border-red-500/40 bg-red-950/15 hover:border-red-500/60'
                : item.severity === 'warning'
                ? 'border-amber-500/40 bg-amber-950/15 hover:border-amber-500/60'
                : item.severity === 'advisory'
                ? 'border-cyan-500/40 bg-cyan-950/15 hover:border-cyan-500/60'
                : 'border-slate-800/80 glass-panel hover:border-slate-700';

            const severityBadgeColor =
              item.severity === 'severe'
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : item.severity === 'warning'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : item.severity === 'advisory'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

            return (
              <div
                key={item.id}
                onClick={() => toggleExpand(item.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${borderStyle}`}
              >
                <div>
                  {/* Top Category Badge & Severity */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${severityBadgeColor}`}>
                      {item.severity} • {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-300">
                      {item.metricValue}
                    </span>
                  </div>

                  {/* Title & Timeframe */}
                  <h4 className="text-base font-bold text-white font-['Outfit'] mb-1">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.timeframe}</span>
                  </div>

                  {/* Status summary */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3">
                    {item.statusSummary}
                  </p>

                  {/* Expanded scientific explanation & precautions */}
                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-white/10 animate-in fade-in duration-200 text-xs">
                      {/* Why it was generated */}
                      <div>
                        <span className="text-[11px] uppercase font-bold text-cyan-400 tracking-wider">
                          Scientific Rationale
                        </span>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">
                          {item.scientificReasoning}
                        </p>
                      </div>

                      {/* Potential Impact */}
                      <div>
                        <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                          Potential Impact
                        </span>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">
                          {item.potentialImpact}
                        </p>
                      </div>

                      {/* Actionable Precautions */}
                      <div>
                        <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
                          Actionable Precautions
                        </span>
                        <ul className="mt-1 space-y-1 text-slate-300">
                          {item.precautions.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Uncertainty and Limitations */}
                      {item.forecastLimitationNote && (
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-mono">
                          <span className="text-slate-300 font-semibold">Forecast Limitation Note: </span>
                          {item.forecastLimitationNote}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Expansion toggle cue */}
                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <span>Confidence: {item.dataConfidence.toUpperCase()}</span>
                  </span>
                  <div className="flex items-center gap-1 text-cyan-400 font-medium hover:text-cyan-300">
                    <span>{isExpanded ? 'Show Less' : 'Full Analysis & Rationale'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uncertainty & Transparency Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-300">Meteorological Integrity Commitment: </span>
          {suite.modelAccuracyNote} Predictions are synthesized from deterministic physical simulations and calibrated telemetry grids. Always follow formal emergency declarations broadcast by localized civil authorities.
        </div>
      </div>
    </section>
  );
};
