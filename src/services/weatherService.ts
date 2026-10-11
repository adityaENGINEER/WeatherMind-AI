import { GeocodingResult, ProcessedWeatherData, WeatherCoordinates } from '../types/weather';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const PHOTON_BASE = 'https://photon.komoot.io/api/';

// Optional Google Places API key from environment
const GOOGLE_PLACES_API_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GOOGLE_PLACES_API_KEY) ||
  (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.VITE_GOOGLE_PLACES_API_KEY) ||
  '';

// In-memory caches to prevent redundant network calls and adhere to API rate limits
const weatherCache = new Map<string, { data: ProcessedWeatherData; timestamp: number }>();
const geocodingCache = new Map<string, { data: GeocodingResult[]; timestamp: number }>();

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GEO_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes for geocoding

/**
 * Normalizes and categorizes OpenStreetMap / Photon / Places classification tags
 * into clean, user-friendly categories.
 */
function normalizeCategory(typeOrOsm: string): string {
  const val = (typeOrOsm || '').toLowerCase();
  if (['university', 'college', 'school', 'kindergarten'].includes(val)) return 'University / School';
  if (['hospital', 'clinic', 'doctors', 'pharmacy'].includes(val)) return 'Hospital / Healthcare';
  if (['mall', 'supermarket', 'department_store', 'marketplace', 'shop'].includes(val)) return 'Mall / Shopping';
  if (['restaurant', 'fast_food', 'cafe', 'bar', 'food_court', 'pub'].includes(val)) return 'Restaurant / Cafe';
  if (['hotel', 'motel', 'guest_house', 'hostel'].includes(val)) return 'Hotel / Lodging';
  if (['attraction', 'monument', 'memorial', 'castle', 'viewpoint', 'theme_park'].includes(val)) return 'Landmark / Monument';
  if (['place_of_worship', 'temple', 'church', 'mosque'].includes(val)) return 'Temple / Religious Place';
  if (['aerodrome', 'airport', 'terminal'].includes(val)) return 'Airport / Terminal';
  if (['station', 'subway_entrance', 'train_station', 'bus_stop', 'platform'].includes(val)) return 'Transit / Station';
  if (['park', 'stadium', 'pitch', 'sports_centre'].includes(val)) return 'Park / Stadium';
  if (['suburb', 'neighbourhood', 'quarter', 'residential'].includes(val)) return 'Locality / Sector';
  if (['highway', 'primary', 'secondary', 'residential', 'road', 'street'].includes(val)) return 'Street / Road';
  if (['city', 'town', 'village', 'hamlet'].includes(val)) return 'City / Town';
  return 'Point of Interest';
}

/**
 * Searches real-world places using Photon (Komoot OSM high-speed POI search engine).
 * Excels at commercial establishments, malls, restaurants, shops, and institutions.
 */
async function searchPhotonPlaces(trimmed: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  try {
    const url = `${PHOTON_BASE}?q=${encodeURIComponent(trimmed)}&limit=8`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map((f: any, idx: number) => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates || [0, 0];
      const primaryName = p.name || p.street || trimmed;
      const category = normalizeCategory(p.osm_value || p.osm_key || 'place');

      const locParts = [p.district || p.suburb, p.city, p.state, p.country].filter(Boolean);
      const distinctParts = locParts.filter((v, i, a) => a.indexOf(v) === i && v !== primaryName);
      const formattedLocality = distinctParts.join(', ');

      return {
        id: `photon-${p.osm_id || idx}-${Date.now()}`,
        name: primaryName,
        latitude: coords[1],
        longitude: coords[0],
        country: p.country || 'Global',
        country_code: p.countrycode?.toUpperCase(),
        admin1: p.state,
        displayName: [primaryName, formattedLocality].filter(Boolean).join(' — '),
        locality: formattedLocality,
        category,
        precision: ['city', 'state', 'country'].includes(p.osm_value) ? 'locality' : 'exact',
      } as GeocodingResult;
    });
  } catch (e: any) {
    if (e.name === 'AbortError') throw e;
    return [];
  }
}

/**
 * Searches real-world places using OpenStreetMap Nominatim.
 * Excels at landmarks, universities, official campuses, and structured civic addresses.
 */
async function searchNominatimPlaces(trimmed: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  try {
    const nominatimUrl = `${NOMINATIM_BASE}?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=8&namedetails=1`;
    const res = await fetch(nominatimUrl, {
      signal,
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'ATMOS-Weather-Platform/2.5 (contact@atmos.io; educational real-world places platform)',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any, index: number) => {
      const addr = item.address || {};
      const primaryName =
        item.name ||
        addr.amenity ||
        addr.building ||
        addr.tourism ||
        addr.historic ||
        addr.college ||
        addr.university ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.city ||
        item.display_name.split(',')[0].trim();

      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.city_district ||
        addr.city ||
        addr.town ||
        addr.village ||
        addr.county ||
        '';

      const admin1 = addr.state || addr.region || undefined;
      const country = addr.country || 'Global';
      const category = normalizeCategory(item.type || item.class || 'place');

      const locationParts = [locality, admin1, country].filter(Boolean);
      const distinctParts = locationParts.filter((v, i, a) => a.indexOf(v) === i && v !== primaryName);
      const formattedLocality = distinctParts.join(', ');

      return {
        id: item.place_id || `nom-${index}-${Date.now()}`,
        name: primaryName,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        country,
        country_code: addr.country_code ? addr.country_code.toUpperCase() : undefined,
        admin1,
        displayName: item.display_name,
        locality: formattedLocality,
        category,
        precision: item.type === 'city' || item.type === 'state' ? 'locality' : 'exact',
      } as GeocodingResult;
    });
  } catch (e: any) {
    if (e.name === 'AbortError') throw e;
    return [];
  }
}

/**
 * Searches Google Places API if configured in .env (VITE_GOOGLE_PLACES_API_KEY).
 */
async function searchGooglePlaces(trimmed: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];
  try {
    // Autocomplete endpoint
    const autoUrl = `https://places.googleapis.com/v1/places:autocomplete`;
    const res = await fetch(autoUrl, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify({ input: trimmed }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.suggestions) return [];

    // Resolve top 5 predictions to coordinates via Place Details
    const detailsPromises = data.suggestions.slice(0, 5).map(async (s: any) => {
      const placeId = s.placePrediction?.placeId;
      if (!placeId) return null;
      const detRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=displayName,formattedAddress,location,types,addressComponents`, {
        signal,
        headers: {
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        },
      });
      if (!detRes.ok) return null;
      const p = await detRes.json();
      return {
        id: placeId,
        name: p.displayName?.text || s.placePrediction?.text?.text,
        latitude: p.location?.latitude,
        longitude: p.location?.longitude,
        country: 'Global',
        displayName: p.formattedAddress,
        locality: p.formattedAddress,
        category: p.types?.[0] ? normalizeCategory(p.types[0]) : 'Point of Interest',
        precision: 'exact',
      } as GeocodingResult;
    });

    const resolved = await Promise.all(detailsPromises);
    return resolved.filter(Boolean) as GeocodingResult[];
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('Google Places call fallback:', err);
    return [];
  }
}

/**
 * Helper to query parallel discovery providers (Photon & Nominatim)
 */
async function queryDiscoveryProviders(rawQuery: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const [photonResults, nominatimResults] = await Promise.allSettled([
    searchPhotonPlaces(rawQuery, signal),
    searchNominatimPlaces(rawQuery, signal),
  ]);

  const candidates: GeocodingResult[] = [];
  if (nominatimResults.status === 'fulfilled') candidates.push(...nominatimResults.value);
  if (photonResults.status === 'fulfilled') candidates.push(...photonResults.value);
  return candidates;
}

/**
 * Google Maps-Style Smart Universal Place Discovery Service.
 * Combines Google Places API (if configured), Photon POI index, and Nominatim OpenStreetMap.
 * Features automatic query relaxation, multi-branch deduplication, and intelligent relevance ranking.
 */
export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  const cached = geocodingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Check Google Places first if configured in environment
  if (GOOGLE_PLACES_API_KEY) {
    const googleResults = await searchGooglePlaces(trimmed, signal);
    if (googleResults.length > 0) {
      geocodingCache.set(cacheKey, { data: googleResults, timestamp: Date.now() });
      return googleResults;
    }
  }

  // 2. High-speed parallel discovery combining Photon (POIs/malls/restaurants) & Nominatim (civic/institutions/landmarks)
  let candidates: GeocodingResult[] = await queryDiscoveryProviders(trimmed, signal);

  // 3. Intelligent Query Relaxation Fallback:
  // If no candidates found, clean up formatting, postal codes, and try relaxed queries
  if (candidates.length === 0) {
    // Strategy A: Strip postal / PIN codes (e.g. "Select City Walk, Saket, Delhi 110017" -> "Select City Walk, Saket, Delhi")
    const withoutPincode = trimmed.replace(/\b\d{4,6}\b/g, '').replace(/,\s*,/g, ',').trim();
    if (withoutPincode && withoutPincode !== trimmed) {
      candidates = await queryDiscoveryProviders(withoutPincode, signal);
    }
  }

  if (candidates.length === 0 && trimmed.includes(',')) {
    // Strategy B: Search the primary venue name (before first comma) e.g. "IIT Delhi, Hauz Khas" -> "IIT Delhi"
    const primaryClause = trimmed.split(',')[0].trim();
    if (primaryClause.length >= 3) {
      candidates = await queryDiscoveryProviders(primaryClause, signal);
    }
  }

  if (candidates.length === 0 && trimmed.split(/\s+/).length > 3) {
    // Strategy C: Search first 3 significant tokens
    const firstTokens = trimmed.split(/\s+/).slice(0, 3).join(' ');
    candidates = await queryDiscoveryProviders(firstTokens, signal);
  }

  // 4. Fallback to Open-Meteo Geocoding for pure administrative or regional queries if still empty
  if (candidates.length === 0) {
    try {
      const fallbackUrl = `${OPEN_METEO_GEOCODING_BASE}?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json`;
      const res = await fetch(fallbackUrl, { signal });
      if (res.ok) {
        const data = await res.json();
        const openMeteoResults: GeocodingResult[] = (data.results || []).map((r: any) => ({
          id: `om-${r.id}`,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          country: r.country,
          country_code: r.country_code,
          admin1: r.admin1,
          locality: [r.admin1, r.country].filter(Boolean).join(', '),
          category: 'City / Region',
          precision: 'locality',
        }));
        candidates.push(...openMeteoResults);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') throw e;
    }
  }

  // 5. Smart Coordinate-Based Deduplication:
  // Two results are duplicates ONLY if they refer to the exact same physical spot (< 0.006° delta, ~600m).
  // Different campuses or retail branches sharing the same name in different cities/localities MUST be preserved!
  const uniqueList: GeocodingResult[] = [];
  for (const item of candidates) {
    const dupIdx = uniqueList.findIndex(existing => {
      const closeDist =
        Math.abs(existing.latitude - item.latitude) < 0.006 &&
        Math.abs(existing.longitude - item.longitude) < 0.006;
      return closeDist;
    });

    if (dupIdx === -1) {
      uniqueList.push(item);
    } else {
      // Enrich existing record with better category or locality if available
      const existing = uniqueList[dupIdx];
      if (existing.category === 'Point of Interest' && item.category !== 'Point of Interest') {
        existing.category = item.category;
      }
      if (!existing.locality && item.locality) {
        existing.locality = item.locality;
      }
    }
  }

  // Disambiguate places sharing the exact same name across different cities/regions
  const nameFreq = new Map<string, number>();
  for (const item of uniqueList) {
    const key = item.name.toLowerCase();
    nameFreq.set(key, (nameFreq.get(key) || 0) + 1);
  }
  for (const item of uniqueList) {
    if ((nameFreq.get(item.name.toLowerCase()) || 0) > 1 && item.locality) {
      const locHint = item.locality.split(',')[0].trim();
      if (!item.name.toLowerCase().includes(locHint.toLowerCase())) {
        item.displayName = `${item.name} (${locHint})`;
      }
    }
  }

  // 6. Intelligent Ranking & Relevance Scoring
  const lowerQ = trimmed.toLowerCase();
  const queryTokens = lowerQ.split(/[\s,]+/).filter(t => t.length > 1);

  uniqueList.sort((a, b) => {
    const scoreItem = (item: GeocodingResult) => {
      const n = item.name.toLowerCase();
      const d = (item.displayName || '').toLowerCase();
      const l = (item.locality || '').toLowerCase();
      let s = 0;

      if (n === lowerQ) s += 100;
      else if (n.startsWith(lowerQ)) s += 60;
      else if (n.includes(lowerQ)) s += 40;
      else if (d.includes(lowerQ) || l.includes(lowerQ)) s += 25;

      for (const t of queryTokens) {
        if (n.includes(t)) s += 12;
        else if (d.includes(t) || l.includes(t)) s += 4;
      }

      // Prioritize landmarks, colleges, POIs over generic large regions
      if (item.category && item.category !== 'City / Town' && item.category !== 'Point of Interest') {
        s += 8;
      }
      return s;
    };

    return scoreItem(b) - scoreItem(a);
  });

  const finalResults = uniqueList.slice(0, 10);
  geocodingCache.set(cacheKey, { data: finalResults, timestamp: Date.now() });
  return finalResults;
}

/**
 * Fetch detailed weather forecast using Open-Meteo Forecast API for exact coordinates
 */
export async function fetchWeatherData(coords: WeatherCoordinates): Promise<ProcessedWeatherData> {
  const cacheKey = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.data,
      location: coords,
    };
  }

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'uv_index',
      'cloud_cover',
      'is_day',
      'visibility',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'daylight_duration',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'uv_index_max',
    ].join(','),
    timezone: 'auto',
    timeformat: 'iso8601',
  });

  const url = `${OPEN_METEO_BASE}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather service responded with status ${response.status}`);
    }
    const raw = await response.json();

    const hourlyLength = Math.min(raw.hourly.time.length, 48);
    const hourly = [];
    for (let i = 0; i < hourlyLength; i++) {
      hourly.push({
        time: raw.hourly.time[i],
        temperature: raw.hourly.temperature_2m[i],
        apparentTemperature: raw.hourly.apparent_temperature[i],
        precipitationProbability: raw.hourly.precipitation_probability[i] ?? 0,
        precipitation: raw.hourly.precipitation[i] ?? 0,
        weatherCode: raw.hourly.weather_code[i],
        relativeHumidity: raw.hourly.relative_humidity_2m[i],
        windSpeed: raw.hourly.wind_speed_10m[i],
        uvIndex: raw.hourly.uv_index[i] ?? 0,
        cloudCover: raw.hourly.cloud_cover[i] ?? 0,
        isDay: raw.hourly.is_day[i] === 1,
      });
    }

    const dailyLength = raw.daily.time.length;
    const daily = [];
    for (let i = 0; i < dailyLength; i++) {
      daily.push({
        date: raw.daily.time[i],
        weatherCode: raw.daily.weather_code[i],
        temperatureMax: raw.daily.temperature_2m_max[i],
        temperatureMin: raw.daily.temperature_2m_min[i],
        apparentTemperatureMax: raw.daily.apparent_temperature_max[i],
        apparentTemperatureMin: raw.daily.apparent_temperature_min[i],
        sunrise: raw.daily.sunrise[i],
        sunset: raw.daily.sunset[i],
        daylightDuration: raw.daily.daylight_duration[i],
        precipitationSum: raw.daily.precipitation_sum[i] ?? 0,
        precipitationProbabilityMax: raw.daily.precipitation_probability_max[i] ?? 0,
        windSpeedMax: raw.daily.wind_speed_10m_max[i],
        uvIndexMax: raw.daily.uv_index_max[i] ?? 0,
      });
    }

    const currentHourIndex = hourly.findIndex(h => {
      const itemHour = new Date(h.time).getHours();
      const currentHour = new Date(raw.current.time).getHours();
      return itemHour === currentHour;
    });

    const currentUv = currentHourIndex >= 0 ? (raw.hourly.uv_index[currentHourIndex] ?? 0) : 0;
    const currentVis = currentHourIndex >= 0 && raw.hourly.visibility ? (raw.hourly.visibility[currentHourIndex] / 1000) : 10;

    const processed: ProcessedWeatherData = {
      location: coords,
      current: {
        time: raw.current.time,
        temperature: raw.current.temperature_2m,
        apparentTemperature: raw.current.apparent_temperature,
        relativeHumidity: raw.current.relative_humidity_2m,
        precipitation: raw.current.precipitation ?? 0,
        weatherCode: raw.current.weather_code,
        cloudCover: raw.current.cloud_cover,
        windSpeed: raw.current.wind_speed_10m,
        windDirection: raw.current.wind_direction_10m,
        surfacePressure: raw.current.surface_pressure,
        uvIndex: currentUv,
        visibility: currentVis,
        isDay: raw.current.is_day === 1,
      },
      hourly,
      daily,
      elevation: raw.elevation ?? 0,
      timezone: raw.timezone || coords.timezone || 'UTC',
      timezoneAbbreviation: raw.timezone_abbreviation || '',
      updatedAt: new Date().toISOString(),
    };

    weatherCache.set(cacheKey, { data: processed, timestamp: Date.now() });
    return processed;
  } catch (err) {
    console.error('Failed to fetch Open-Meteo weather data:', err);
    throw err;
  }
}

/**
 * Reverse geocode coordinates to find place, institution, city, region, and country name
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ name: string; country: string; admin1?: string; category?: string }> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'ATMOS-Weather-Platform/2.5 (contact@atmos.io)',
      },
    });
    if (!res.ok) {
      return { name: `Live Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`, country: 'Detected GPS' };
    }
    const data = await res.json();
    const addr = data.address || {};
    const city =
      data.name ||
      addr.amenity ||
      addr.building ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.city ||
      addr.town ||
      addr.village ||
      'Detected Location';
    const country = addr.country || 'Current Area';
    const admin1 = addr.state || addr.region || undefined;
    return { name: city, country, admin1 };
  } catch (err) {
    console.warn('Reverse geocoding notice:', err);
    return { name: `Live Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`, country: 'Detected GPS' };
  }
}
