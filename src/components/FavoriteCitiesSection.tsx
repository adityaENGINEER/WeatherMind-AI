import React from 'react';
import { WeatherCoordinates, ProcessedWeatherData, TemperatureUnit } from '../types/weather';
import { formatTemp } from '../utils/weatherUtils';
import { Star, Trash2, ArrowUpRight, Plus, MapPin } from 'lucide-react';

interface FavoriteCitiesSectionProps {
  favorites: WeatherCoordinates[];
  currentLocation: WeatherCoordinates;
  onSelectCity: (city: WeatherCoordinates) => void;
  onRemoveFavorite: (city: WeatherCoordinates) => void;
  tempUnit: TemperatureUnit;
}

export const FavoriteCitiesSection: React.FC<FavoriteCitiesSectionProps> = ({
  favorites,
  currentLocation,
  onSelectCity,
  onRemoveFavorite,
  tempUnit,
}) => {
  return (
    <section className="py-10 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Multi-Location Array</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Saved Atmospheric Stations
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Saved locally in browser storage for instant telemetry switching
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map(city => {
          const isSelected =
            Math.abs(city.latitude - currentLocation.latitude) < 0.01 &&
            Math.abs(city.longitude - currentLocation.longitude) < 0.01;

          return (
            <div
              key={`${city.name}-${city.latitude}`}
              className={`p-5 rounded-3xl flex items-center justify-between transition-all group ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900/90 border-2 border-cyan-400/80 shadow-xl shadow-cyan-950/40'
                  : 'glass-panel-interactive'
              }`}
            >
              <div
                onClick={() => onSelectCity(city)}
                className="flex-1 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-extrabold text-white text-lg font-['Outfit'] group-hover:text-cyan-300 transition-colors">
                    {city.name}
                  </h3>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {[city.admin1, city.country].filter(Boolean).join(', ')}
                </p>
                <div className="text-[11px] font-mono text-slate-500 mt-2">
                  {city.latitude.toFixed(2)}°N, {city.longitude.toFixed(2)}°E
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-3">
                <button
                  onClick={() => onSelectCity(city)}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500 hover:text-white text-slate-300 transition-all"
                  title="Switch to this station"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRemoveFavorite(city);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
