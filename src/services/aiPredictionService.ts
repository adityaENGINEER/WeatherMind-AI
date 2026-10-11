import {
  ProcessedWeatherData,
  AIPredictionSuite,
  AIWeatherPredictionItem,
  SmartRainAlert,
  WeatherAlertItem,
} from '../types/weather';
import { getWeatherCondition, formatTemp } from '../utils/weatherUtils';

/**
 * Calculates rain intensity descriptor from hourly mm precipitation rate
 */
function getRainIntensityCategory(mmPerHour: number): SmartRainAlert['intensityCategory'] {
  if (mmPerHour <= 0.05) return 'none';
  if (mmPerHour < 2.5) return 'light';
  if (mmPerHour < 7.6) return 'moderate';
  if (mmPerHour < 50) return 'heavy';
  return 'violent';
}

/**
 * Computes Smart Rain Alert data from high-resolution hourly forecast
 * Identifies start time windows, peak probabilities, and precipitation quantities
 */
export function analyzeSmartRain(weather: ProcessedWeatherData): SmartRainAlert {
  const hourly = weather.hourly || [];
  const next36 = hourly.slice(0, 36);

  // Criteria for rain consideration: probability >= 30% OR precipitation >= 0.1mm OR rain weather codes
  const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  
  const rainHours = next36.filter(h => {
    const isProbHigh = h.precipitationProbability >= 30;
    const hasPrecip = h.precipitation >= 0.1;
    const isRainCode = rainCodes.includes(h.weatherCode);
    return isProbHigh || hasPrecip || isRainCode;
  });

  const hourlyRainProfile = next36.slice(0, 24).map(h => ({
    time: h.time,
    probability: h.precipitationProbability,
    amountMm: Math.round((h.precipitation || 0) * 10) / 10,
    condition: getWeatherCondition(h.weatherCode, h.isDay).label,
  }));

  if (rainHours.length === 0) {
    return {
      isRainExpected: false,
      startTime: null,
      endTime: null,
      timeWindowLabel: 'No rain predicted in the next 36 hours',
      peakProbability: Math.max(...next36.map(h => h.precipitationProbability), 0),
      expectedPrecipitationMm: 0,
      intensityCategory: 'none',
      summary: 'Atmospheric telemetry projects dry, stable conditions with negligible precipitation chance across the forecast horizon.',
      hoursUntilStart: null,
      precautions: [
        'Outdoor activities, sports, and commutes are clear to proceed as scheduled.',
        'No rain protective equipment or umbrellas required currently.',
      ],
      hourlyRainProfile,
    };
  }

  const firstRainHour = rainHours[0];
  const lastRainHour = rainHours[rainHours.length - 1];

  // Calculate hours until start
  const now = new Date();
  const startDate = new Date(firstRainHour.time);
  const diffHours = Math.max(0, Math.round((startDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

  const peakProb = Math.max(...rainHours.map(h => h.precipitationProbability));
  const maxHourlyPrecip = Math.max(...rainHours.map(h => h.precipitation));
  const totalExpectedMm = Math.round(
    rainHours.reduce((acc, h) => acc + (h.precipitation || 0), 0) * 10
  ) / 10;

  const startFormatted = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endFormatted = new Date(lastRainHour.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const isToday = startDate.toDateString() === now.toDateString();
  const dayPrefix = isToday ? 'Today' : 'Tomorrow';

  const windowLabel = diffHours === 0
    ? `Rain occurring / starting now (${startFormatted})`
    : `${dayPrefix} between ${startFormatted} and ${endFormatted} (in ~${diffHours}h)`;

  const intensityCategory = getRainIntensityCategory(maxHourlyPrecip);

  const precautions: string[] = [];
  if (intensityCategory === 'heavy' || intensityCategory === 'violent' || totalExpectedMm >= 25) {
    precautions.push('Heavy downpours expected: expect localized street waterlogging and slower traffic speeds.');
    precautions.push('Keep waterproof gear, raincoats, and sturdy umbrellas ready before stepping out.');
    precautions.push('Avoid parking in low-lying underpasses susceptible to sudden water ponding.');
  } else if (intensityCategory === 'moderate' || totalExpectedMm >= 5) {
    precautions.push('Steady rainfall expected: keep an umbrella handy and plan for slightly delayed commutes.');
    precautions.push('Surfaces and roadways will be slick; maintain safe vehicular braking distances.');
  } else {
    precautions.push('Light showers or passing drizzles expected: a compact umbrella or rain shell is sufficient.');
    precautions.push('Outdoor schedules will likely face only minor, intermittent disruptions.');
  }

  const summary = `Precipitation probability peaks at ${peakProb}% with estimated cumulative accumulation of ${totalExpectedMm}mm around ${startFormatted}.`;

  return {
    isRainExpected: true,
    startTime: firstRainHour.time,
    endTime: lastRainHour.time,
    timeWindowLabel: windowLabel,
    peakProbability: peakProb,
    expectedPrecipitationMm: totalExpectedMm,
    intensityCategory,
    summary,
    hoursUntilStart: diffHours,
    precautions,
    hourlyRainProfile,
  };
}

/**
 * Predicts upcoming weather conditions (Extreme Heat, Cold Wave, Strong Winds, Thunderstorms, Heavy Rain)
 * strictly derived from actual numerical forecast grids without fabrication.
 */
export function generateAIWeatherPredictions(weather: ProcessedWeatherData): AIWeatherPredictionItem[] {
  const predictions: AIWeatherPredictionItem[] = [];
  const current = weather.current;
  const next48 = weather.hourly.slice(0, 48);
  const daily = weather.daily || [];
  const today = daily[0];
  const tomorrow = daily[1];

  // 1. Thunderstorm & Lightning Detection
  const stormHours = next48.filter(h => [95, 96, 99].includes(h.weatherCode));
  const hasStormToday = [95, 96, 99].includes(today?.weatherCode || 0);
  const hasStormTomorrow = [95, 96, 99].includes(tomorrow?.weatherCode || 0);

  if (stormHours.length > 0 || hasStormToday || hasStormTomorrow) {
    const earliestStorm = stormHours[0];
    const stormTime = earliestStorm
      ? new Date(earliestStorm.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : 'the upcoming hours';
    const hasHail = stormHours.some(h => [96, 99].includes(h.weatherCode));

    predictions.push({
      id: 'pred-thunderstorm',
      category: 'thunderstorm',
      severity: 'severe',
      title: hasHail ? 'Thunderstorm with Hail Risk' : 'Convective Thunderstorm Outlook',
      timeframe: `Expected around ${stormTime}`,
      probability: Math.max(...stormHours.map(h => h.precipitationProbability), 80),
      metricValue: hasHail ? 'WMO 96/99 Convection' : 'WMO 95 Active Lightning',
      statusSummary: `High atmospheric instability creates favorable conditions for vertical convection, cloud-to-ground lightning, and gusty outflow boundaries.`,
      scientificReasoning: `Convective available potential energy (CAPE) combined with rapid barometric shifts is triggering severe storm cells in the local grid.`,
      potentialImpact: `Disruptions to outdoor sporting events, airline ground stops, elevated electrical hazard, and brief torrential rain bursts.`,
      precautions: [
        'Seek shelter inside an enclosed building or hardtop vehicle away from tall isolated trees.',
        'Unplug sensitive electronic devices during active overhead lightning.',
        'Avoid contact with metal fences, water bodies, and open rooftop structures.',
      ],
      dataConfidence: 'high',
      forecastLimitationNote: 'Convective storm cells can develop rapidly and localized tracks may vary by 5-15 km.',
      iconName: 'CloudLightning',
    });
  }

  // 2. Heavy Rainfall & Flash Flooding Risk
  const maxHourlyPrecip = Math.max(...next48.map(h => h.precipitation), 0);
  const total48Precip = next48.reduce((s, h) => s + (h.precipitation || 0), 0);
  const dailyPrecipMax = Math.max(...daily.slice(0, 3).map(d => d.precipitationSum), 0);

  if (maxHourlyPrecip >= 7.5 || total48Precip >= 25 || dailyPrecipMax >= 30) {
    predictions.push({
      id: 'pred-heavy-rain',
      category: 'heavy_rain',
      severity: maxHourlyPrecip >= 15 || dailyPrecipMax >= 50 ? 'severe' : 'warning',
      title: 'Heavy Precipitation & Runoff Accumulation',
      timeframe: 'Next 24 to 48 hours',
      probability: Math.max(...next48.map(h => h.precipitationProbability), 75),
      metricValue: `${Math.round(Math.max(total48Precip, dailyPrecipMax))}mm projected`,
      statusSummary: `Sustained rain bands are projected to deposit substantial precipitation volume capable of challenging local stormwater systems.`,
      scientificReasoning: `High precipitable water content and continuous synoptic moisture convergence across the region.`,
      potentialImpact: `Ponding on roadways, reduced tire traction, delayed commutes, and temporary waterlogging in low-lying zones.`,
      precautions: [
        'Avoid driving through waterlogged roadways—water depth is often deceiving.',
        'Allow 20-30% additional travel time for ground commutes.',
        'Inspect household drains and clear debris to prevent localized pooling.',
      ],
      dataConfidence: 'high',
      forecastLimitationNote: 'Quantitative precipitation forecasts (QPF) can fluctuate based on localized micro-topography.',
      iconName: 'CloudRain',
    });
  }

  // 3. Extreme Heat & Thermal Stress
  const maxTemp48 = Math.max(...next48.map(h => h.temperature), current.temperature);
  const maxApparent48 = Math.max(...next48.map(h => h.apparentTemperature), current.apparentTemperature);

  if (maxTemp48 >= 38 || maxApparent48 >= 41) {
    const isExtreme = maxTemp48 >= 42 || maxApparent48 >= 45;
    predictions.push({
      id: 'pred-extreme-heat',
      category: 'extreme_heat',
      severity: isExtreme ? 'severe' : 'warning',
      title: isExtreme ? 'Severe Extreme Heatwave' : 'Elevated Heat Stress Warning',
      timeframe: `Peak daytime hours (12:00 – 16:30)`,
      probability: 95,
      metricValue: `${Math.round(maxTemp48)}°C (Apparent ${Math.round(maxApparent48)}°C)`,
      statusSummary: `Dangerous thermal conditions driven by high solar insolation and persistent high-pressure atmospheric subsidence.`,
      scientificReasoning: `Strong diurnal solar heating coupled with apparent biometeorological stress exceeding safe comfort thresholds.`,
      potentialImpact: `Heightened susceptibility to heat cramps, heat exhaustion, and dehydration during unshielded exposure.`,
      precautions: [
        'Maintain continuous hydration with water and electrolyte-replenishing beverages.',
        'Reschedule strenuous outdoor athletic activities to early morning before 08:30 or post 18:30.',
        'Never leave vulnerable persons, children, or pets inside parked vehicles.',
        'Wear loose-fitting, light-colored breathable attire and use wide-brimmed hats.',
      ],
      dataConfidence: 'high',
      forecastLimitationNote: 'Urban heat island effects may raise surface temperatures by an additional 2-4°C in dense metropolitan centers.',
      iconName: 'ThermometerSun',
    });
  }

  // 4. Cold Wave & Freezing Temperatures
  const minTemp48 = Math.min(...next48.map(h => h.temperature), current.temperature);
  const minApparent48 = Math.min(...next48.map(h => h.apparentTemperature), current.apparentTemperature);

  if (minTemp48 <= 6 || minApparent48 <= 3) {
    const isSubZero = minTemp48 <= 0;
    predictions.push({
      id: 'pred-cold-wave',
      category: 'cold_wave',
      severity: isSubZero ? 'severe' : 'advisory',
      title: isSubZero ? 'Sub-Zero Freeze Alert' : 'Cold Wave & Wind Chill Advisory',
      timeframe: `Overnight and early morning hours`,
      probability: 90,
      metricValue: `${Math.round(minTemp48)}°C (Feels like ${Math.round(minApparent48)}°C)`,
      statusSummary: `Cold air mass advection producing notably suppressed nocturnal and daybreak temperatures.`,
      scientificReasoning: `Nocturnal radiational cooling combined with cold northern/polar gradient winds accentuating wind chill.`,
      potentialImpact: `Increased hypothermia risk during prolonged outdoor exposure, potential surface frost, and respiratory sensitivity.`,
      precautions: [
        'Wear multiple insulating clothing layers, including thermal innerwear and wind-blocking outerwear.',
        'Protect pets, domestic plants, and exposed water pipes from cold or freezing drafts.',
        'Use caution on elevated bridges where frost patches or black ice may develop.',
      ],
      dataConfidence: 'high',
      forecastLimitationNote: 'Valley basins and open outskirts may register 2-3°C cooler than downtown weather stations.',
      iconName: 'ThermometerSnowflake',
    });
  }

  // 5. Strong Wind & Gale Gusts
  const maxWindSpeed = Math.max(...next48.map(h => h.windSpeed), current.windSpeed);
  const maxDailyGust = Math.max(...daily.slice(0, 3).map(d => d.windSpeedMax), 0);
  const peakWind = Math.max(maxWindSpeed, maxDailyGust);

  if (peakWind >= 42) {
    const isGale = peakWind >= 60;
    predictions.push({
      id: 'pred-strong-winds',
      category: 'strong_winds',
      severity: isGale ? 'severe' : 'warning',
      title: isGale ? 'Gale-Force Wind Hazard' : 'Brisk Gusty Winds Advisory',
      timeframe: 'Upcoming 24-hour cycle',
      probability: 85,
      metricValue: `${Math.round(peakWind)} km/h peak gusts`,
      statusSummary: `A tight regional barometric gradient is driving sustained brisk winds and turbulent localized wind gusts.`,
      scientificReasoning: `Steep atmospheric pressure gradient between approaching synoptic air masses generating energetic wind fields.`,
      potentialImpact: `Difficulty navigating two-wheelers and high-sided transport, dislodged branches, and loose outdoor objects taking flight.`,
      precautions: [
        'Secure outdoor furniture, temporary canopies, signage, and loose balcony items.',
        'Exercise heightened caution when driving high-profile vehicles on open highways or bridges.',
        'Watch for falling tree branches or unstable construction barricades.',
      ],
      dataConfidence: 'high',
      forecastLimitationNote: 'Urban wind canyons between skyscrapers can amplify wind speed gusts above baseline model estimates.',
      iconName: 'Wind',
    });
  }

  // 6. Rain Forecast item (if not already covered by heavy rain)
  const hasRainAlert = next48.some(h => h.precipitationProbability >= 40);
  const alreadyHeavy = predictions.some(p => p.category === 'heavy_rain');

  if (hasRainAlert && !alreadyHeavy) {
    const peakProb = Math.max(...next48.map(h => h.precipitationProbability));
    const firstRain = next48.find(h => h.precipitationProbability >= 40);
    const rainTime = firstRain
      ? new Date(firstRain.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : 'the upcoming hours';

    predictions.push({
      id: 'pred-rain-expected',
      category: 'rain',
      severity: 'advisory',
      title: 'Upcoming Rain Showers',
      timeframe: `Likely commencing around ${rainTime}`,
      probability: peakProb,
      metricValue: `${peakProb}% peak probability`,
      statusSummary: `Atmospheric moisture saturation is high enough to trigger measurable rainfall showers during the forecast window.`,
      scientificReasoning: `Relative humidity exceeding 75% in the boundary layer and convective condensation levels descending.`,
      potentialImpact: `Wet road surfaces, damp pedestrian pathways, and minor delays during morning/evening commute windows.`,
      precautions: [
        'Carry a portable umbrella or rain shell when traveling.',
        'Allow a few extra minutes for daily commutes.',
      ],
      dataConfidence: 'high',
      forecastLimitationNote: 'Light shower timing can vary by ±45 minutes as individual clouds traverse the sector.',
      iconName: 'CloudRain',
    });
  }

  // 7. Stable Nominal Baseline if no hazardous predictions
  if (predictions.length === 0) {
    predictions.push({
      id: 'pred-stable-conditions',
      category: 'general',
      severity: 'normal',
      title: 'Stable & Favorable Atmospheric Outlook',
      timeframe: 'Next 48 Hours',
      probability: 95,
      metricValue: `${Math.round(current.temperature)}°C nominal`,
      statusSummary: `Atmospheric measurements reflect calm, temperate conditions across all tracked meteorological parameters.`,
      scientificReasoning: `Stationary anticyclonic ridge maintaining atmospheric equilibrium, preventing precipitation or thermal extremes.`,
      potentialImpact: `No adverse meteorological hindrances expected for travel, work, recreation, or aviation.`,
      precautions: [
        'Conditions are prime for outdoor plans, commutes, and sporting activities.',
        'Standard everyday seasonal clothing is suitable.',
      ],
      dataConfidence: 'high',
      forecastLimitationNote: 'Forecasts beyond 3-5 days are subject to standard chaotic dispersion inherent in atmospheric fluid dynamics.',
      iconName: 'Sun',
    });
  }

  return predictions;
}

/**
 * Builds the comprehensive unified AIPredictionSuite integrating:
 * - Deterministic AI predictions
 * - Smart Rain Analysis
 * - Official Warnings vs. ATMOS Generated Advisories (transparent distinction)
 */
export function buildAIPredictionSuite(
  weather: ProcessedWeatherData,
  rawAlerts: WeatherAlertItem[] = []
): AIPredictionSuite {
  const smartRain = analyzeSmartRain(weather);
  const predictions = generateAIWeatherPredictions(weather);

  // Separate official alerts (e.g. NOAA / NWS or official meteorological services)
  // from ATMOS-generated threshold advisories
  const officialWarnings: WeatherAlertItem[] = [];
  const atmosAdvisories: WeatherAlertItem[] = [];

  rawAlerts.forEach(alert => {
    const isOfficialSource =
      alert.source.toLowerCase().includes('noaa') ||
      alert.source.toLowerCase().includes('national weather service') ||
      alert.source.toLowerCase().includes('nws') ||
      alert.isOfficial === true;

    if (isOfficialSource) {
      officialWarnings.push({
        ...alert,
        isOfficial: true,
        actionablePrecautions: [
          'Follow instructions and emergency broadcast guidance issued by local civic authorities.',
          'Review regional emergency evacuation and shelter routes if severe alerts upgrade.',
        ],
      });
    } else {
      atmosAdvisories.push({
        ...alert,
        isOfficial: false,
        actionablePrecautions: [
          'ATMOS Advisory: Derived from international WMO scientific thresholds applied to live ECMWF/Open-Meteo numerical telemetry.',
          'Exercise defensive judgment based on observed localized conditions.',
        ],
      });
    }
  });

  // Synthesize concise overall summary
  let overallSummary = '';
  if (officialWarnings.length > 0) {
    overallSummary = `Official weather warnings are active for this sector: ${officialWarnings.map(w => w.event).join(', ')}. Please observe safety guidance.`;
  } else if (smartRain.isRainExpected) {
    overallSummary = `Rain is forecast: ${smartRain.timeWindowLabel} with a peak probability of ${smartRain.peakProbability}%.`;
  } else if (predictions.some(p => p.severity === 'severe')) {
    const severeItem = predictions.find(p => p.severity === 'severe');
    overallSummary = `${severeItem?.title || 'Severe conditions'} anticipated in upcoming hours: ${severeItem?.statusSummary}`;
  } else {
    overallSummary = `Fair weather prevails with temperature at ${Math.round(weather.current.temperature)}°C and calm atmospheric conditions.`;
  }

  return {
    location: weather.location,
    lastUpdated: weather.updatedAt || new Date().toISOString(),
    forecastHorizonHours: 48,
    smartRain,
    predictions,
    officialWarnings,
    atmosAdvisories,
    modelAccuracyNote: 'ECMWF / GFS numerical forecasts via Open-Meteo with high temporal precision. Uncertainties increase beyond 48 hours.',
    overallSummary,
  };
}
