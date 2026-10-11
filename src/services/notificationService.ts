import { AIPredictionSuite } from '../types/weather';

const NOTIFICATION_PERMISSION_KEY = 'atmos_browser_notifications_enabled';
const LAST_NOTIFIED_KEY = 'atmos_last_notified_alert_ids';

/**
 * Checks if browser supports HTML5 notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission status ('granted' | 'denied' | 'default')
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Checks user preference stored in localStorage
 */
export function isNotificationEnabledInPreferences(): boolean {
  try {
    return localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Requests permission from browser and saves preference
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    try {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, granted ? 'true' : 'false');
    } catch {}
    return granted;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Disables notification preference
 */
export function disableNotifications(): void {
  try {
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'false');
  } catch {}
}

/**
 * Delivers browser notifications for new Smart Rain alerts or dangerous Weather Warnings.
 * Implements strict deduplication using cache keys to prevent duplicate notifications.
 */
export function triggerSmartAlertNotification(suite: AIPredictionSuite): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  if (!isNotificationEnabledInPreferences()) return;

  // Retrieve already notified keys
  let notifiedMap: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(LAST_NOTIFIED_KEY);
    if (raw) notifiedMap = JSON.parse(raw);
  } catch {}

  const now = Date.now();
  // Expire entries older than 6 hours
  Object.keys(notifiedMap).forEach(key => {
    if (now - notifiedMap[key] > 6 * 60 * 60 * 1000) {
      delete notifiedMap[key];
    }
  });

  const cityName = suite.location.name;

  // 1. Check Official Warnings
  if (suite.officialWarnings.length > 0) {
    suite.officialWarnings.forEach(w => {
      const alertKey = `official-${cityName}-${w.id}-${w.event}`;
      if (!notifiedMap[alertKey]) {
        notifiedMap[alertKey] = now;
        try {
          new Notification(`⚠️ Official Weather Warning: ${w.event} (${cityName})`, {
            body: w.description.slice(0, 160) + (w.description.length > 160 ? '...' : ''),
            icon: '/favicon.ico',
            tag: alertKey,
          });
        } catch (e) {
          console.warn('Notification trigger notice:', e);
        }
      }
    });
  }

  // 2. Check Severe ATMOS Advisories (Extreme heat, storms, gale)
  if (suite.atmosAdvisories.length > 0) {
    suite.atmosAdvisories
      .filter(a => a.severity === 'severe' || a.severity === 'extreme')
      .forEach(a => {
        const advKey = `atmos-${cityName}-${a.id}-${a.event}`;
        if (!notifiedMap[advKey]) {
          notifiedMap[advKey] = now;
          try {
            new Notification(`⚡ ATMOS Weather Advisory: ${a.event} (${cityName})`, {
              body: a.description.slice(0, 160) + (a.description.length > 160 ? '...' : ''),
              icon: '/favicon.ico',
              tag: advKey,
            });
          } catch (e) {
            console.warn('Notification trigger notice:', e);
          }
        }
      });
  }

  // 3. Check Smart Rain Alert (only if rain starts within 4 hours and peak probability >= 60%)
  const smartRain = suite.smartRain;
  if (
    smartRain.isRainExpected &&
    smartRain.hoursUntilStart !== null &&
    smartRain.hoursUntilStart <= 4 &&
    smartRain.peakProbability >= 60
  ) {
    const rainKey = `rain-${cityName}-${smartRain.startTime}-${smartRain.peakProbability}`;
    if (!notifiedMap[rainKey]) {
      notifiedMap[rainKey] = now;
      try {
        new Notification(`🌧️ Rain Alert for ${cityName}`, {
          body: `${smartRain.timeWindowLabel}. Probability: ${smartRain.peakProbability}% with ~${smartRain.expectedPrecipitationMm}mm expected precipitation.`,
          icon: '/favicon.ico',
          tag: rainKey,
        });
      } catch (e) {
        console.warn('Notification trigger notice:', e);
      }
    }
  }

  // Save updated cache
  try {
    localStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify(notifiedMap));
  } catch {}
}
