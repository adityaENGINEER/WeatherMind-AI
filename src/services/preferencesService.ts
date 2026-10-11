import { UserPreferences, WeatherCoordinates } from '../types/weather';

const PREFS_KEY = 'atmos_preferences_v1';
const FAVORITES_KEY = 'atmos_favorite_cities_v1';
const RECENTS_KEY = 'atmos_recent_searches_v1';
const SELECTED_LOCATION_KEY = 'atmos_selected_location_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  tempUnit: 'celsius',
  windUnit: 'kmh',
  timeFormat: '12h',
  reducedMotion: false,
};

// Permanent Default Location: New Delhi, India
export const DEFAULT_LOCATION: WeatherCoordinates = {
  name: 'New Delhi',
  country: 'India',
  admin1: 'Delhi',
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 'Asia/Kolkata',
};

export const DEFAULT_CITIES: WeatherCoordinates[] = [
  DEFAULT_LOCATION,
  { name: 'Tokyo', country: 'Japan', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
];

/**
 * Load the active selected location.
 * Falls back safely to New Delhi, India if unselected or corrupted.
 */
export function loadSelectedLocation(): WeatherCoordinates {
  try {
    const raw = localStorage.getItem(SELECTED_LOCATION_KEY);
    if (!raw) return DEFAULT_LOCATION;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.latitude === 'number' &&
      !isNaN(parsed.latitude) &&
      typeof parsed.longitude === 'number' &&
      !isNaN(parsed.longitude) &&
      typeof parsed.name === 'string' &&
      parsed.name.trim().length > 0
    ) {
      return parsed;
    }
    return DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}

/**
 * Save the active selected location to localStorage.
 */
export function saveSelectedLocation(loc: WeatherCoordinates): void {
  try {
    if (
      typeof loc.latitude === 'number' &&
      !isNaN(loc.latitude) &&
      typeof loc.longitude === 'number' &&
      !isNaN(loc.longitude)
    ) {
      localStorage.setItem(SELECTED_LOCATION_KEY, JSON.stringify(loc));
    }
  } catch (err) {
    console.warn('Could not save selected location to localStorage', err);
  }
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('Could not save preferences to localStorage', err);
  }
}

export function loadFavoriteCities(): WeatherCoordinates[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return DEFAULT_CITIES.slice(0, 3);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CITIES.slice(0, 3);
  } catch {
    return DEFAULT_CITIES.slice(0, 3);
  }
}

export function saveFavoriteCities(cities: WeatherCoordinates[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(cities));
  } catch (err) {
    console.warn('Could not save favorites to localStorage', err);
  }
}

export function loadRecentSearches(): WeatherCoordinates[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(item: WeatherCoordinates): void {
  try {
    const existing = loadRecentSearches();
    const filtered = existing.filter(
      c => Math.abs(c.latitude - item.latitude) > 0.01 || Math.abs(c.longitude - item.longitude) > 0.01
    );
    const updated = [item, ...filtered].slice(0, 6);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save recent search', err);
  }
}
