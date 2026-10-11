import React from 'react';
import { WeatherAlertItem } from '../types/weather';
import { AlertTriangle, ShieldCheck, ExternalLink, Calendar, BellRing } from 'lucide-react';

interface WeatherAlertsSectionProps {
  alerts: WeatherAlertItem[];
  sourceName: string;
  isFeedSupported: boolean;
}

export const WeatherAlertsSection: React.FC<WeatherAlertsSectionProps> = ({
  alerts,
  sourceName,
  isFeedSupported,
}) => {
  return (
    <section id="weather-alerts" className="py-6 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <BellRing className="w-4 h-4 text-amber-400" />
            <span>Meteorological Alerts Feed</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hazard Advisories & Warnings
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Feed: <span className="text-slate-300">{sourceName}</span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-panel p-6 rounded-3xl flex items-center gap-4 border border-emerald-500/20 bg-emerald-950/10">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-['Outfit']">
              No Severe Weather Advisories in Effect
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Atmospheric parameters for this coordinate sector reside within standard nominal boundaries. No severe convection, gale forces, or extreme thermal thresholds detected.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const severityColor =
              alert.severity === 'extreme'
                ? 'border-red-500/50 bg-red-950/20 text-red-300'
                : alert.severity === 'severe'
                ? 'border-orange-500/50 bg-orange-950/20 text-orange-300'
                : 'border-amber-500/40 bg-amber-950/20 text-amber-300';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-3xl border ${severityColor} backdrop-blur-xl shadow-lg`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-white text-base sm:text-lg font-['Outfit']">
                      {alert.event}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/40 border border-white/10 self-start sm:self-auto">
                    {alert.severity} SEVERITY
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3">
                  {alert.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Issued by: {alert.senderName}</span>
                  </div>
                  {alert.end && (
                    <span className="font-mono text-[11px]">
                      Expires: {new Date(alert.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
