import { WeatherConditionInfo } from '../types/weather';

/**
 * WMO Weather interpretation codes (WW)
 * 0: Clear sky
 * 1, 2, 3: Mainly clear, partly cloudy, and overcast
 * 45, 48: Fog and depositing rime fog
 * 51, 53, 55: Drizzle: Light, moderate, and dense intensity
 * 56, 57: Freezing Drizzle: Light and dense intensity
 * 61, 63, 65: Rain: Slight, moderate and heavy intensity
 * 66, 67: Freezing Rain: Light and heavy intensity
 * 71, 73, 75: Snow fall: Slight, moderate, and heavy intensity
 * 77: Snow grains
 * 80, 81, 82: Rain showers: Slight, moderate, and violent
 * 85, 86: Snow showers slight and heavy
 * 95: Thunderstorm: Slight or moderate
 * 96, 99: Thunderstorm with slight and heavy hail
 */
export function getWeatherCondition(code: number, isDay: boolean = true): WeatherConditionInfo {
  switch (code) {
    case 0:
      return {
        label: isDay ? 'Clear Sky' : 'Clear Night',
        description: isDay ? 'Brilliant sunshine with unobstructed skies' : 'Starlit sky with crisp nocturnal clarity',
        icon: isDay ? 'Sun' : 'Moon',
        accentColor: isDay ? '#F59E0B' : '#818CF8',
        atmosphere: 'clear',
      };
    case 1:
      return {
        label: isDay ? 'Mainly Clear' : 'Partly Clear Night',
        description: 'Atmosphere mostly transparent with gentle solar radiation',
        icon: isDay ? 'SunMedium' : 'MoonStar',
        accentColor: isDay ? '#FBBF24' : '#93C5FD',
        atmosphere: 'clear',
      };
    case 2:
      return {
        label: 'Partly Cloudy',
        description: 'Scattered cumulus clouds filtering gentle ambient light',
        icon: isDay ? 'CloudSun' : 'CloudMoon',
        accentColor: '#38BDF8',
        atmosphere: 'clouds',
      };
    case 3:
      return {
        label: 'Overcast',
        description: 'Dense stratus canopy enveloping the surrounding horizon',
        icon: 'Cloud',
        accentColor: '#94A3B8',
        atmosphere: 'clouds',
      };
    case 45:
    case 48:
      return {
        label: 'Atmospheric Fog',
        description: 'Suspended condensation layers reducing horizontal visibility',
        icon: 'CloudFog',
        accentColor: '#A1A1AA',
        atmosphere: 'fog',
      };
    case 51:
    case 53:
    case 55:
      return {
        label: 'Fine Drizzle',
        description: 'Micro-precipitation drifting through the atmospheric boundary',
        icon: 'CloudDrizzle',
        accentColor: '#06B6D4',
        atmosphere: 'rain',
      };
    case 56:
    case 57:
      return {
        label: 'Freezing Drizzle',
        description: 'Sub-zero liquid droplets freezing immediately upon surface impact',
        icon: 'CloudHail',
        accentColor: '#67E8F9',
        atmosphere: 'snow',
      };
    case 61:
      return {
        label: 'Light Rain',
        description: 'Gentle raindrops with soft atmospheric soundscapes',
        icon: 'CloudRain',
        accentColor: '#0EA5E9',
        atmosphere: 'rain',
      };
    case 63:
      return {
        label: 'Moderate Rain',
        description: 'Steady rainfall replenishing ground moisture',
        icon: 'CloudRain',
        accentColor: '#0284C7',
        atmosphere: 'rain',
      };
    case 65:
      return {
        label: 'Heavy Downpour',
        description: 'Vigorous precipitative storm cells bringing significant accumulation',
        icon: 'CloudRain',
        accentColor: '#0369A1',
        atmosphere: 'rain',
      };
    case 66:
    case 67:
      return {
        label: 'Freezing Rain',
        description: 'Hazardous glazes forming across terrestrial surfaces',
        icon: 'CloudHail',
        accentColor: '#38BDF8',
        atmosphere: 'snow',
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        label: 'Snowfall',
        description: 'Crystalline ice dendrites descending smoothly through the air',
        icon: 'CloudSnow',
        accentColor: '#E0F2FE',
        atmosphere: 'snow',
      };
    case 80:
    case 81:
    case 82:
      return {
        label: 'Rain Showers',
        description: 'Dynamic convective showers with alternating cloud breaks',
        icon: 'CloudRain',
        accentColor: '#0284C7',
        atmosphere: 'rain',
      };
    case 85:
    case 86:
      return {
        label: 'Snow Showers',
        description: 'Intermittent flurries driven by upper-level cold fronts',
        icon: 'CloudSnow',
        accentColor: '#BAE6FD',
        atmosphere: 'snow',
      };
    case 95:
      return {
        label: 'Thunderstorm',
        description: 'High-energy electrical discharges with rapid barometric shifts',
        icon: 'CloudLightning',
        accentColor: '#A855F7',
        atmosphere: 'thunderstorm',
      };
    case 96:
    case 99:
      return {
        label: 'Severe Thunderstorm & Hail',
        description: 'Violent updrafts producing hailstone impact and intense gusts',
        icon: 'CloudLightning',
        accentColor: '#EC4899',
        atmosphere: 'thunderstorm',
      };
    default:
      return {
        label: 'Atmospheric Dispersion',
        description: 'Standard ambient tropospheric conditions',
        icon: 'Cloud',
        accentColor: '#38BDF8',
        atmosphere: 'clear',
      };
  }
}

/**
 * Format temperatures based on unit
 */
export function formatTemp(tempC: number | null | undefined, unit: 'celsius' | 'fahrenheit' = 'celsius'): string {
  if (tempC === null || tempC === undefined || isNaN(tempC)) return '--°';
  if (unit === 'fahrenheit') {
    const tempF = Math.round((tempC * 9) / 5 + 32);
    return `${tempF}°F`;
  }
  return `${Math.round(tempC)}°C`;
}

export function formatTempRaw(tempC: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): number {
  if (unit === 'fahrenheit') {
    return Math.round((tempC * 9) / 5 + 32);
  }
  return Math.round(tempC);
}

/**
 * Format wind speed
 */
export function formatWind(speedKmh: number, unit: 'kmh' | 'mph' | 'ms' = 'kmh'): string {
  if (unit === 'mph') {
    return `${Math.round(speedKmh * 0.621371)} mph`;
  }
  if (unit === 'ms') {
    return `${Math.round((speedKmh * 1000) / 3600)} m/s`;
  }
  return `${Math.round(speedKmh)} km/h`;
}

/**
 * Wind direction degrees to compass cardinal
 */
export function getWindCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
}

/**
 * Format local time
 */
export function formatHour(isoString: string, format: '12h' | '24h' = '12h'): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    
    if (format === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  } catch {
    return isoString;
  }
}

/**
 * Format day name
 */
export function formatDayName(dateString: string, isTodayIndex: boolean = false): string {
  if (isTodayIndex) return 'Today';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } catch {
    return dateString;
  }
}

/**
 * UV index severity descriptor
 */
export function getUvCategory(uv: number): { label: string; color: string; desc: string } {
  if (uv < 3) return { label: 'Low', color: '#10B981', desc: 'Minimal solar danger' };
  if (uv < 6) return { label: 'Moderate', color: '#F59E0B', desc: 'Protection recommended' };
  if (uv < 8) return { label: 'Very High', color: '#F97316', desc: 'Sun protection essential' };
  if (uv < 11) return { label: 'High', color: '#EF4444', desc: 'Extra precautions required' };
  return { label: 'Extreme', color: '#A855F7', desc: 'Avoid outdoor exposure' };
}

/**
 * Air humidity category
 */
export function getHumidityCategory(rh: number): { label: string; desc: string } {
  if (rh < 30) return { label: 'Dry', desc: 'Low moisture index' };
  if (rh <= 60) return { label: 'Comfortable', desc: 'Optimal ambient moisture' };
  if (rh <= 80) return { label: 'Humid', desc: 'Noticeable dew saturation' };
  return { label: 'Very Humid', desc: 'Dense tropical air mass' };
}
