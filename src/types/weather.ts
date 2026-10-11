export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
  timezone?: string;
  displayName?: string;
  locality?: string;
  category?: string; // e.g. 'university', 'landmark', 'city', 'suburb', etc.
  precision?: 'exact' | 'locality' | 'region';
}

export interface CurrentWeatherState {
  time: string;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  windSpeed: number;
  windDirection: number;
  surfacePressure: number;
  uvIndex: number;
  visibility: number;
  isDay: boolean;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  relativeHumidity: number;
  windSpeed: number;
  uvIndex: number;
  cloudCover: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax: number;
  apparentTemperatureMin: number;
  sunrise: string;
  sunset: string;
  daylightDuration: number; // in seconds
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  uvIndexMax: number;
}

export interface ProcessedWeatherData {
  location: WeatherCoordinates;
  current: CurrentWeatherState;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  elevation: number;
  timezone: string;
  timezoneAbbreviation: string;
  updatedAt: string;
}

export interface WeatherConditionInfo {
  label: string;
  description: string;
  icon: string;
  accentColor: string;
  atmosphere: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'fog';
}

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'kmh' | 'mph' | 'ms';
export type TimeFormat = '24h' | '12h';

export interface UserPreferences {
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
  timeFormat: TimeFormat;
  reducedMotion: boolean;
}

export interface GeocodingResult {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
  population?: number;
  displayName?: string;
  locality?: string;
  category?: string;
  precision?: 'exact' | 'locality' | 'region';
}

export interface WeatherAlertItem {
  id: string;
  senderName: string;
  event: string;
  start: string;
  end: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme' | 'advisory';
  source: string;
  isOfficial?: boolean;
  thresholdCategory?: 'wind' | 'rain' | 'convective' | 'thermal' | 'air_quality' | 'freeze';
  actionablePrecautions?: string[];
}

export interface SmartRainAlert {
  isRainExpected: boolean;
  startTime: string | null;
  endTime: string | null;
  timeWindowLabel: string;
  peakProbability: number;
  expectedPrecipitationMm: number;
  intensityCategory: 'none' | 'light' | 'moderate' | 'heavy' | 'violent';
  summary: string;
  hoursUntilStart: number | null;
  precautions: string[];
  hourlyRainProfile: Array<{
    time: string;
    probability: number;
    amountMm: number;
    condition: string;
  }>;
}

export interface AIWeatherPredictionItem {
  id: string;
  category: 'rain' | 'thunderstorm' | 'heavy_rain' | 'extreme_heat' | 'cold_wave' | 'strong_winds' | 'general';
  severity: 'normal' | 'advisory' | 'warning' | 'severe';
  title: string;
  timeframe: string;
  probability: number; // 0 - 100
  metricValue: string; // e.g. "41°C peak", "68 km/h gusts", "45mm"
  statusSummary: string;
  scientificReasoning: string;
  potentialImpact: string;
  precautions: string[];
  dataConfidence: 'high' | 'moderate' | 'low';
  forecastLimitationNote?: string;
  iconName: string;
}

export interface AIPredictionSuite {
  location: WeatherCoordinates;
  lastUpdated: string;
  forecastHorizonHours: number;
  smartRain: SmartRainAlert;
  predictions: AIWeatherPredictionItem[];
  officialWarnings: WeatherAlertItem[];
  atmosAdvisories: WeatherAlertItem[];
  modelAccuracyNote: string;
  overallSummary: string;
}

export interface AIInsightItem {
  id: string;
  title: string;
  category: 'activity' | 'clothing' | 'travel' | 'health' | 'alert';
  message: string;
  confidence: 'high' | 'moderate';
  supportingData: string;
  iconName: string;
  tone: 'info' | 'positive' | 'warning' | 'caution';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  contextPeriod?: string;
  isFallback?: boolean;
}

export type OutfitStyle = 'casual' | 'formal' | 'college' | 'sportswear' | 'traditional';

export interface OutfitPreferences {
  style: OutfitStyle;
  preferredPalette?: 'neutral' | 'vibrant' | 'earthy' | 'dark' | 'any';
  layeringPreference?: 'minimal' | 'moderate' | 'insulated';
}

export interface OutfitRecommendationItem {
  id: string;
  periodLabel: string; // "Current Conditions", "Morning (6 AM - 12 PM)", "Afternoon (12 PM - 5 PM)", "Evening (5 PM - 10 PM)"
  timeSlot: 'now' | 'morning' | 'afternoon' | 'evening';
  temperature: number;
  apparentTemperature: number;
  conditionLabel: string;
  conditionIcon: string;
  rainProbability: number;
  windSpeed: number;
  uvIndex: number;
  relativeHumidity: number;
  
  // Clothing Pieces
  topWear: string[];
  bottomWear: string[];
  outerwear?: string[];
  footwear: string[];
  accessories: string[];
  
  // Complete suggested ensemble title
  combinationTitle: string;
  
  // Explanations & Meta
  whyItWorks: string;
  colorPaletteAdvice: string[];
  comfortScore: number; // 0 - 100
  comfortRating: 'Optimal Comfort' | 'Slight Thermal Shift' | 'Extreme Precautions Advised' | 'Adverse Elements Alert';
  rainShieldRequired: boolean;
  sunProtectionRequired: boolean;
  coldShieldRequired: boolean;
  fabricRecommendation: string;
}

export interface DailyOutfitPlan {
  location: WeatherCoordinates;
  lastUpdated: string;
  currentOutfit: OutfitRecommendationItem;
  morningOutfit: OutfitRecommendationItem;
  afternoonOutfit: OutfitRecommendationItem;
  eveningOutfit: OutfitRecommendationItem;
  style: OutfitStyle;
  shiftAlert?: string; // e.g. "Notice: Significant 8°C drop and 65% rain surge expected by evening."
}


