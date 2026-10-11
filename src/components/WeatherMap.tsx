import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { WeatherCoordinates, ProcessedWeatherData, TemperatureUnit } from '../types/weather';
import { formatTemp } from '../utils/weatherUtils';
import { Layers, Maximize2, MapPin, Eye } from 'lucide-react';

interface WeatherMapProps {
  location: WeatherCoordinates;
  weather: ProcessedWeatherData;
  tempUnit: TemperatureUnit;
}

// Custom modern neon map marker icon using Leaflet DivIcon
const createCustomIcon = (temp: string) => {
  return L.divIcon({
    className: 'custom-weather-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; width: 44px; height: 44px; background: rgba(56, 189, 248, 0.25); border-radius: 9999px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; background: #06080F; border: 2px solid #38BDF8; color: #fff; padding: 4px 8px; border-radius: 12px; font-weight: 800; font-size: 12px; font-family: Outfit, sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 8px; height: 8px; background: #06B6D4; border-radius: 9999px;"></span>
          ${temp}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Component to dynamically re-center map upon location switch
const ChangeMapCenter: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
};

export const WeatherMap: React.FC<WeatherMapProps> = ({
  location,
  weather,
  tempUnit,
}) => {
  const [activeLayer, setActiveLayer] = useState<'standard' | 'dark' | 'voyager'>('dark');

  const position: [number, number] = [location.latitude, location.longitude];
  const formattedTemp = formatTemp(weather.current.temperature, tempUnit);

  // Free, high-performance tile layers requiring zero API keys
  const tileProviders = {
    dark: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, DeLorme, NAVTEQ',
      label: 'Atmospheric Dark (Default)',
    },
    standard: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      label: 'Standard Topographic',
    },
    voyager: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      label: 'Satellite View',
    },
  };

  return (
    <section id="radar-map" className="py-12 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Geospatial Radar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Interactive Atmospheric Map
          </h2>
        </div>

        {/* Map Layer Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl self-start sm:self-auto">
          <Layers className="w-4 h-4 text-slate-400 ml-2" />
          <button
            onClick={() => setActiveLayer('dark')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeLayer === 'dark'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dark Radar
          </button>
          <button
            onClick={() => setActiveLayer('voyager')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeLayer === 'voyager'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setActiveLayer('standard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeLayer === 'standard'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OpenStreetMap
          </button>
        </div>
      </div>

      {/* Map Surface Container */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-3xl overflow-hidden relative shadow-2xl">
        <div className="h-[420px] sm:h-[480px] w-full rounded-2xl overflow-hidden relative z-0">
          <MapContainer
            center={position}
            zoom={9}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <ChangeMapCenter coords={position} />
            <TileLayer
              attribution={tileProviders[activeLayer].attribution}
              url={tileProviders[activeLayer].url}
            />
            <Marker position={position} icon={createCustomIcon(formattedTemp)}>
              <Popup>
                <div className="p-1 space-y-1">
                  <div className="font-extrabold text-white text-sm font-['Outfit']">
                    {location.name}
                  </div>
                  <div className="text-xs text-slate-300">
                    Temp: <span className="text-cyan-300 font-bold">{formattedTemp}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Coordinates: {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Floating location telemetry badge on map */}
          <div className="absolute bottom-4 left-4 z-[400] glass-pill px-3.5 py-2 rounded-xl text-xs text-slate-200 flex items-center gap-2 border border-slate-700/80 shadow-lg pointer-events-none">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">{location.name}</span>
            <span className="text-slate-400 font-mono">
              ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
            </span>
          </div>

          <div className="absolute top-4 right-4 z-[400] glass-pill px-3 py-1.5 rounded-xl text-[11px] text-slate-300 border border-slate-700/80 shadow-lg pointer-events-none hidden sm:block">
            <span className="text-cyan-400 font-semibold">Open-Meteo Grid:</span> Live Surface Integration
          </div>
        </div>
      </div>
    </section>
  );
};
