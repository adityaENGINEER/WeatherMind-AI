import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  WeatherCoordinates,
  ProcessedWeatherData,
  UserPreferences,
  WeatherAlertItem,
  AIInsightItem,
  AIPredictionSuite,
  DailyOutfitPlan,
  OutfitPreferences,
} from './types/weather';
import { fetchWeatherData, reverseGeocode } from './services/weatherService';
import { generateWeatherInsights } from './services/forecastInsightsService';
import { fetchWeatherAlerts } from './services/weatherAlertsService';
import { buildAIPredictionSuite } from './services/aiPredictionService';
import {
  loadOutfitPreferences,
  saveOutfitPreferences,
  buildDailyOutfitPlan,
} from './services/outfitService';
import { calculateLocationDayNight } from './services/themeService';
import {
  isNotificationSupported,
  getNotificationPermission,
  isNotificationEnabledInPreferences,
  requestNotificationPermission,
  disableNotifications,
  triggerSmartAlertNotification,
} from './services/notificationService';
import {
  loadUserPreferences,
  saveUserPreferences,
  loadFavoriteCities,
  saveFavoriteCities,
  loadRecentSearches,
  addRecentSearch,
  loadSelectedLocation,
  saveSelectedLocation,
  DEFAULT_LOCATION,
} from './services/preferencesService';
import { getWeatherCondition } from './utils/weatherUtils';

// Components
import { AtmosphericBackdrop } from './components/AtmosphericBackdrop';
import { Navbar } from './components/Navbar';
import { WeatherHero } from './components/WeatherHero';
import { HourlyTimeline } from './components/HourlyTimeline';
import { WeeklyForecast } from './components/WeeklyForecast';
import { WeatherAnalytics } from './components/WeatherAnalytics';
import { WeatherMap } from './components/WeatherMap';
import { SunTracker } from './components/SunTracker';
import { WeatherInsights } from './components/WeatherInsights';
import { WeatherAlertsSection } from './components/WeatherAlertsSection';
import { AIPredictionDashboard } from './components/AIPredictionDashboard';
import { AIOutfitPlanner } from './components/AIOutfitPlanner';
import { AIWeatherAssistant } from './components/AIWeatherAssistant';
import { FavoriteCitiesSection } from './components/FavoriteCitiesSection';
import { Footer } from './components/Footer';
import { LoadingState, ErrorState } from './components/States';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export function App() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadUserPreferences);
  const [favoriteCities, setFavoriteCities] = useState<WeatherCoordinates[]>(loadFavoriteCities);
  const [recentSearches, setRecentSearches] = useState<WeatherCoordinates[]>(loadRecentSearches);

  // Default location: New Delhi, India
  const [currentLocation, setCurrentLocation] = useState<WeatherCoordinates>(() => {
    return DEFAULT_LOCATION;
  });

  const [weather, setWeather] = useState<ProcessedWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Geolocation banner message (Success, Timeout, Denied, Error)
  const [locationNotice, setLocationNotice] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Weather Alerts and Insights
  const [alerts, setAlerts] = useState<WeatherAlertItem[]>([]);
  const [alertsSource, setAlertsSource] = useState<string>('Standard Meteorological Telemetry');
  const [isAlertsSupported, setIsAlertsSupported] = useState<boolean>(true);
  const [insights, setInsights] = useState<AIInsightItem[]>([]);
  const [predictionSuite, setPredictionSuite] = useState<AIPredictionSuite | null>(null);

  // AI Outfit Recommendation state & preferences
  const [outfitPreferences, setOutfitPreferences] = useState<OutfitPreferences>(loadOutfitPreferences);
  const [outfitPlan, setOutfitPlan] = useState<DailyOutfitPlan | null>(null);

  // Notification states
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(getNotificationPermission);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(isNotificationEnabledInPreferences);

  // Request ID to prevent race conditions from concurrent network fetches
  const currentRequestId = useRef<number>(0);

  // Load weather when currentLocation changes
  const loadWeather = useCallback(async (location: WeatherCoordinates) => {
    const requestId = ++currentRequestId.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchWeatherData(location);

      // Verify this response is for the latest request before setting state
      if (requestId !== currentRequestId.current) {
        return;
      }

      setWeather(data);
      saveSelectedLocation(location);
      addRecentSearch(location);
      setRecentSearches(loadRecentSearches());

      // Compute deterministic insights
      const computedInsights = generateWeatherInsights(data);
      setInsights(computedInsights);

      // Compute Daily Outfit Plan based on live forecasts
      const computedOutfits = buildDailyOutfitPlan(data, outfitPreferences);
      setOutfitPlan(computedOutfits);

      // Fetch alerts
      const alertFeed = await fetchWeatherAlerts(data);
      if (requestId === currentRequestId.current) {
        setAlerts(alertFeed.alerts);
        setAlertsSource(alertFeed.sourceName);
        setIsAlertsSupported(alertFeed.isFeedSupported);

        // Build comprehensive AI Prediction Suite
        const suite = buildAIPredictionSuite(data, alertFeed.alerts);
        setPredictionSuite(suite);

        // Trigger smart notifications if enabled
        triggerSmartAlertNotification(suite);
      }
    } catch (err: any) {
      if (requestId === currentRequestId.current) {
        console.error('Failed to load weather:', err);
        setErrorMessage(err?.message || 'Failed to connect to weather data service');
      }
    } finally {
      if (requestId === currentRequestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadWeather(currentLocation);
  }, [currentLocation, loadWeather]);

  // Automatic periodic refresh every 10 minutes to sync forecast data
  useEffect(() => {
    const interval = setInterval(() => {
      loadWeather(currentLocation);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentLocation, loadWeather]);

  // Notification request handler
  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(getNotificationPermission());
    setNotificationsEnabled(granted);
    if (granted && predictionSuite) {
      triggerSmartAlertNotification(predictionSuite);
      setLocationNotice({
        type: 'success',
        message: 'Browser smart alerts enabled! You will be alerted before forecast rain and severe hazards.',
      });
    } else if (!granted) {
      setLocationNotice({
        type: 'warning',
        message: 'Browser notification access was not granted. Check your browser site settings.',
      });
    }
  };

  const handleDisableNotifications = () => {
    disableNotifications();
    setNotificationsEnabled(false);
    setLocationNotice({
      type: 'info',
      message: 'Browser weather notifications have been muted.',
    });
  };

  // Update outfit preferences and recalculate plan
  const handleUpdateOutfitPreferences = (updated: OutfitPreferences) => {
    setOutfitPreferences(updated);
    saveOutfitPreferences(updated);
    if (weather) {
      const recalculated = buildDailyOutfitPlan(weather, updated);
      setOutfitPlan(recalculated);
    }
  };

  // Request browser GPS position only when explicitly clicked by user
  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      setLocationNotice({
        type: 'warning',
        message: 'Geolocation is not supported by your browser. Please search for your city manually.',
      });
      return;
    }

    setIsGpsLoading(true);
    setLocationNotice({
      type: 'info',
      message: 'Requesting permission to access your device location coordinates...',
    });

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const geoResult = await reverseGeocode(lat, lon);

          const gpsCoords: WeatherCoordinates = {
            latitude: lat,
            longitude: lon,
            name: geoResult.name,
            country: geoResult.country,
            admin1: geoResult.admin1,
          };

          setCurrentLocation(gpsCoords);
          setLocationNotice({
            type: 'success',
            message: `Live location detected: ${geoResult.name}, ${geoResult.country}. Weather grid updated!`,
          });
        } catch (e: any) {
          console.error(e);
          // Fallback coordinate object if reverse geocoding is delayed
          const fallbackCoords: WeatherCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            name: 'Your Current Location',
            country: 'GPS Detected',
          };
          setCurrentLocation(fallbackCoords);
          setLocationNotice({
            type: 'success',
            message: 'Detected live coordinates. Retrieving hyper-local numerical weather...',
          });
        } finally {
          setIsGpsLoading(false);
        }
      },
      error => {
        setIsGpsLoading(false);
        console.warn('Geolocation denied or unavailable', error);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationNotice({
            type: 'warning',
            message: 'Location access was denied. You can enable location in your browser site settings, or search for any city.',
          });
        } else if (error.code === error.TIMEOUT) {
          setLocationNotice({
            type: 'warning',
            message: 'Location request timed out. Please try clicking "Use My Location" again or search for your city.',
          });
        } else {
          setLocationNotice({
            type: 'warning',
            message: 'Could not determine your physical coordinates. Continuing with currently selected city.',
          });
        }
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  // Reset to permanent Default City (New Delhi, India)
  const handleResetToDefault = () => {
    setCurrentLocation(DEFAULT_LOCATION);
    setLocationNotice({
      type: 'info',
      message: 'Switched back to default station: New Delhi, India.',
    });
  };

  // Auto-dismiss location notice after 6 seconds
  useEffect(() => {
    if (locationNotice) {
      const timer = setTimeout(() => {
        setLocationNotice(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [locationNotice]);

  // Preference updates
  const handleToggleTempUnit = () => {
    const updated: UserPreferences = {
      ...preferences,
      tempUnit: preferences.tempUnit === 'celsius' ? 'fahrenheit' : 'celsius',
    };
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  const handleToggleWindUnit = () => {
    const units: Array<UserPreferences['windUnit']> = ['kmh', 'mph', 'ms'];
    const nextIdx = (units.indexOf(preferences.windUnit) + 1) % units.length;
    const updated: UserPreferences = {
      ...preferences,
      windUnit: units[nextIdx],
    };
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  const handleToggleTimeFormat = () => {
    const updated: UserPreferences = {
      ...preferences,
      timeFormat: preferences.timeFormat === '12h' ? '24h' : '12h',
    };
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  // Favorite toggle for currently active city
  const isCurrentFavorite = favoriteCities.some(
    c => Math.abs(c.latitude - currentLocation.latitude) < 0.01 &&
         Math.abs(c.longitude - currentLocation.longitude) < 0.01
  );

  const handleToggleFavorite = () => {
    let updated: WeatherCoordinates[];
    if (isCurrentFavorite) {
      updated = favoriteCities.filter(
        c => !(Math.abs(c.latitude - currentLocation.latitude) < 0.01 &&
               Math.abs(c.longitude - currentLocation.longitude) < 0.01)
      );
    } else {
      updated = [...favoriteCities, currentLocation];
    }
    setFavoriteCities(updated);
    saveFavoriteCities(updated);
  };

  const handleRemoveFavorite = (city: WeatherCoordinates) => {
    const updated = favoriteCities.filter(
      c => !(Math.abs(c.latitude - city.latitude) < 0.01 &&
             Math.abs(c.longitude - city.longitude) < 0.01)
    );
    setFavoriteCities(updated);
    saveFavoriteCities(updated);
  };

  const scrollToSection = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Atmospheric condition and automatic location-based solar time calculations
  const currentAtmosphere = weather
    ? getWeatherCondition(weather.current.weatherCode, weather.current.isDay).atmosphere
    : 'clear';

  // Calculate day/night based on location's timezone, sunrise and sunset
  const solarInfo = calculateLocationDayNight(weather);
  const isDay = solarInfo.isDay;
  const activeThemeClass = solarInfo.theme === 'day' ? 'theme-day' : 'theme-night';

  // Synchronize theme class to <html> and <body> elements for full page consistency
  useEffect(() => {
    const rootEl = document.documentElement;
    const bodyEl = document.body;
    if (solarInfo.theme === 'day') {
      rootEl.classList.add('theme-day');
      rootEl.classList.remove('theme-night');
      bodyEl.classList.add('theme-day');
      bodyEl.classList.remove('theme-night');
    } else {
      rootEl.classList.add('theme-night');
      rootEl.classList.remove('theme-day');
      bodyEl.classList.add('theme-night');
      bodyEl.classList.remove('theme-day');
    }
  }, [solarInfo.theme]);

  return (
    <div className={`min-h-screen ${activeThemeClass} bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col relative selection:bg-amber-500/30 selection:text-amber-900 transition-colors duration-700`}>
      {/* Immersive Animated Backdrop */}
      <AtmosphericBackdrop
        atmosphere={currentAtmosphere}
        isDay={isDay}
        reducedMotion={preferences.reducedMotion}
      />

      {/* Sticky Top Navbar */}
      <Navbar
        tempUnit={preferences.tempUnit}
        onToggleTempUnit={handleToggleTempUnit}
        windUnit={preferences.windUnit}
        onToggleWindUnit={handleToggleWindUnit}
        timeFormat={preferences.timeFormat}
        onToggleTimeFormat={handleToggleTimeFormat}
        activeAlertCount={alerts.length}
        onScrollTo={scrollToSection}
        isFavorite={isCurrentFavorite}
        onToggleFavorite={handleToggleFavorite}
        solarInfo={solarInfo}
      />

      {/* Geolocation Feedback Banner */}
      {locationNotice && (
        <div className="w-full max-w-none px-4 sm:px-8 lg:px-12 xl:px-16 pt-3 z-40 relative animate-in fade-in slide-in-from-top-2">
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium border shadow-lg backdrop-blur-xl ${
              locationNotice.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : locationNotice.type === 'warning'
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
                : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {locationNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{locationNotice.message}</span>
            </div>
            <button
              onClick={() => setLocationNotice(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 w-full">
        {isLoading && !weather && <LoadingState />}

        {errorMessage && !weather && (
          <ErrorState
            error={errorMessage}
            onRetry={() => loadWeather(currentLocation)}
          />
        )}

        {weather && (
          <>
            {/* Hero Section */}
            <WeatherHero
              weather={weather}
              tempUnit={preferences.tempUnit}
              windUnit={preferences.windUnit}
              timeFormat={preferences.timeFormat}
              onSelectCity={setCurrentLocation}
              recentSearches={recentSearches}
              favoriteCities={favoriteCities}
              onRequestCurrentLocation={handleRequestGps}
              isLoadingLocation={isGpsLoading}
              onExploreClick={() => scrollToSection('forecast-timeline')}
              onResetToDefault={handleResetToDefault}
            />

            {/* Weather Alerts Banner if active */}
            <WeatherAlertsSection
              alerts={alerts}
              sourceName={alertsSource}
              isFeedSupported={isAlertsSupported}
            />

            {/* AI Weather Prediction & Hazard Intelligence Dashboard */}
            {predictionSuite && (
              <AIPredictionDashboard
                suite={predictionSuite}
                tempUnit={preferences.tempUnit}
                timeFormat={preferences.timeFormat}
                notificationsEnabled={notificationsEnabled}
                onRequestNotifications={handleRequestNotifications}
                onDisableNotifications={handleDisableNotifications}
                notificationPermission={notificationPermission}
              />
            )}

            {/* AI-Powered Outfit Recommendation & Daily Planner */}
            {outfitPlan && (
              <AIOutfitPlanner
                weather={weather}
                outfitPlan={outfitPlan}
                preferences={outfitPreferences}
                onUpdatePreferences={handleUpdateOutfitPreferences}
                tempUnit={preferences.tempUnit}
              />
            )}

            {/* Hourly Timeline */}
            <HourlyTimeline
              hourly={weather.hourly}
              tempUnit={preferences.tempUnit}
              timeFormat={preferences.timeFormat}
            />

            {/* 7-Day Synoptic Forecast */}
            <WeeklyForecast
              daily={weather.daily}
              tempUnit={preferences.tempUnit}
            />

            {/* 24-Hour Analytics Dashboard */}
            <WeatherAnalytics
              weather={weather}
              tempUnit={preferences.tempUnit}
            />

            {/* Interactive Leaflet Radar Map */}
            <WeatherMap
              location={weather.location}
              weather={weather}
              tempUnit={preferences.tempUnit}
            />

            {/* Sun Tracker & Solar Arc + Insights Grid */}
            <div className="w-full max-w-none px-4 sm:px-8 lg:px-12 xl:px-16 py-6 z-10 relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5">
                  <SunTracker
                    today={weather.daily[0]}
                    currentTimeIso={weather.current.time}
                  />
                </div>
                <div className="lg:col-span-7">
                  <WeatherInsights insights={insights} />
                </div>
              </div>
            </div>

            {/* AI Weather Assistant Section */}
            <AIWeatherAssistant weather={weather} />

            {/* Favorite Cities Grid */}
            {favoriteCities.length > 0 && (
              <FavoriteCitiesSection
                favorites={favoriteCities}
                currentLocation={weather.location}
                onSelectCity={setCurrentLocation}
                onRemoveFavorite={handleRemoveFavorite}
                tempUnit={preferences.tempUnit}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
