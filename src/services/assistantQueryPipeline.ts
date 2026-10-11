import { WeatherCoordinates, ProcessedWeatherData, TemperatureUnit, WindSpeedUnit, OutfitStyle } from '../types/weather';
import { searchLocations, fetchWeatherData } from './weatherService';
import { formatTemp, formatWind, getWeatherCondition } from '../utils/weatherUtils';
import { generateOutfitForSlot } from './outfitService';

export interface WeatherToolContext {
  lastLocation?: WeatherCoordinates;
  lastDate?: string; // 'today' | 'tomorrow' | YYYY-MM-DD
  userUnit?: TemperatureUnit;
  userWindUnit?: WindSpeedUnit;
}

export interface AssistantResponse {
  answer: string;
  contextPeriod: string;
  resolvedLocation?: string;
  comparisonData?: {
    cityA: string;
    cityB: string;
    metrics: Array<{ label: string; valA: string; valB: string }>;
  };
  isError?: boolean;
}

/**
 * Common stopwords to avoid confusing with location names
 */
const NON_LOCATION_WORDS = new Set([
  'what', 'is', 'the', 'weather', 'in', 'at', 'for', 'of', 'like', 'how', 'tell', 'me', 'about',
  'current', 'right', 'now', 'today', 'tomorrow', 'yesterday', 'temperature', 'temp', 'humidity',
  'wind', 'speed', 'rain', 'raining', 'rainy', 'chance', 'probability', 'forecast', 'compare',
  'between', 'and', 'or', 'which', 'colder', 'hotter', 'warmer', 'city', 'country', 'this',
  'evening', 'morning', 'afternoon', 'tonight', 'weekend', 'my', 'location', 'here', 'there',
  'will', 'it', 'be', 'going', 'to', 'can', 'you', 'please', 'give', 'show', 'check', 'any',
  'days', 'seven', '7', 'day', 'hourly', 'feels', 'like', 'uv', 'index', 'pressure', 'sunrise', 'sunset'
]);

/**
 * Extracts candidate city/location names from natural language queries
 */
export function extractLocationsFromQuery(query: string): string[] {
  const cleaned = query.replace(/[?.,!]/g, ' ').trim();
  const lower = cleaned.toLowerCase();

  // Pattern 1: Compare X and/with Y, or Which city is colder/hotter X or Y
  const compareMatch = lower.match(/(?:compare|between|difference between)\s+([a-zA-Z\s]+?)\s+(?:and|with|to|vs|versus)\s+([a-zA-Z\s]+)/i);
  if (compareMatch) {
    const loc1 = cleanLocationCandidate(compareMatch[1]);
    const loc2 = cleanLocationCandidate(compareMatch[2]);
    if (loc1 && loc2) return [loc1, loc2];
  }

  const whichMatch = lower.match(/(?:which\s+city\s+is\s+(?:colder|hotter|warmer|rainier|drier),?\s*)([a-zA-Z\s]+?)\s+(?:or|and)\s+([a-zA-Z\s]+)/i);
  if (whichMatch) {
    const loc1 = cleanLocationCandidate(whichMatch[1]);
    const loc2 = cleanLocationCandidate(whichMatch[2]);
    if (loc1 && loc2) return [loc1, loc2];
  }

  // Pattern 2: "... in/at/around/near/for <Location> ..."
  // Example: "weather at IIT Delhi", "temperature at the Taj Mahal", "weather in London", "What about IIMT College of Engineering?"
  const prepMatches = [...query.matchAll(/\b(?:in|at|for|around|near|about|of)\s+(?:the\s+)?([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*(?:,\s*[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*)?)/gi)];
  if (prepMatches.length > 0) {
    const candidates: string[] = [];
    for (const match of prepMatches) {
      const cand = cleanLocationCandidate(match[1]);
      if (cand && !NON_LOCATION_WORDS.has(cand.toLowerCase()) && cand.length > 2) {
        candidates.push(cand);
      }
    }
    if (candidates.length > 0) return candidates;
  }

  // Only scan standalone words if query contains weather-related intent keywords
  const weatherSignalWords = ['weather', 'temp', 'temperature', 'forecast', 'rain', 'humidity', 'wind', 'colder', 'hotter'];
  const hasWeatherSignal = weatherSignalWords.some(w => lower.includes(w));

  if (hasWeatherSignal) {
    // Check multi-word landmark candidates
    const words = cleaned.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (NON_LOCATION_WORDS.has(w.toLowerCase())) continue;

      // Check 3-word phrase first (e.g. "Eiffel Tower Paris", "IIT Delhi Campus")
      if (i + 2 < words.length && !NON_LOCATION_WORDS.has(words[i + 1].toLowerCase()) && !NON_LOCATION_WORDS.has(words[i + 2].toLowerCase())) {
        return [cleanLocationCandidate(`${w} ${words[i + 1]} ${words[i + 2]}`)];
      }

      // Check 2-word phrase (e.g., "IIT Delhi", "Taj Mahal", "India Gate", "New York")
      if (i + 1 < words.length && !NON_LOCATION_WORDS.has(words[i + 1].toLowerCase())) {
        return [cleanLocationCandidate(`${w} ${words[i + 1]}`)];
      }

      if (w.length > 2) {
        return [cleanLocationCandidate(w)];
      }
    }
  }

  return [];
}

function cleanLocationCandidate(str: string): string {
  let target = str;
  // Strip trailing question marks or punctuation
  target = target.replace(/[?.,!]+$/, '').trim();
  const parts = target.trim().split(/\s+/);
  const filtered = parts.filter(p => !NON_LOCATION_WORDS.has(p.toLowerCase()));
  return filtered.join(' ').replace(/^[\s,]+|[\s,]+$/g, '').trim();
}

/**
 * Detect time/date intent (today, tomorrow, weekend, specific hour like '6 PM')
 */
export function extractTemporalIntent(query: string): {
  isTomorrow: boolean;
  isSevenDay: boolean;
  specificHour: number | null; // 0 - 23
  isWeekend: boolean;
} {
  const q = query.toLowerCase();
  const isTomorrow = q.includes('tomorrow');
  const isSevenDay = q.includes('7-day') || q.includes('7 day') || q.includes('seven-day') || q.includes('seven day') || q.includes('weekly') || q.includes('week forecast');
  const isWeekend = q.includes('weekend') || q.includes('saturday') || q.includes('sunday');

  let specificHour: number | null = null;
  const hourMatch = q.match(/\b([1-9]|1[0-2])\s*(am|pm)\b/i);
  if (hourMatch) {
    let hr = parseInt(hourMatch[1], 10);
    const meridiem = hourMatch[2].toLowerCase();
    if (meridiem === 'pm' && hr < 12) hr += 12;
    if (meridiem === 'am' && hr === 12) hr = 0;
    specificHour = hr;
  } else {
    const hr24Match = q.match(/\b([0-1]?[0-9]|2[0-3])\s*(?:h|:00|o'clock)\b/i);
    if (hr24Match) {
      specificHour = parseInt(hr24Match[1], 10);
    }
  }

  return { isTomorrow, isSevenDay, specificHour, isWeekend };
}

/**
 * Master Weather Assistant Query Pipeline:
 * 1. Resolves locations dynamically (geocoding via Open-Meteo)
 * 2. Fetches weather data for resolved coordinates
 * 3. Handles multi-city comparisons
 * 4. Preserves conversation context for follow-up questions
 * 5. Handles non-weather questions gracefully
 */
export async function executeWeatherQueryPipeline(
  query: string,
  currentAppWeather: ProcessedWeatherData,
  context: WeatherToolContext
): Promise<{ response: AssistantResponse; updatedContext: WeatherToolContext }> {
  const q = query.trim();
  const lowerQ = q.toLowerCase();

  // Check if query is completely unrelated to weather or locations
  const isGreeting = /^(hi|hello|hey|greetings|hola|good\s+morning|good\s+evening)\b/i.test(q) && q.split(' ').length <= 3;
  if (isGreeting) {
    return {
      response: {
        answer: `Hello! I am ATMOS AI, your global weather intelligence assistant. You can ask me about current conditions, forecasts, rain, or comparisons for any city or country worldwide (e.g. "What's the weather in London right now?", "Will it rain in Paris tomorrow?", or "Compare Jaipur and Singapore"). How can I assist you today?`,
        contextPeriod: 'Global Station',
      },
      updatedContext: context,
    };
  }

  const weatherKeywords = [
    'weather', 'temp', 'temperature', 'rain', 'humidity', 'wind', 'forecast', 'sun', 'cold', 'hot',
    'warm', 'chill', 'cloud', 'precipitation', 'uv', 'pressure', 'celsius', 'fahrenheit', 'degrees',
    'jacket', 'wear', 'umbrella', 'climate', 'storm', 'snow', 'fog', 'tomorrow', 'today', 'now', 'compare',
    'outfit', 'clothes', 'clothing', 'dress', 'college', 'formal', 'casual', 'hoodie', 't-shirt', 'raincoat'
  ];
  const hasWeatherTopic = weatherKeywords.some(k => lowerQ.includes(k));

  // Extract candidate locations from query
  const extractedLocations = extractLocationsFromQuery(query);
  const temporal = extractTemporalIntent(query);

  // If no weather topic AND no locations extracted, provide a polite specialization message
  if (!hasWeatherTopic && extractedLocations.length === 0) {
    return {
      response: {
        answer: `I specialize in meteorological data, climate forecasts, and atmospheric intelligence for locations worldwide. Please ask me any weather-related question (for example, "What is the temperature in London?", "Will it rain in Mumbai tomorrow?", or "Compare Tokyo and Sydney").`,
        contextPeriod: 'Specialization Notice',
      },
      updatedContext: context,
    };
  }

  // --- MULTI-LOCATION COMPARISON (e.g. "Compare Jaipur and Singapore", "Which is colder, Moscow or Delhi?") ---
  if (extractedLocations.length >= 2 || (lowerQ.includes('compare') && extractedLocations.length >= 1)) {
    let loc1Name = extractedLocations[0];
    let loc2Name = extractedLocations[1];

    // If only 1 extracted but compare requested and lastLocation exists
    if (!loc2Name && context.lastLocation) {
      loc2Name = context.lastLocation.name;
    }

    if (loc1Name && loc2Name) {
      try {
        const [geo1Results, geo2Results] = await Promise.all([
          searchLocations(loc1Name),
          searchLocations(loc2Name),
        ]);

        if (geo1Results.length === 0 || geo2Results.length === 0) {
          const missing = geo1Results.length === 0 ? loc1Name : loc2Name;
          return {
            response: {
              answer: `Could not locate "${missing}" in the global meteorological directory. Please verify the spelling or try providing the country name as well.`,
              contextPeriod: 'Geocoding Resolution',
              isError: true,
            },
            updatedContext: context,
          };
        }

        const geo1 = geo1Results[0];
        const geo2 = geo2Results[0];

        const [weather1, weather2] = await Promise.all([
          fetchWeatherData({ latitude: geo1.latitude, longitude: geo1.longitude, name: geo1.name, country: geo1.country }),
          fetchWeatherData({ latitude: geo2.latitude, longitude: geo2.longitude, name: geo2.name, country: geo2.country }),
        ]);

        const temp1 = Math.round(weather1.current.temperature);
        const temp2 = Math.round(weather2.current.temperature);
        const cond1 = getWeatherCondition(weather1.current.weatherCode, weather1.current.isDay).label;
        const cond2 = getWeatherCondition(weather2.current.weatherCode, weather2.current.isDay).label;
        const colder = temp1 < temp2 ? geo1.name : temp2 < temp1 ? geo2.name : 'Both are at equal temperature';

        let comparisonSummary = `Here is the current weather comparison between **${geo1.name}, ${geo1.country}** and **${geo2.name}, ${geo2.country}**:\n\n` +
          `• **${geo1.name}**: ${temp1}°C (${cond1}), Humidity: ${weather1.current.relativeHumidity}%, Wind: ${Math.round(weather1.current.windSpeed)} km/h\n` +
          `• **${geo2.name}**: ${temp2}°C (${cond2}), Humidity: ${weather2.current.relativeHumidity}%, Wind: ${Math.round(weather2.current.windSpeed)} km/h\n\n` +
          `**Analysis**: ${colder === 'Both are at equal temperature' ? 'Both locations currently record identical temperatures.' : `**${colder}** is currently colder by ${Math.abs(temp1 - temp2)}°C.`}`;

        return {
          response: {
            answer: comparisonSummary,
            contextPeriod: 'Live Dual-Station Telemetry',
            resolvedLocation: `${geo1.name} & ${geo2.name}`,
          },
          updatedContext: {
            ...context,
            lastLocation: { latitude: geo1.latitude, longitude: geo1.longitude, name: geo1.name, country: geo1.country },
          },
        };
      } catch (err: any) {
        return {
          response: {
            answer: `Unable to retrieve comparison telemetry due to a network or service issue: ${err.message || 'Service unreachable'}. Please try again shortly.`,
            contextPeriod: 'Service Error',
            isError: true,
          },
          updatedContext: context,
        };
      }
    }
  }

  // --- SINGLE LOCATION RESOLUTION ---
  let targetLocation: WeatherCoordinates | null = null;
  let targetName = extractedLocations[0];

  // If user explicitly asks about "my location", "here", "current location"
  const asksCurrentLocation = lowerQ.includes('my city') || lowerQ.includes('my location') || lowerQ.includes('here') || lowerQ.includes('current location');

  if (asksCurrentLocation) {
    targetLocation = currentAppWeather.location;
  } else if (targetName) {
    // Geocode targetName via Open-Meteo
    try {
      const geoResults = await searchLocations(targetName);
      if (geoResults.length === 0) {
        return {
          response: {
            answer: `I could not find "${targetName}" in the global meteorological geocoding database. Please check the spelling or add the country (e.g., "Paris, France").`,
            contextPeriod: 'Geocoding Resolution',
            isError: true,
          },
          updatedContext: context,
        };
      }
      const top = geoResults[0];
      targetLocation = {
        name: top.name,
        country: top.country,
        admin1: top.admin1,
        latitude: top.latitude,
        longitude: top.longitude,
        timezone: top.timezone,
      };
    } catch (err: any) {
      return {
        response: {
          answer: `Geocoding request failed: ${err.message || 'Network error'}. Please try again.`,
          contextPeriod: 'Network Fault',
          isError: true,
        },
        updatedContext: context,
      };
    }
  } else if (context.lastLocation) {
    // Follow-up question preserving previous conversation location! (e.g., "What about tomorrow?", "Is it raining?")
    targetLocation = context.lastLocation;
  } else {
    // Default to the current city shown in the app, or New Delhi if unselected
    targetLocation = currentAppWeather?.location || {
      name: 'New Delhi',
      country: 'India',
      admin1: 'Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 'Asia/Kolkata',
    };
  }

  // Fetch live weather data for target location
  let weatherData: ProcessedWeatherData;
  try {
    // If targetLocation matches current active app weather exactly, reuse it to save a roundtrip
    if (
      Math.abs(targetLocation.latitude - currentAppWeather.location.latitude) < 0.01 &&
      Math.abs(targetLocation.longitude - currentAppWeather.location.longitude) < 0.01
    ) {
      weatherData = currentAppWeather;
    } else {
      weatherData = await fetchWeatherData(targetLocation);
    }
  } catch (err: any) {
    return {
      response: {
        answer: `Unable to retrieve atmospheric readings for ${targetLocation.name}: ${err.message || 'API error'}. Please try again later.`,
        contextPeriod: 'Telemetry Error',
        isError: true,
      },
      updatedContext: context,
    };
  }

  // Generate intelligent, grounded answer according to intent
  const current = weatherData.current;
  const today = weatherData.daily[0];
  const tomorrow = weatherData.daily[1];
  const next24 = weatherData.hourly.slice(0, 24);
  const locationLabel = `${weatherData.location.name}${weatherData.location.country ? `, ${weatherData.location.country}` : ''}`;

  let answerText = '';
  let periodLabel = 'Current Conditions';

  // --- SPECIALIZED INTENT: RAIN IN NEXT X HOURS (e.g. "Will it rain in the next 3 hours?", "rain in next 4 hours") ---
  const nextHoursMatch = lowerQ.match(/next\s+(\d+)\s+hours?\s*(?:rain|precipitation)?/i) ||
                        (lowerQ.includes('rain') && lowerQ.match(/in\s+(?:the\s+)?(\d+)\s+hours?/i));
  if (lowerQ.includes('rain') && nextHoursMatch) {
    const hoursCount = Math.min(Math.max(parseInt(nextHoursMatch[1], 10), 1), 24);
    const windowSlice = next24.slice(0, hoursCount);
    const rainHours = windowSlice.filter(h => h.precipitationProbability >= 30 || h.precipitation >= 0.1);

    if (rainHours.length > 0) {
      const peakProb = Math.max(...rainHours.map(h => h.precipitationProbability));
      const firstRain = rainHours[0];
      const rainTime = new Date(firstRain.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const totalAccum = Math.round(rainHours.reduce((sum, h) => sum + (h.precipitation || 0), 0) * 10) / 10;
      
      answerText = `Yes, rain is expected in **${locationLabel}** within the next ${hoursCount} hours.\n\n` +
        `• **Earliest Rain**: Around **${rainTime}**\n` +
        `• **Peak Rain Probability**: **${peakProb}%**\n` +
        `• **Expected Accumulation**: ~${totalAccum}mm\n` +
        `• **Precautions**: Carry an umbrella or waterproof outerwear. Roads and footpaths will become slick.`;
      periodLabel = `Next ${hoursCount} Hours Rain Window`;
    } else {
      const maxProb = Math.max(...windowSlice.map(h => h.precipitationProbability), 0);
      answerText = `No rain is expected in **${locationLabel}** over the next ${hoursCount} hours.\n\n` +
        `• **Precipitation Probability**: Capped at **${maxProb}%**\n` +
        `• **Conditions**: Atmospheric moisture remains below condensation thresholds. Outdoor commutes and plans are clear.`;
      periodLabel = `Next ${hoursCount} Hours Clear Window`;
    }
  }
  // --- SPECIALIZED INTENT: OUTFIT & CLOTHING RECOMMENDATIONS ---
  // e.g. "What should I wear to college today?", "Suggest an outfit for rainy weather", "What should I wear tomorrow morning?", "Suggest a formal outfit for today's weather"
  else if (
    lowerQ.includes('wear') ||
    lowerQ.includes('outfit') ||
    lowerQ.includes('clothes') ||
    lowerQ.includes('clothing') ||
    lowerQ.includes('jacket') ||
    lowerQ.includes('raincoat') ||
    lowerQ.includes('dress')
  ) {
    let targetStyle: OutfitStyle = 'casual';
    if (lowerQ.includes('college') || lowerQ.includes('campus') || lowerQ.includes('university')) {
      targetStyle = 'college';
    } else if (lowerQ.includes('formal') || lowerQ.includes('office') || lowerQ.includes('work') || lowerQ.includes('business') || lowerQ.includes('meeting')) {
      targetStyle = 'formal';
    } else if (lowerQ.includes('sport') || lowerQ.includes('gym') || lowerQ.includes('run') || lowerQ.includes('workout')) {
      targetStyle = 'sportswear';
    } else if (lowerQ.includes('traditional') || lowerQ.includes('ethnic') || lowerQ.includes('kurta')) {
      targetStyle = 'traditional';
    }

    // Determine target slot & forecast data
    let targetSlot: 'now' | 'morning' | 'afternoon' | 'evening' = 'now';
    let targetSlotLabel = 'Today';
    let targetTemp = current.temperature;
    let targetApparent = current.apparentTemperature;
    let targetWeatherCode = current.weatherCode;
    let targetPrecipProb = next24[0]?.precipitationProbability ?? 0;
    let targetPrecip = current.precipitation;
    let targetWind = current.windSpeed;
    let targetUv = current.uvIndex;
    let targetRh = current.relativeHumidity;
    let targetIsDay = current.isDay;

    if (temporal.isTomorrow || lowerQ.includes('tomorrow')) {
      targetSlotLabel = 'Tomorrow';
      if (lowerQ.includes('morning')) {
        targetSlot = 'morning';
        targetSlotLabel = 'Tomorrow Morning';
      } else if (lowerQ.includes('evening') || lowerQ.includes('night')) {
        targetSlot = 'evening';
        targetSlotLabel = 'Tomorrow Evening';
      } else {
        targetSlot = 'afternoon';
        targetSlotLabel = 'Tomorrow Daytime';
      }
      if (tomorrow) {
        targetTemp = targetSlot === 'morning' ? tomorrow.temperatureMin : tomorrow.temperatureMax;
        targetApparent = targetSlot === 'morning' ? tomorrow.apparentTemperatureMin : tomorrow.apparentTemperatureMax;
        targetWeatherCode = tomorrow.weatherCode;
        targetPrecipProb = tomorrow.precipitationProbabilityMax;
        targetPrecip = tomorrow.precipitationSum;
        targetWind = tomorrow.windSpeedMax;
        targetUv = tomorrow.uvIndexMax;
      }
    } else if (lowerQ.includes('morning')) {
      targetSlot = 'morning';
      targetSlotLabel = 'This Morning';
      const morningH = next24.find(h => new Date(h.time).getHours() >= 7 && new Date(h.time).getHours() <= 10) || next24[0];
      targetTemp = morningH.temperature;
      targetApparent = morningH.apparentTemperature;
      targetWeatherCode = morningH.weatherCode;
      targetPrecipProb = morningH.precipitationProbability;
      targetPrecip = morningH.precipitation;
      targetWind = morningH.windSpeed;
      targetUv = morningH.uvIndex;
      targetRh = morningH.relativeHumidity;
      targetIsDay = true;
    } else if (lowerQ.includes('evening') || lowerQ.includes('tonight')) {
      targetSlot = 'evening';
      targetSlotLabel = 'This Evening';
      const eveningH = next24.find(h => new Date(h.time).getHours() >= 18 && new Date(h.time).getHours() <= 21) || next24[next24.length - 1];
      targetTemp = eveningH.temperature;
      targetApparent = eveningH.apparentTemperature;
      targetWeatherCode = eveningH.weatherCode;
      targetPrecipProb = eveningH.precipitationProbability;
      targetPrecip = eveningH.precipitation;
      targetWind = eveningH.windSpeed;
      targetUv = eveningH.uvIndex;
      targetRh = eveningH.relativeHumidity;
      targetIsDay = false;
    }

    const outfit = generateOutfitForSlot(
      targetSlot,
      targetSlotLabel,
      {
        temperature: targetTemp,
        apparentTemperature: targetApparent,
        weatherCode: targetWeatherCode,
        precipitationProbability: targetPrecipProb,
        precipitation: targetPrecip,
        windSpeed: targetWind,
        uvIndex: targetUv,
        relativeHumidity: targetRh,
        isDay: targetIsDay,
      },
      { style: targetStyle, preferredPalette: 'neutral' }
    );

    const styleName = targetStyle.charAt(0).toUpperCase() + targetStyle.slice(1);
    answerText = `Here is your customized **${styleName} Outfit Recommendation** for **${locationLabel}** (${targetSlotLabel}):\n\n` +
      `• **Ensemble**: **${outfit.combinationTitle}**\n` +
      `• **Topwear**: ${outfit.topWear.join(', ')}\n` +
      `• **Bottomwear**: ${outfit.bottomWear.join(', ')}\n` +
      (outfit.outerwear ? `• **Outerwear / Layers**: ${outfit.outerwear.join(', ')}\n` : '') +
      `• **Footwear**: ${outfit.footwear.join(', ')}\n` +
      (outfit.accessories.length > 0 ? `• **Essential Accessories**: ${outfit.accessories.join(', ')}\n` : '') +
      `• **Fabrics & Weaves**: ${outfit.fabricRecommendation}\n\n` +
      `**Meteorological Justification**: Projected conditions are **${Math.round(outfit.temperature)}°C** (feels like ${Math.round(outfit.apparentTemperature)}°C), ${outfit.conditionLabel}, with a **${outfit.rainProbability}%** chance of rain. ${outfit.whyItWorks}`;

    periodLabel = `${styleName} Outfit (${targetSlotLabel})`;
  }
  // 1. SPECIFIC HOUR (e.g. "What will the temperature in Toronto be at 6 PM?")
  else if (temporal.specificHour !== null) {
    // Find the hourly item in the target location's timeline
    const targetHour = temporal.specificHour;
    const hourItem = next24.find(h => new Date(h.time).getHours() === targetHour);

    if (hourItem) {
      const cond = getWeatherCondition(hourItem.weatherCode, hourItem.isDay).label;
      const formattedTime = new Date(hourItem.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      answerText = `In **${locationLabel}**, at **${formattedTime}** (local time), the projected temperature is **${Math.round(hourItem.temperature)}°C** (feels like ${Math.round(hourItem.apparentTemperature)}°C) with ${cond.toLowerCase()}. Precipitation probability will be ${hourItem.precipitationProbability}%.`;
      periodLabel = `Target Time: ${formattedTime}`;
    } else {
      answerText = `In **${locationLabel}**, forecast for the requested hour indicates temperatures around ${Math.round(current.temperature)}°C with ${getWeatherCondition(current.weatherCode, true).label}.`;
      periodLabel = 'Hourly Forecast';
    }
  }
  // 2. 7-DAY / WEEKLY FORECAST (e.g. "Give me the seven-day forecast for Cape Town")
  else if (temporal.isSevenDay) {
    const dailyLines = weatherData.daily.slice(0, 7).map(d => {
      const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const cond = getWeatherCondition(d.weatherCode, true).label;
      return `• **${dayName}**: High ${Math.round(d.temperatureMax)}°C / Low ${Math.round(d.temperatureMin)}°C — ${cond} (Rain: ${d.precipitationProbabilityMax}%)`;
    }).join('\n');

    answerText = `Here is the **7-Day Synoptic Forecast** for **${locationLabel}**:\n\n${dailyLines}`;
    periodLabel = '7-Day Synoptic Outlook';
  }
  // 3. TOMORROW FORECAST (e.g. "What will the weather be like in Paris tomorrow?", "Will it rain in New York tomorrow?")
  else if (temporal.isTomorrow) {
    periodLabel = 'Tomorrow';
    if (!tomorrow) {
      answerText = `Forecast for tomorrow in **${locationLabel}** projects highs of ${Math.round(today.temperatureMax)}°C and lows of ${Math.round(today.temperatureMin)}°C.`;
    } else {
      const cond = getWeatherCondition(tomorrow.weatherCode, true).label;
      if (lowerQ.includes('rain') || lowerQ.includes('precipitation')) {
        const rainLikely = tomorrow.precipitationProbabilityMax >= 40;
        answerText = rainLikely
          ? `Yes, rain is anticipated in **${locationLabel}** tomorrow. Precipitation probability reaches **${tomorrow.precipitationProbabilityMax}%** with estimated total accumulation of ${tomorrow.precipitationSum}mm.`
          : `Rain is unlikely in **${locationLabel}** tomorrow. The maximum precipitation probability is **${tomorrow.precipitationProbabilityMax}%**, with generally ${cond.toLowerCase()}.`;
      } else {
        answerText = `Tomorrow in **${locationLabel}**, expect **${cond}**. Temperatures will range from an overnight low of **${Math.round(tomorrow.temperatureMin)}°C** to a daytime high of **${Math.round(tomorrow.temperatureMax)}°C** (apparent peak: ${Math.round(tomorrow.apparentTemperatureMax)}°C). Maximum precipitation probability is ${tomorrow.precipitationProbabilityMax}%, and peak wind gusts will reach ${Math.round(tomorrow.windSpeedMax)} km/h.`;
      }
    }
  }
  // 4. HUMIDITY QUERY (e.g. "What is the humidity in Bangkok?")
  else if (lowerQ.includes('humidity') || lowerQ.includes('moisture') || lowerQ.includes('dew')) {
    answerText = `The relative humidity in **${locationLabel}** is currently **${current.relativeHumidity}%**. Ambient temperature is ${Math.round(current.temperature)}°C with surface barometric pressure at ${Math.round(current.surfacePressure)} hPa.`;
    periodLabel = 'Current Atmosphere';
  }
  // 5. WIND QUERY (e.g. "How strong is the wind in Sydney?")
  else if (lowerQ.includes('wind') || lowerQ.includes('gust') || lowerQ.includes('breeze')) {
    answerText = `Wind speed in **${locationLabel}** is currently measured at **${Math.round(current.windSpeed)} km/h** (${formatWind(current.windSpeed, 'mph')}) coming from direction ${current.windDirection}°. Today's peak gusts are forecast up to ${Math.round(today?.windSpeedMax ?? current.windSpeed)} km/h.`;
    periodLabel = 'Wind Telemetry';
  }
  // 6. RAIN QUERY (e.g. "Will it rain in Dubai this evening?", "Is it likely to rain in Mumbai over the next three hours?")
  else if (lowerQ.includes('rain') || lowerQ.includes('precipitation') || lowerQ.includes('umbrella') || lowerQ.includes('shower')) {
    const rainHours = next24.filter(h => h.precipitationProbability >= 35);
    if (rainHours.length > 0) {
      const times = rainHours.slice(0, 3).map(h => new Date(h.time).toLocaleTimeString([], { hour: 'numeric' })).join(', ');
      const maxProb = Math.max(...rainHours.map(h => h.precipitationProbability));
      answerText = `Rain is possible in **${locationLabel}** over the next 24 hours. The highest likelihood occurs around **${times}**, with precipitation probability peaking at **${maxProb}%**. Total precipitation today is estimated at ${today?.precipitationSum ?? 0}mm.`;
    } else {
      answerText = `No significant precipitation is expected in **${locationLabel}** over the next 24 hours. Rain probability remains low (maximum ${Math.max(...next24.map(h => h.precipitationProbability))}%), and skies are primarily ${getWeatherCondition(current.weatherCode, current.isDay).label.toLowerCase()}.`;
    }
    periodLabel = 'Precipitation Envelope';
  }
  // 7. TEMPERATURE QUERY (e.g. "What is the temperature in London right now?", "Tell me the current temperature in Tokyo, Japan")
  else if (lowerQ.includes('temperature') || lowerQ.includes('temp') || lowerQ.includes('colder') || lowerQ.includes('hotter')) {
    const cond = getWeatherCondition(current.weatherCode, current.isDay).label;
    answerText = `The current temperature in **${locationLabel}** is **${Math.round(current.temperature)}°C** (${formatTemp(current.temperature, 'fahrenheit')}), with a "feels-like" apparent temperature of **${Math.round(current.apparentTemperature)}°C**. Today's diurnal range is between ${Math.round(today?.temperatureMin ?? current.temperature)}°C and ${Math.round(today?.temperatureMax ?? current.temperature)}°C under ${cond.toLowerCase()}.`;
    periodLabel = 'Live Temperature';
  }
  // 8. GENERAL WEATHER OVERVIEW (e.g. "What is the weather in New York?", "Tell me about the weather in London")
  else {
    const cond = getWeatherCondition(current.weatherCode, current.isDay);
    answerText = `In **${locationLabel}**, current conditions are **${cond.label}** (${cond.description}). The temperature is **${Math.round(current.temperature)}°C** (feels like ${Math.round(current.apparentTemperature)}°C). Relative humidity is ${current.relativeHumidity}%, wind speeds are ${Math.round(current.windSpeed)} km/h, and today's high will reach ${Math.round(today?.temperatureMax ?? current.temperature)}°C with a ${today?.precipitationProbabilityMax ?? 0}% rain probability.`;
    periodLabel = 'Synoptic Overview';
  }

  return {
    response: {
      answer: answerText,
      contextPeriod: periodLabel,
      resolvedLocation: locationLabel,
    },
    updatedContext: {
      ...context,
      lastLocation: targetLocation,
    },
  };
}
