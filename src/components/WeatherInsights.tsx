import React from 'react';
import { AIInsightItem } from '../types/weather';
import {
  Lightbulb,
  CloudRain,
  Sun,
  Wind,
  Shirt,
  ThermometerSnowflake,
  ThermometerSun,
  EyeOff,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface WeatherInsightsProps {
  insights: AIInsightItem[];
}

const getInsightIcon = (name: string) => {
  switch (name) {
    case 'CloudRain':
      return <CloudRain className="w-5 h-5 text-cyan-400" />;
    case 'Sun':
      return <Sun className="w-5 h-5 text-amber-400" />;
    case 'Wind':
      return <Wind className="w-5 h-5 text-emerald-400" />;
    case 'Shirt':
      return <Shirt className="w-5 h-5 text-blue-400" />;
    case 'ThermometerSnowflake':
      return <ThermometerSnowflake className="w-5 h-5 text-sky-400" />;
    case 'ThermometerSun':
      return <ThermometerSun className="w-5 h-5 text-orange-400" />;
    case 'EyeOff':
      return <EyeOff className="w-5 h-5 text-zinc-400" />;
    default:
      return <Lightbulb className="w-5 h-5 text-purple-400" />;
  }
};

export const WeatherInsights: React.FC<WeatherInsightsProps> = ({ insights }) => {
  return (
    <div className="w-full relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
            <span>Deterministic Heuristics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Smart Weather Insights & Lifestyle Directives
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Derived from current telemetry and 24h probability envelopes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map(item => {
          const toneBorder =
            item.tone === 'warning'
              ? 'border-amber-500/40 bg-amber-950/10'
              : item.tone === 'caution'
              ? 'border-cyan-500/30 bg-cyan-950/10'
              : 'border-slate-800/80 glass-panel';

          return (
            <div
              key={item.id}
              className={`p-5 rounded-3xl flex flex-col justify-between transition-all hover:-translate-y-1 ${toneBorder}`}
            >
              <div>
                {/* Header with icon and badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                    {getInsightIcon(item.iconName)}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-slate-800 text-slate-300">
                    {item.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white mb-2 font-['Outfit']">
                  {item.title}
                </h3>

                {/* Message */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  {item.message}
                </p>
              </div>

              {/* Supporting Data Audit Trail */}
              <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{item.supportingData}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
