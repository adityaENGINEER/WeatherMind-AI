import React, { useState } from 'react';
import {
  ProcessedWeatherData,
  DailyOutfitPlan,
  OutfitStyle,
  OutfitPreferences,
  TemperatureUnit,
} from '../types/weather';
import { formatTemp } from '../utils/weatherUtils';
import {
  Shirt,
  Sparkles,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Umbrella,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Palette,
  Sliders,
  ChevronRight,
  Info,
  Flame,
  Snowflake,
  Glasses,
  Footprints,
  Briefcase,
  GraduationCap,
  Activity,
  Smile,
  Crown,
} from 'lucide-react';

interface AIOutfitPlannerProps {
  weather: ProcessedWeatherData;
  outfitPlan: DailyOutfitPlan;
  preferences: OutfitPreferences;
  onUpdatePreferences: (updated: OutfitPreferences) => void;
  tempUnit: TemperatureUnit;
}

const STYLE_OPTIONS: Array<{
  id: OutfitStyle;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}> = [
  { id: 'casual', label: 'Casual Wear', icon: Smile, desc: 'Comfortable, versatile daily attire' },
  { id: 'college', label: 'College / Campus', icon: GraduationCap, desc: 'Trendy, relaxed, student-ready fits' },
  { id: 'formal', label: 'Formal / Office', icon: Briefcase, desc: 'Executive, sharp business ensembles' },
  { id: 'sportswear', label: 'Sportswear / Gym', icon: Activity, desc: 'Breathable, dynamic athletic gear' },
  { id: 'traditional', label: 'Traditional / Ethnic', icon: Crown, desc: 'Graceful kurtas, shawls & ethnic wear' },
];

const PALETTE_OPTIONS: Array<{
  id: OutfitPreferences['preferredPalette'];
  label: string;
  sampleColors: string[];
}> = [
  { id: 'neutral', label: 'Neutral Tones', sampleColors: ['#F8FAFC', '#94A3B8', '#1E293B'] },
  { id: 'earthy', label: 'Earthy Tones', sampleColors: ['#78716C', '#84CC16', '#B45309'] },
  { id: 'dark', label: 'Dark Shades', sampleColors: ['#0F172A', '#1E1B4B', '#022C22'] },
  { id: 'vibrant', label: 'Vibrant Accents', sampleColors: ['#0284C7', '#F59E0B', '#EF4444'] },
];

export const AIOutfitPlanner: React.FC<AIOutfitPlannerProps> = ({
  weather,
  outfitPlan,
  preferences,
  onUpdatePreferences,
  tempUnit,
}) => {
  const [activeSlot, setActiveSlot] = useState<'now' | 'morning' | 'afternoon' | 'evening'>('now');
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);

  const selectedOutfit =
    activeSlot === 'now'
      ? outfitPlan.currentOutfit
      : activeSlot === 'morning'
      ? outfitPlan.morningOutfit
      : activeSlot === 'afternoon'
      ? outfitPlan.afternoonOutfit
      : outfitPlan.eveningOutfit;

  const currentStyleMeta = STYLE_OPTIONS.find(s => s.id === preferences.style) || STYLE_OPTIONS[0];

  return (
    <section id="ai-outfit-planner" className="py-12 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10 relative">
      {/* Header and Style Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Shirt className="w-4 h-4 text-cyan-400" />
            <span>AI Wardrobe Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
            Weather-Driven Outfit Advisor & Daily Planner
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time biometric comfort recommendations based on thermal indices, wind dynamics, and rain envelopes in{' '}
            <span className="text-slate-200 font-semibold">{weather.location.name}</span>.
          </p>
        </div>

        {/* Style & Color Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {STYLE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = preferences.style === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onUpdatePreferences({ ...preferences, style: opt.id })}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                title={opt.desc}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Diurnal Weather Shift Notice (if temperature or precipitation swings drastically) */}
      {outfitPlan.shiftAlert && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs sm:text-sm text-amber-200 backdrop-blur-xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CloudRain className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{outfitPlan.shiftAlert}</span>
          </div>
          <span className="text-[11px] font-mono text-amber-300/80 uppercase hidden sm:inline">
            Diurnal Forecast Telemetry
          </span>
        </div>
      )}

      {/* Daily Time-Slot Navigation Tabs (Now / Morning / Afternoon / Evening) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { id: 'now', label: 'Current Window', sub: 'Real-Time Telemetry', outfit: outfitPlan.currentOutfit },
          { id: 'morning', label: 'Morning Transit', sub: '07:00 – 11:30', outfit: outfitPlan.morningOutfit },
          { id: 'afternoon', label: 'Midday Peak', sub: '12:00 – 17:00', outfit: outfitPlan.afternoonOutfit },
          { id: 'evening', label: 'Evening / Night', sub: '17:30 – 22:30', outfit: outfitPlan.eveningOutfit },
        ].map(slot => {
          const isSelected = activeSlot === slot.id;
          return (
            <button
              key={slot.id}
              onClick={() => setActiveSlot(slot.id as any)}
              className={`p-4 rounded-3xl border transition-all text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-slate-900/90 via-cyan-950/20 to-slate-900/90 border-cyan-500/50 shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                  : 'glass-panel border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">{slot.label}</span>
                <span className="font-mono text-cyan-300">{formatTemp(slot.outfit.temperature, tempUnit)}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mb-2">{slot.sub}</div>
              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-white/5">
                <span className="truncate">{slot.outfit.conditionLabel}</span>
                {slot.outfit.rainProbability > 0 && (
                  <span className="text-cyan-400 font-mono">{slot.outfit.rainProbability}% Rain</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Feature Outfit Showcase Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Primary Outfit Card & Garment Composition */}
        <div className="lg:col-span-8 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/90 flex flex-col justify-between">
          <div>
            {/* Top Badge Strip: Slot, Style, & Comfort Score */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {selectedOutfit.periodLabel}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {currentStyleMeta.label}
                </span>
              </div>

              {/* Comfort Rating Pill */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">Comfort Score:</span>
                <span className="font-bold text-emerald-400">{selectedOutfit.comfortScore}/100</span>
                <span className="text-slate-500">({selectedOutfit.comfortRating})</span>
              </div>
            </div>

            {/* Title & Microclimate Reading */}
            <div className="mb-6">
              <h3 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mb-1">
                {selectedOutfit.combinationTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                {selectedOutfit.whyItWorks}
              </p>
            </div>

            {/* Clothing Pieces Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Topwear */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                    Recommended Topwear
                  </span>
                  <ul className="mt-1 space-y-1 text-sm text-slate-100 font-medium">
                    {selectedOutfit.topWear.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottomwear */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                    Recommended Bottomwear
                  </span>
                  <ul className="mt-1 space-y-1 text-sm text-slate-100 font-medium">
                    {selectedOutfit.bottomWear.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Outerwear & Weather Layers */}
              {selectedOutfit.outerwear && (
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 shrink-0">
                    {selectedOutfit.coldShieldRequired ? (
                      <Snowflake className="w-5 h-5" />
                    ) : selectedOutfit.rainShieldRequired ? (
                      <CloudRain className="w-5 h-5" />
                    ) : (
                      <Wind className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                      Outerwear & Weather Layers
                    </span>
                    <ul className="mt-1 space-y-1 text-sm text-slate-100 font-medium">
                      {selectedOutfit.outerwear.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Footwear */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                    Recommended Footwear
                  </span>
                  <ul className="mt-1 space-y-1 text-sm text-slate-100 font-medium">
                    {selectedOutfit.footwear.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Fabric & Color Guidance Strip */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Optimal Textiles:</span>
              <span className="text-cyan-300">{selectedOutfit.fabricRecommendation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-300">Suggested Palette:</span>
              <span>{selectedOutfit.colorPaletteAdvice.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Weather Rationale & Accessories Check */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          {/* Weather Conditions Snapshot for this Slot */}
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="uppercase">Slot Telemetry Snapshot</span>
              <span className="text-cyan-400">{selectedOutfit.conditionLabel}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Temperature</span>
                <span className="text-xl font-bold text-white font-['Outfit']">
                  {formatTemp(selectedOutfit.temperature, tempUnit)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Feels {formatTemp(selectedOutfit.apparentTemperature, tempUnit)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Precipitation</span>
                <span className="text-xl font-bold text-cyan-300 font-['Outfit']">
                  {selectedOutfit.rainProbability}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {selectedOutfit.rainProbability >= 40 ? 'Rain Likely' : 'Dry Window'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Wind Velocity</span>
                <span className="text-xl font-bold text-emerald-300 font-['Outfit']">
                  {selectedOutfit.windSpeed}
                </span>
                <span className="text-[10px] text-slate-500 block">km/h velocity</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Solar UV Index</span>
                <span className="text-xl font-bold text-amber-300 font-['Outfit']">
                  {selectedOutfit.uvIndex}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {selectedOutfit.uvIndex >= 6 ? 'High UV' : 'Moderate UV'}
                </span>
              </div>
            </div>
          </div>

          {/* Essential Weather Accessories Card */}
          <div className="glass-panel p-5 rounded-3xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Umbrella className="w-4 h-4 text-cyan-400" />
                <span>Essential Weather Accessories</span>
              </div>
              <h4 className="text-base font-bold text-white font-['Outfit'] mb-3">
                Smart Daypack & Gear Checklist
              </h4>

              {selectedOutfit.accessories.length > 0 ? (
                <ul className="space-y-2 text-xs text-slate-200">
                  {selectedOutfit.accessories.map((acc, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{acc}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">
                  No special gear required. Normal daily carry is optimal for current conditions.
                </p>
              )}
            </div>

            {/* Color Palette Preference Switcher */}
            <div className="pt-4 mt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-2">
                Preferred Color Palette:
              </span>
              <div className="flex items-center gap-2">
                {PALETTE_OPTIONS.map(p => {
                  const isCur = preferences.preferredPalette === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onUpdatePreferences({ ...preferences, preferredPalette: p.id })}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                        isCur
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.sampleColors[0] }}
                      />
                      <span>{p.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
