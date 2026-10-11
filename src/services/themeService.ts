import { ProcessedWeatherData } from '../types/weather';

export interface LocationSolarTimeInfo {
  isDay: boolean;
  theme: 'day' | 'night';
  localTimeString: string;
  sunriseTimeString: string;
  sunsetTimeString: string;
  solarStatusDescription: string;
  minutesToNextTransition: number;
}

/**
 * Parses an ISO date/time or time string within a specified timezone into a timestamp
 */
function parseTimeInZone(timeStr: string, timezone: string): number {
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.getTime();
    }
  } catch {}
  return Date.now();
}

/**
 * Calculates whether it is currently daytime or nighttime at the selected location
 * using real sunrise and sunset data, location timezone, and current telemetry.
 */
export function calculateLocationDayNight(weather: ProcessedWeatherData | null): LocationSolarTimeInfo {
  if (!weather) {
    // Sensible local default fallback
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18;
    return {
      isDay,
      theme: isDay ? 'day' : 'night',
      localTimeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sunriseTimeString: '06:00 AM',
      sunsetTimeString: '06:30 PM',
      solarStatusDescription: isDay ? 'Daylight Hours' : 'Nocturnal Sky',
      minutesToNextTransition: 180,
    };
  }

  const tz = weather.timezone || 'UTC';
  const today = weather.daily?.[0];
  const now = new Date();

  // Format location's actual local time
  let localTimeString = '';
  try {
    localTimeString = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);
  } catch {
    localTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // If Open-Meteo daily forecast has sunrise/sunset
  if (today?.sunrise && today?.sunset) {
    // Extract local hour & minute in city's timezone
    let localTotalMinutes = now.getHours() * 60 + now.getMinutes();
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).formatToParts(now);
      const h = parseInt(parts.find(p => p.type === 'hour')?.value || '12', 10);
      const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      localTotalMinutes = h * 60 + m;
    } catch {}

    // Open-Meteo returns sunrise and sunset as 'YYYY-MM-DDTHH:MM' in location's local time
    let sunriseTotalMinutes = 6 * 60; // default 06:00
    let sunsetTotalMinutes = 18 * 60 + 30; // default 18:30
    try {
      const sunriseTimePart = today.sunrise.includes('T') ? today.sunrise.split('T')[1] : today.sunrise;
      const [sh, sm] = sunriseTimePart.split(':').map(Number);
      sunriseTotalMinutes = sh * 60 + sm;

      const sunsetTimePart = today.sunset.includes('T') ? today.sunset.split('T')[1] : today.sunset;
      const [eh, em] = sunsetTimePart.split(':').map(Number);
      sunsetTotalMinutes = eh * 60 + em;
    } catch {}

    // Calculation based on local solar minutes
    const isDayCalculated = localTotalMinutes >= sunriseTotalMinutes && localTotalMinutes < sunsetTotalMinutes;

    // Open-Meteo's weather.current.isDay is scientifically determined by solar zenith angle
    const isDay = typeof weather.current?.isDay === 'boolean'
      ? weather.current.isDay
      : isDayCalculated;

    // Format human-readable sunrise / sunset in 12-hour AM/PM format
    const formatTime12h = (totalMins: number) => {
      const h24 = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      const period = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const sunriseTimeString = formatTime12h(sunriseTotalMinutes);
    const sunsetTimeString = formatTime12h(sunsetTotalMinutes);

    let minutesToNextTransition = 0;
    let solarStatusDescription = '';

    if (isDay) {
      minutesToNextTransition = Math.max(0, sunsetTotalMinutes - localTotalMinutes);
      const hoursLeft = Math.floor(minutesToNextTransition / 60);
      const minsLeft = minutesToNextTransition % 60;
      solarStatusDescription = `Daylight active until sunset at ${sunsetTimeString} (${hoursLeft > 0 ? `${hoursLeft}h ` : ''}${minsLeft}m remaining)`;
    } else {
      // Nighttime: remaining until next sunrise
      minutesToNextTransition = localTotalMinutes < sunriseTotalMinutes
        ? (sunriseTotalMinutes - localTotalMinutes)
        : ((24 * 60 - localTotalMinutes) + sunriseTotalMinutes);
      const hoursLeft = Math.floor(minutesToNextTransition / 60);
      const minsLeft = minutesToNextTransition % 60;
      solarStatusDescription = `Nighttime active until sunrise at ${sunriseTimeString} (in ~${hoursLeft > 0 ? `${hoursLeft}h ` : ''}${minsLeft}m)`;
    }

    return {
      isDay,
      theme: isDay ? 'day' : 'night',
      localTimeString,
      sunriseTimeString,
      sunsetTimeString,
      solarStatusDescription,
      minutesToNextTransition,
    };
  }

  // Fallback: use weather.current.isDay or local hour in location's timezone
  const isDay = weather.current?.isDay ?? (now.getHours() >= 6 && now.getHours() < 18);
  return {
    isDay,
    theme: isDay ? 'day' : 'night',
    localTimeString,
    sunriseTimeString: '06:00 AM',
    sunsetTimeString: '06:30 PM',
    solarStatusDescription: isDay ? 'Daylight active in local sector' : 'Nighttime active in local sector',
    minutesToNextTransition: 120,
  };
}
