import {
  ProcessedWeatherData,
  HourlyForecastItem,
  OutfitStyle,
  OutfitPreferences,
  OutfitRecommendationItem,
  DailyOutfitPlan,
} from '../types/weather';
import { getWeatherCondition, formatTemp } from '../utils/weatherUtils';

const OUTFIT_STORAGE_KEY = 'atmos_outfit_preferences';

export const DEFAULT_OUTFIT_PREFERENCES: OutfitPreferences = {
  style: 'casual',
  preferredPalette: 'neutral',
  layeringPreference: 'moderate',
};

export function loadOutfitPreferences(): OutfitPreferences {
  try {
    const raw = localStorage.getItem(OUTFIT_STORAGE_KEY);
    if (raw) return { ...DEFAULT_OUTFIT_PREFERENCES, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_OUTFIT_PREFERENCES;
}

export function saveOutfitPreferences(prefs: OutfitPreferences): void {
  try {
    localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

/**
 * Evaluates specific thermal and moisture parameters to generate an outfit recommendation
 */
export function generateOutfitForSlot(
  slot: 'now' | 'morning' | 'afternoon' | 'evening',
  slotLabel: string,
  weatherState: {
    temperature: number;
    apparentTemperature: number;
    weatherCode: number;
    precipitationProbability: number;
    precipitation: number;
    windSpeed: number;
    uvIndex: number;
    relativeHumidity: number;
    isDay: boolean;
  },
  preferences: OutfitPreferences
): OutfitRecommendationItem {
  const {
    temperature,
    apparentTemperature,
    weatherCode,
    precipitationProbability,
    precipitation,
    windSpeed,
    uvIndex,
    relativeHumidity,
    isDay,
  } = weatherState;

  const style = preferences.style || 'casual';
  const cond = getWeatherCondition(weatherCode, isDay);

  const isRain =
    precipitationProbability >= 35 ||
    precipitation >= 0.2 ||
    [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);

  const isHeavyRain =
    precipitation >= 2.5 ||
    precipitationProbability >= 70 ||
    [65, 82, 95, 96, 99].includes(weatherCode);

  const isFreezing = temperature <= 4 || apparentTemperature <= 2;
  const isCold = temperature > 4 && temperature <= 14;
  const isMild = temperature > 14 && temperature <= 22;
  const isWarm = temperature > 22 && temperature <= 30;
  const isHot = temperature > 30 || apparentTemperature >= 33;
  const isHighWind = windSpeed >= 30;
  const isHighUV = uvIndex >= 6 && isDay;

  // Assembly arrays
  const topWear: string[] = [];
  const bottomWear: string[] = [];
  const outerwear: string[] = [];
  const footwear: string[] = [];
  const accessories: string[] = [];
  const colorPaletteAdvice: string[] = [];

  let combinationTitle = '';
  let fabricRecommendation = '';
  let whyItWorks = '';

  // 1. STYLE-BASED CLOTHING COMPOSITION MATRIX
  switch (style) {
    case 'college':
      if (isFreezing || isCold) {
        topWear.push('Fleece-lined hoodie or crewneck sweatshirt', 'Heavyweight graphic tee');
        bottomWear.push('Thick denim jeans or corduroy pants');
        outerwear.push(isFreezing ? 'Insulated puffer jacket' : 'Varsity bomber jacket or padded overshirt');
        footwear.push('Warm high-top sneakers or durable combat boots');
        combinationTitle = 'Campus Heavy-Knit Layering';
        fabricRecommendation = 'Brushed fleece, thermal cotton, and heavyweight denim';
      } else if (isMild) {
        topWear.push('Relaxed cotton T-shirt with open flannel shirt');
        bottomWear.push('Classic blue jeans or relaxed-fit chinos');
        outerwear.push('Lightweight zip hoodie or denim trucker jacket');
        footwear.push('Casual canvas sneakers or skate shoes');
        combinationTitle = 'Casual Campus Layered Fit';
        fabricRecommendation = 'Medium-weight breathable cotton & soft twill';
      } else if (isWarm) {
        topWear.push('Breathable oversized cotton tee or polo');
        bottomWear.push('Relaxed cargo pants or light washed jeans');
        footwear.push('Low-top breathable sneakers');
        combinationTitle = 'Lightweight Campus Casuals';
        fabricRecommendation = '100% combed cotton and breathable poplin';
      } else {
        // Hot
        topWear.push('Ultra-lightweight airy cotton tee or short-sleeve button-down');
        bottomWear.push('Breathable linen trousers or cotton chinos');
        footwear.push('Cushioned slip-on canvas shoes or ventilated runners');
        combinationTitle = 'Heat-Resistant Campus Wear';
        fabricRecommendation = 'Airy linen, slub cotton, and moisture-wicking weaves';
      }
      break;

    case 'formal':
      if (isFreezing || isCold) {
        topWear.push('Crisp tailored dress shirt with fine merino wool sweater');
        bottomWear.push('Structured wool-blend formal trousers');
        outerwear.push(isFreezing ? 'Tailored wool overcoat or trench' : 'Single-breasted suit blazer');
        footwear.push('Leather oxford shoes or polished chelsea boots');
        combinationTitle = 'Executive Thermal Overcoat Ensemble';
        fabricRecommendation = 'Merino wool, worsted twill, and structured poplin';
      } else if (isMild) {
        topWear.push('Classic cotton pinpoint dress shirt');
        bottomWear.push('Tailored flat-front dress trousers');
        outerwear.push('Sharp tailored blazer or structured suit jacket');
        footwear.push('Polished leather oxfords or monk straps');
        combinationTitle = 'Sharp Executive Two-Piece Suit';
        fabricRecommendation = 'Egyptian cotton and fine-spun wool-linen blends';
      } else if (isWarm) {
        topWear.push('Lightweight long-sleeve cotton dress shirt (sleeves neatly rolled)');
        bottomWear.push('Slim-fit lightweight tropical wool or stretch cotton trousers');
        footwear.push('Polished leather loafers or dress brogues');
        combinationTitle = 'Business Light Formal Ensemble';
        fabricRecommendation = 'High-twist tropical wool and fine breathable cotton';
      } else {
        // Hot
        topWear.push('Crisp linen-cotton blend dress shirt');
        bottomWear.push('Ultra-lightweight formal tailored trousers');
        footwear.push('Breathable leather loafers with invisible socks');
        combinationTitle = 'Summer Executive Formal Wear';
        fabricRecommendation = 'Linen-cotton blends and breathable open-weave fabrics';
      }
      break;

    case 'sportswear':
      if (isFreezing || isCold) {
        topWear.push('Thermal compression base layer', 'Fleece-lined athletic quarter-zip');
        bottomWear.push('Thermal running joggers or wind-resistant training pants');
        outerwear.push('Wind-blocking sports softshell or hooded running jacket');
        footwear.push('All-weather running shoes with thermal moisture-wicking socks');
        combinationTitle = 'All-Weather Thermal Performance Kit';
        fabricRecommendation = 'Thermal fleece, brushed polyester, and elastane';
      } else if (isMild) {
        topWear.push('Moisture-wicking athletic tech T-shirt');
        bottomWear.push('Tapered athletic track pants or running tights');
        outerwear.push('Lightweight performance windbreaker');
        footwear.push('Cushioned athletic running shoes');
        combinationTitle = 'Dynamic Performance Tracksuit';
        fabricRecommendation = 'Moisture-wicking dry-fit poly-spandex blends';
      } else if (isWarm) {
        topWear.push('Breathable dry-fit short-sleeve tee or sports tank');
        bottomWear.push('Lightweight athletic shorts with compression liner or joggers');
        footwear.push('Ventilated mesh sports trainers');
        combinationTitle = 'Active Breathable Training Kit';
        fabricRecommendation = 'Micro-mesh, Dry-FIT polyester, and open-weave knit';
      } else {
        // Hot
        topWear.push('Ultra-breathable sleeveless singlet or perforated performance tee');
        bottomWear.push('Ventilated lightweight running shorts');
        footwear.push('Engineered mesh breathable sneakers');
        combinationTitle = 'High-Ventilation Athletic Gear';
        fabricRecommendation = 'Perforated cooling tech fabrics with rapid evaporation';
      }
      break;

    case 'traditional':
      if (isFreezing || isCold) {
        topWear.push('Long silk or khadi kurta paired with an embroidered Nehru/Modi jacket', 'Pashmina or wool shawl');
        bottomWear.push('Tailored churidar or comfortable pyjama trousers');
        outerwear.push('Woolen bandhgala or warm pashmina stole');
        footwear.push('Leather juttis or classic formal mojaris with socks');
        combinationTitle = 'Royal Winter Traditional Ensemble';
        fabricRecommendation = 'Raw silk, pashmina wool, and brocade weave';
      } else if (isMild) {
        topWear.push('Classic cotton-silk kurta with structured Nehru jacket');
        bottomWear.push('Linen-cotton pyjama or straight-fit churidar');
        footwear.push('Handcrafted leather juttis or leather sandals');
        combinationTitle = 'Refined Ethnic Day Ensemble';
        fabricRecommendation = 'Loomed cotton, silk blend, and spun khadi';
      } else if (isWarm) {
        topWear.push('Lightweight pure cotton short or knee-length kurta');
        bottomWear.push('Comfortable cotton pyjama or drawstring linen trousers');
        footwear.push('Open-toe leather kolhapuris or sandals');
        combinationTitle = 'Classic Cotton Ethnic Wear';
        fabricRecommendation = '100% fine mulmul cotton and breezy handloom weaves';
      } else {
        // Hot
        topWear.push('Breezy white or pastel mulmul cotton kurta');
        bottomWear.push('Airy loose-fit cotton drawstring pyjama');
        footwear.push('Breathable leather sandals or open kolhapuris');
        combinationTitle = 'Ultra-Cooling Summer Ethnic Fit';
        fabricRecommendation = 'Fine mulmul cotton and loose handwoven khadi';
      }
      break;

    case 'casual':
    default:
      if (isFreezing || isCold) {
        topWear.push('Thermal undershirt', 'Warm knit sweater or fleece hoodie');
        bottomWear.push('Heavy denim jeans or comfortable corduroy trousers');
        outerwear.push(isFreezing ? 'Down-insulated winter parka' : 'Quilted jacket or wool-blend coat');
        footwear.push('Ankle boots or cushioned high-top sneakers');
        combinationTitle = 'Cozy Multi-Layered Casual Ensemble';
        fabricRecommendation = 'Cable-knit wool, thermal jersey, and brushed denim';
      } else if (isMild) {
        topWear.push('Comfortable cotton crewneck T-shirt or long-sleeve henley');
        bottomWear.push('Classic blue/black denim jeans or casual chinos');
        outerwear.push('Lightweight cardigan, denim jacket, or casual zip jacket');
        footwear.push('Low-profile leather or canvas sneakers');
        combinationTitle = 'Smart Everyday Layered Casuals';
        fabricRecommendation = 'Mid-weight cotton, soft twill, and knit jersey';
      } else if (isWarm) {
        topWear.push('Breathable casual cotton T-shirt or polo shirt');
        bottomWear.push('Comfortable straight-leg chinos or light denim jeans');
        footwear.push('Casual walking sneakers or boat shoes');
        combinationTitle = 'Breezy Everyday Casuals';
        fabricRecommendation = '100% combed cotton, slub jersey, and washed twill';
      } else {
        // Hot
        topWear.push('Airy relaxed-fit cotton tee or linen shirt');
        bottomWear.push('Lightweight cotton chino pants or linen trousers');
        footwear.push('Ventilated sneakers or breathable slip-ons');
        combinationTitle = 'Heat-Wave Relaxed Casuals';
        fabricRecommendation = '100% lightweight linen, seersucker, and modal';
      }
      break;
  }

  // 2. WEATHER ACCESSORIES INJECTION
  if (isRain) {
    if (isHeavyRain) {
      outerwear.unshift('Waterproof hooded raincoat / storm shell');
      accessories.push('Sturdy windproof umbrella', 'Waterproof backpack sleeve');
      footwear.length = 0;
      footwear.push('Water-resistant shoes or all-weather rubberized boots');
    } else {
      accessories.push('Compact portable umbrella');
      outerwear.push('Water-repellent light jacket or wind shell');
    }
  }

  if (isHighWind) {
    accessories.push('Wind-blocking sunglasses / protective eyewear');
    if (!outerwear.some(o => o.toLowerCase().includes('wind'))) {
      outerwear.push('Windbreaker or structured jacket to resist gusts');
    }
  }

  if (isHighUV) {
    accessories.push('UV400 protective sunglasses', 'Broad-brimmed cap or hat');
  }

  if (isFreezing || isCold) {
    accessories.push('Warm woolen beanie', 'Insulating scarf', 'Touchscreen-compatible gloves');
  }

  if (isHot) {
    accessories.push('Polarized sunglasses', 'Breathable sun visor/cap', 'Reusable insulated water bottle');
  }

  // 3. COLOR PALETTE ADVICE
  const palette = preferences.preferredPalette || 'neutral';
  if (palette === 'dark') {
    colorPaletteAdvice.push('Charcoal Black', 'Deep Navy Blue', 'Dark Slate', 'Midnight Green');
  } else if (palette === 'vibrant') {
    colorPaletteAdvice.push('Cobalt Electric Blue', 'Warm Coral Red', 'Amber Gold', 'Emerald');
  } else if (palette === 'earthy') {
    colorPaletteAdvice.push('Warm Khaki', 'Olive Green', 'Terracotta Brown', 'Sand Beige');
  } else {
    // Neutral or Any
    if (isHot || isWarm) {
      colorPaletteAdvice.push('Off-White', 'Sky Blue', 'Light Sage', 'Soft Cream');
    } else {
      colorPaletteAdvice.push('Graphite Gray', 'Navy', 'Oatmeal Beige', 'Classic Black');
    }
  }

  // 4. SCIENTIFIC REASONING & COMFORT SCORE
  let comfortScore = 85;
  let comfortRating: OutfitRecommendationItem['comfortRating'] = 'Optimal Comfort';

  if (isRain) {
    comfortScore -= 15;
    comfortRating = 'Adverse Elements Alert';
    whyItWorks = `High rain likelihood (${precipitationProbability}%) requires water-resistant fabrics and reliable umbrella coverage to keep your inner layers dry during commutes.`;
  } else if (isFreezing) {
    comfortScore -= 20;
    comfortRating = 'Extreme Precautions Advised';
    whyItWorks = `Near-freezing temperatures (${Math.round(temperature)}°C, feels like ${Math.round(apparentTemperature)}°C) demand multi-layered insulating outerwear and extremity coverage (head, hands) to prevent wind-chill induced hypothermia.`;
  } else if (isHot) {
    comfortScore -= 15;
    comfortRating = 'Slight Thermal Shift';
    whyItWorks = `Sweltering ambient heat (${Math.round(temperature)}°C with relative humidity ${relativeHumidity}%) calls for loose-fitting, high-moisture evaporation fabrics that maximize body ventilation and prevent heat stress.`;
  } else if (isHighWind) {
    comfortScore -= 10;
    comfortRating = 'Slight Thermal Shift';
    whyItWorks = `Brisk wind velocities of ${Math.round(windSpeed)} km/h will accentuate the convective cooling factor. A wind-resistant outer layer is recommended.`;
  } else {
    comfortScore = 95;
    comfortRating = 'Optimal Comfort';
    whyItWorks = `Temperate ambient conditions (${Math.round(temperature)}°C, feels like ${Math.round(apparentTemperature)}°C) provide ideal comfort. Light, flexible layers provide maximum ease without thermal fatigue.`;
  }

  return {
    id: `outfit-${slot}-${Date.now()}`,
    periodLabel: slotLabel,
    timeSlot: slot,
    temperature: Math.round(temperature),
    apparentTemperature: Math.round(apparentTemperature),
    conditionLabel: cond.label,
    conditionIcon: cond.icon,
    rainProbability: precipitationProbability,
    windSpeed: Math.round(windSpeed),
    uvIndex: Math.round(uvIndex * 10) / 10,
    relativeHumidity,
    topWear,
    bottomWear,
    outerwear: outerwear.length > 0 ? outerwear : undefined,
    footwear,
    accessories,
    combinationTitle,
    whyItWorks,
    colorPaletteAdvice,
    comfortScore,
    comfortRating,
    rainShieldRequired: isRain,
    sunProtectionRequired: isHighUV,
    coldShieldRequired: isFreezing || isCold,
    fabricRecommendation,
  };
}

/**
 * Builds full Daily Outfit Planner across Morning, Afternoon, and Evening
 * by sampling hourly forecasts and detecting diurnal weather shifts
 */
export function buildDailyOutfitPlan(
  weather: ProcessedWeatherData,
  preferences: OutfitPreferences
): DailyOutfitPlan {
  const current = weather.current;
  const hourly = weather.hourly || [];
  const todayDateStr = new Date().toDateString();

  // Find today's hours or slice next 24h
  const next24 = hourly.slice(0, 24);

  // Helper to find representative hour item
  const findHourlyRepresentative = (startHour: number, endHour: number): HourlyForecastItem => {
    const candidate = next24.find(h => {
      const hr = new Date(h.time).getHours();
      return hr >= startHour && hr <= endHour;
    });
    return candidate || next24[0] || {
      time: current.time,
      temperature: current.temperature,
      apparentTemperature: current.apparentTemperature,
      weatherCode: current.weatherCode,
      precipitationProbability: 0,
      precipitation: 0,
      relativeHumidity: current.relativeHumidity,
      windSpeed: current.windSpeed,
      uvIndex: current.uvIndex,
      cloudCover: current.cloudCover,
      isDay: true,
    };
  };

  const morningHour = findHourlyRepresentative(7, 10);
  const afternoonHour = findHourlyRepresentative(13, 16);
  const eveningHour = findHourlyRepresentative(18, 21);

  // Current outfit
  const currentOutfit = generateOutfitForSlot(
    'now',
    'Current Real-Time Window',
    {
      temperature: current.temperature,
      apparentTemperature: current.apparentTemperature,
      weatherCode: current.weatherCode,
      precipitationProbability: (next24[0]?.precipitationProbability ?? 0),
      precipitation: current.precipitation,
      windSpeed: current.windSpeed,
      uvIndex: current.uvIndex,
      relativeHumidity: current.relativeHumidity,
      isDay: current.isDay,
    },
    preferences
  );

  // Morning outfit
  const morningOutfit = generateOutfitForSlot(
    'morning',
    'Morning Transit (07:00 – 11:30)',
    {
      temperature: morningHour.temperature,
      apparentTemperature: morningHour.apparentTemperature,
      weatherCode: morningHour.weatherCode,
      precipitationProbability: morningHour.precipitationProbability,
      precipitation: morningHour.precipitation,
      windSpeed: morningHour.windSpeed,
      uvIndex: morningHour.uvIndex,
      relativeHumidity: morningHour.relativeHumidity,
      isDay: true,
    },
    preferences
  );

  // Afternoon outfit
  const afternoonOutfit = generateOutfitForSlot(
    'afternoon',
    'Midday Peak (12:00 – 17:00)',
    {
      temperature: afternoonHour.temperature,
      apparentTemperature: afternoonHour.apparentTemperature,
      weatherCode: afternoonHour.weatherCode,
      precipitationProbability: afternoonHour.precipitationProbability,
      precipitation: afternoonHour.precipitation,
      windSpeed: afternoonHour.windSpeed,
      uvIndex: afternoonHour.uvIndex,
      relativeHumidity: afternoonHour.relativeHumidity,
      isDay: true,
    },
    preferences
  );

  // Evening outfit
  const eveningOutfit = generateOutfitForSlot(
    'evening',
    'Evening & Night (17:30 – 22:30)',
    {
      temperature: eveningHour.temperature,
      apparentTemperature: eveningHour.apparentTemperature,
      weatherCode: eveningHour.weatherCode,
      precipitationProbability: eveningHour.precipitationProbability,
      precipitation: eveningHour.precipitation,
      windSpeed: eveningHour.windSpeed,
      uvIndex: eveningHour.uvIndex,
      relativeHumidity: eveningHour.relativeHumidity,
      isDay: false,
    },
    preferences
  );

  // Diurnal Shift Notice check (e.g. rain onset, big thermal drop)
  let shiftAlert: string | undefined;
  const tempSwing = Math.abs(afternoonHour.temperature - eveningHour.temperature);
  const rainSurge = eveningHour.precipitationProbability - morningHour.precipitationProbability;

  if (rainSurge >= 35) {
    shiftAlert = `Diurnal Weather Shift: Rain probability escalates from ${morningHour.precipitationProbability}% in the morning to ${eveningHour.precipitationProbability}% by evening. Carry rain gear for the return commute!`;
  } else if (tempSwing >= 7) {
    shiftAlert = `Diurnal Thermal Shift: Temperature will shift by ~${Math.round(tempSwing)}°C between afternoon (${Math.round(afternoonHour.temperature)}°C) and evening (${Math.round(eveningHour.temperature)}°C). Multi-layered clothing is advised.`;
  }

  return {
    location: weather.location,
    lastUpdated: weather.updatedAt || new Date().toISOString(),
    currentOutfit,
    morningOutfit,
    afternoonOutfit,
    eveningOutfit,
    style: preferences.style,
    shiftAlert,
  };
}
