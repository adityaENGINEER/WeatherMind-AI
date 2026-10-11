import React from 'react';
import {
  ProcessedWeatherData,
  TemperatureUnit,
  WindSpeedUnit,
  TimeFormat,
  WeatherCoordinates,
} from '../types/weather';
import {
  formatTemp,
  formatWind,
  getWeatherCondition,
  getWindCompass,
} from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';
import { CitySearch } from './CitySearch';
import {
  ArrowDown,
  Droplets,
  Wind,
  Gauge,
  Eye,
  Sun,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';

interface WeatherHeroProps {
  weather: ProcessedWeatherData;
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
  timeFormat: TimeFormat;
  onSelectCity: (coords: WeatherCoordinates) => void;
  recentSearches: WeatherCoordinates[];
  favoriteCities: WeatherCoordinates[];
  onRequestCurrentLocation: () => void;
  isLoadingLocation?: boolean;
  onExploreClick: () => void;
  onResetToDefault?: () => void;
}

export const WeatherHero: React.FC<WeatherHeroProps> = ({
  weather,
  tempUnit,
  windUnit,
  onSelectCity,
  recentSearches,
  favoriteCities,
  onRequestCurrentLocation,
  isLoadingLocation,
  onExploreClick,
  onResetToDefault,
}) => {
  const current = weather.current;
  const condition = getWeatherCondition(current.weatherCode, current.isDay);
  const location = weather.location;
  const today = weather.daily[0];

  // Local time formatted for location's timezone
  const localTimeString = new Intl.DateTimeFormat('en-US', {
    timeZone: weather.timezone || 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  return (
    <section className="relative min-h-[85vh] flex flex-col justify-between pt-6 pb-12 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10">
      {/* Top Search bar wrapper */}
      <div className="w-full mb-8">
        <CitySearch
          onSelectCity={onSelectCity}
          recentSearches={recentSearches}
          favoriteCities={favoriteCities}
          onRequestCurrentLocation={onRequestCurrentLocation}
          isLoadingLocation={isLoadingLocation}
          onResetToDefault={onResetToDefault}
        />
      </div>

      {/* Main Atmospheric Hero Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 2xl:grid-cols-12 gap-8 lg:gap-12 items-center my-auto w-full">
        {/* Left: Location & Primary Temperature Card */}
        <div className="lg:col-span-7 2xl:col-span-7 flex flex-col items-start space-y-5">
          {/* Tag & Local Timestamp */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              LIVE TELEMETRY
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{localTimeString}</span>
              <span className="text-slate-600">({weather.timezoneAbbreviation || weather.timezone})</span>
            </div>
          </div>

          {/* Location Title & Detailed Geographic Hierarchy */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-['Outfit']">
                {location.name}
              </h1>
              {location.category && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {location.category}
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg text-slate-300 font-normal">
              {location.locality || [location.admin1, location.country].filter(Boolean).join(', ')}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
              <span>Coordinates: {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°</span>
              {location.precision && (
                <span className="text-cyan-400 font-medium">({location.precision.toUpperCase()} PIN)</span>
              )}
            </div>
          </div>

          {/* Temperature & Weather Condition */}
          <div className="flex flex-wrap items-baseline gap-6 sm:gap-8 pt-2">
            <div className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-400 font-['Outfit'] select-none">
              {formatTemp(current.temperature, tempUnit)}
            </div>

            <div className="flex flex-col justify-center space-y-1">
              <div className="flex items-center gap-2">
                <WeatherIcon
                  name={condition.icon}
                  className="w-8 h-8"
                  color={condition.accentColor}
                />
                <span className="text-2xl sm:text-3xl font-bold text-slate-100 font-['Outfit']">
                  {condition.label}
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Feels like{' '}
                <span className="text-slate-200 font-semibold">
                  {formatTemp(current.apparentTemperature, tempUnit)}
                </span>
                {today && (
                  <span className="ml-2 text-slate-500">
                    • H: {formatTemp(today.temperatureMax, tempUnit)} L:{' '}
                    {formatTemp(today.temperatureMin, tempUnit)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Scientific condition description */}
          <p className="max-w-xl text-slate-300/90 text-sm sm:text-base leading-relaxed border-l-2 border-cyan-500/50 pl-4 py-0.5">
            {condition.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onExploreClick}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>Explore Forecast Radar</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('ai-assistant');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-3.5 rounded-2xl glass-pill hover:bg-white/10 text-slate-200 font-medium text-sm transition-all flex items-center gap-2 border border-slate-700/60"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Ask AI Intel</span>
            </button>
          </div>
        </div>

        {/* Right: Atmospheric Glass Telemetry Deck */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 w-full">
          {/* Humidity Card */}
          <div className="glass-panel-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium tracking-wide uppercase">Humidity</span>
              <Droplets className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-white font-['Outfit']">
                {current.relativeHumidity}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate">
              {current.relativeHumidity > 70 ? 'High moisture saturation' : 'Comfortable dew level'}
            </span>
          </div>

          {/* Wind Dynamics Card */}
          <div className="glass-panel-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium tracking-wide uppercase">Wind Velocity</span>
              <Wind className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-white font-['Outfit']">
                {formatWind(current.windSpeed, windUnit)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate">
              {getWindCompass(current.windDirection)} ({current.windDirection}°) vector
            </span>
          </div>

          {/* UV Index Card */}
          <div className="glass-panel-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium tracking-wide uppercase">UV Index</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-['Outfit']">
                {current.uvIndex.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-amber-400">
                {current.uvIndex < 3 ? 'Low' : current.uvIndex < 6 ? 'Moderate' : 'High'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate">
              {current.uvIndex >= 6 ? 'SPF & shade required' : 'Standard solar exposure'}
            </span>
          </div>

          {/* Barometric Pressure Card */}
          <div className="glass-panel-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium tracking-wide uppercase">Pressure</span>
              <Gauge className="w-4 h-4 text-purple-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-white font-['Outfit']">
                {Math.round(current.surfacePressure)}
              </span>
              <span className="text-xs text-slate-400 ml-1 font-mono">hPa</span>
            </div>
            <span className="text-[11px] text-slate-400 truncate">
              {current.surfacePressure > 1013 ? 'High pressure system' : 'Low pressure depression'}
            </span>
          </div>

          {/* Visibility Span (Full row) */}
          <div className="col-span-2 glass-panel-interactive p-4 sm:p-5 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-medium">Optical Visibility</span>
                <p className="text-lg font-bold text-white font-['Outfit']">
                  {current.visibility.toFixed(1)} km
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-medium">Cloud Canopy</span>
              <p className="text-lg font-bold text-cyan-300 font-['Outfit']">
                {current.cloudCover}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Scroll Cue */}
      <div className="w-full flex justify-center pt-8">
        <button
          onClick={onExploreClick}
          className="text-slate-500 hover:text-cyan-400 text-xs flex flex-col items-center gap-1 transition-colors group cursor-pointer"
        >
          <span className="tracking-widest uppercase text-[10px] font-semibold">
            Chronological Timeline
          </span>
          <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};
