import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  X,
  Loader2,
  History,
  Star,
  Compass,
  GraduationCap,
  Landmark,
  Building2,
  Plane,
  AlertCircle,
  ShoppingBag,
  Utensils,
  Hotel,
  Hospital,
  Train,
  TreePine,
  Church,
} from 'lucide-react';
import { GeocodingResult, WeatherCoordinates } from '../types/weather';
import { searchLocations } from '../services/weatherService';

interface CitySearchProps {
  onSelectCity: (coords: WeatherCoordinates) => void;
  recentSearches: WeatherCoordinates[];
  favoriteCities: WeatherCoordinates[];
  currentLocationName?: string;
  onRequestCurrentLocation: () => void;
  isLoadingLocation?: boolean;
  onResetToDefault?: () => void;
}

// Category icon helper matching Google Maps POI styles
const getCategoryIcon = (category?: string) => {
  if (!category) return <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />;
  const cat = category.toLowerCase();
  if (cat.includes('university') || cat.includes('college') || cat.includes('school')) {
    return <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />;
  }
  if (cat.includes('landmark') || cat.includes('monument') || cat.includes('attraction')) {
    return <Landmark className="w-4 h-4 text-amber-400 shrink-0" />;
  }
  if (cat.includes('mall') || cat.includes('shopping') || cat.includes('shop')) {
    return <ShoppingBag className="w-4 h-4 text-pink-400 shrink-0" />;
  }
  if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('food')) {
    return <Utensils className="w-4 h-4 text-orange-400 shrink-0" />;
  }
  if (cat.includes('hotel') || cat.includes('lodging')) {
    return <Hotel className="w-4 h-4 text-blue-400 shrink-0" />;
  }
  if (cat.includes('hospital') || cat.includes('health')) {
    return <Hospital className="w-4 h-4 text-red-400 shrink-0" />;
  }
  if (cat.includes('temple') || cat.includes('worship') || cat.includes('church') || cat.includes('mosque')) {
    return <Church className="w-4 h-4 text-yellow-400 shrink-0" />;
  }
  if (cat.includes('airport') || cat.includes('terminal')) {
    return <Plane className="w-4 h-4 text-sky-400 shrink-0" />;
  }
  if (cat.includes('transit') || cat.includes('station') || cat.includes('train') || cat.includes('metro')) {
    return <Train className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (cat.includes('park') || cat.includes('stadium')) {
    return <TreePine className="w-4 h-4 text-green-400 shrink-0" />;
  }
  if (cat.includes('locality') || cat.includes('sector') || cat.includes('suburb')) {
    return <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  return <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />;
};

export const CitySearch: React.FC<CitySearchProps> = ({
  onSelectCity,
  recentSearches,
  favoriteCities,
  onRequestCurrentLocation,
  isLoadingLocation = false,
  onResetToDefault,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced real-world autocomplete search with request cancellation
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    // Cancel previous in-flight request to avoid race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const data = await searchLocations(trimmed, controller.signal);
        setResults(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
          setSearchError('Search service temporarily unavailable. Please retry.');
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: GeocodingResult | WeatherCoordinates) => {
    onSelectCity({
      name: item.name,
      country: item.country,
      admin1: item.admin1,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
      displayName: (item as any).displayName,
      locality: (item as any).locality,
      category: (item as any).category,
      precision: (item as any).precision || 'exact',
    });
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto z-40">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-cyan-400 pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
        <input
          id="city-search-input"
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search colleges, landmarks, sectors, or any city (e.g. IIT Delhi, Taj Mahal, Sector 62)..."
          className="w-full pl-12 pr-44 py-3.5 bg-slate-900/80 border border-slate-700/70 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/90 focus:ring-2 focus:ring-cyan-500/25 backdrop-blur-2xl transition-all shadow-xl text-sm sm:text-base"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/60"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}

          {/* Prominent 'Use My Location' Button */}
          <button
            onClick={onRequestCurrentLocation}
            disabled={isLoadingLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 hover:border-cyan-400/60 text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Detect and use your live GPS coordinates"
            aria-label="Use My Live Location"
          >
            {isLoadingLocation ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            )}
            <span className="hidden sm:inline">Use My Location</span>
            <span className="sm:hidden">GPS</span>
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#0C1222]/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl max-h-[420px] overflow-y-auto animate-in fade-in duration-150 z-50">
          {/* Loading status */}
          {isSearching && (
            <div className="flex items-center justify-center py-6 text-slate-400 text-sm gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Scanning global colleges, landmarks & localities...</span>
            </div>
          )}

          {/* Error Notice */}
          {searchError && (
            <div className="flex items-center gap-2 py-4 px-3 text-amber-300 text-xs bg-amber-950/30 rounded-xl border border-amber-500/30">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Empty result message */}
          {!isSearching && !searchError && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-6 text-center text-slate-400 text-sm">
              No matching colleges, landmarks, or cities found for "{query}". Try checking spelling or adding a city name.
            </div>
          )}

          {/* Rich Autocomplete Results */}
          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
                <span>Matching Places & Institutions</span>
                <span className="text-[10px] text-slate-500 lowercase font-mono">Use ↑ ↓ & Enter</span>
              </div>
              {results.map((item, idx) => (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between text-sm transition-all group ${
                    selectedIndex === idx
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                      : 'hover:bg-slate-800/70 text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <div className="mt-0.5">{getCategoryIcon(item.category)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {item.name}
                        </span>
                        {item.category && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/90 text-slate-300 border border-slate-700/60">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.locality || [item.admin1, item.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 block">
                      {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                    </span>
                    <span className="text-[9px] uppercase font-semibold text-cyan-400 tracking-wider">
                      Exact Pin
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick presets when input is empty */}
          {!query && (
            <div className="p-1 space-y-3">
              {/* Default City Shortcut: New Delhi */}
              {onResetToDefault && (
                <button
                  onClick={() => {
                    onResetToDefault();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-xs text-cyan-300 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold">Switch to Default City (New Delhi, India)</span>
                  </div>
                  <span className="text-[10px] text-cyan-400/80 font-mono">Default</span>
                </button>
              )}

              {/* Pinned Favorite Cities */}
              {favoriteCities.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wider text-amber-400/90 uppercase">
                    <Star className="w-3 h-3" />
                    <span>Pinned Stations</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {favoriteCities.map(city => (
                      <button
                        key={`${city.name}-${city.latitude}`}
                        onClick={() => handleSelect(city)}
                        className="text-left px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-xs text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="font-medium truncate">{city.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">{city.country}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    <History className="w-3 h-3" />
                    <span>Recent Places</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {recentSearches.map(city => (
                      <button
                        key={`${city.name}-${city.latitude}`}
                        onClick={() => handleSelect(city)}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800/50 text-xs text-slate-300 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {getCategoryIcon(city.category)}
                          <span className="truncate">{city.name}</span>
                          {city.locality && (
                            <span className="text-[10px] text-slate-500 truncate">({city.locality})</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">Jump</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
