import { addSeconds, format, fromUnixTime, isValid } from 'date-fns';

const icon = (symbol, label) => ({ icon: symbol, label });

const THUNDER = icon('TS', 'Thunderstorm');
const DRIZZLE = icon('DZ', 'Drizzle');
const RAIN = icon('RA', 'Rain');
const HEAVY_RAIN = icon('RA', 'Heavy rain');
const SNOW = icon('SN', 'Snow');
const SLEET = icon('SL', 'Sleet');
const FOG = icon('FG', 'Fog');
const CLEAR = icon('SUN', 'Clear sky');
const FEW_CLOUDS = icon('SUN+', 'Few clouds');
const CLOUDY = icon('CLD', 'Clouds');

const openWeatherGroups = [
  { match: (code) => code >= 200 && code < 300, ...THUNDER },
  { match: (code) => code >= 300 && code < 400, ...DRIZZLE },
  { match: (code) => code >= 500 && code < 600, ...RAIN },
  { match: (code) => code >= 600 && code < 700, ...SNOW },
  { match: (code) => code >= 700 && code < 800, ...FOG },
  { match: (code) => code === 800, ...CLEAR },
  { match: (code) => code > 800, ...CLOUDY },
];

const openMeteoCodes = {
  '0': CLEAR,
  '1': FEW_CLOUDS,
  '2': CLOUDY,
  '3': CLOUDY,
  '45': FOG,
  '48': FOG,
  '51': DRIZZLE,
  '53': DRIZZLE,
  '55': DRIZZLE,
  '56': RAIN,
  '57': RAIN,
  '61': RAIN,
  '63': RAIN,
  '65': HEAVY_RAIN,
  '66': RAIN,
  '67': HEAVY_RAIN,
  '71': SNOW,
  '73': SNOW,
  '75': SNOW,
  '77': SNOW,
  '80': RAIN,
  '81': HEAVY_RAIN,
  '82': HEAVY_RAIN,
  '85': SNOW,
  '86': SNOW,
  '95': THUNDER,
  '96': THUNDER,
  '99': THUNDER,
};

const normalizeOpenWeatherCode = (code) => {
  const numeric = Number(code);
  if (!Number.isFinite(numeric)) return { icon: '--', label: '' };
  return openWeatherGroups.find((group) => group.match(numeric)) ?? { icon: '--', label: '' };
};

const normalizeOpenMeteoCode = (code) => openMeteoCodes[String(code)] ?? { icon: '--', label: '' };

export function describeCondition(code) {
  if (code === null || code === undefined) return '';
  const key = String(code);
  if (key.startsWith('om-')) {
    return normalizeOpenMeteoCode(key.replace('om-', '')).label;
  }
  return normalizeOpenWeatherCode(key).label;
}

export function pickIcon(code) {
  if (code === null || code === undefined) return '--';
  const key = String(code);
  if (key.startsWith('om-')) {
    return normalizeOpenMeteoCode(key.replace('om-', '')).icon;
  }
  return normalizeOpenWeatherCode(key).icon;
}

const offsetDate = (unix, offset = 0) => {
  if (!unix && unix !== 0) return null;
  const date = addSeconds(fromUnixTime(unix), offset);
  return isValid(date) ? date : null;
};

export function toDayName(unix, offset = 0) {
  const date = offsetDate(unix, offset);
  return date ? format(date, 'EEE') : '';
}

export function toHourLabel(unix, offset = 0) {
  const date = offsetDate(unix, offset);
  return date ? format(date, 'haaa') : '';
}

export function formatTemp(value, units = 'metric', options = { signed: false }) {
  if (value == null || Number.isNaN(value)) return '--';
  const rounded = options.signed ? Math.round(value) : Math.round(value * 10) / 10;
  const suffix = units === 'imperial' ? 'F' : 'C';
  return `${rounded}°${suffix}`;
}

export function formatSpeed(value, units = 'metric') {
  if (value == null || Number.isNaN(value)) return '--';
  const rounded = Math.round(value);
  return `${rounded} ${units === 'imperial' ? 'mph' : 'km/h'}`;
}

export function formatPressure(value) {
  if (value == null || Number.isNaN(value)) return '--';
  return `${Math.round(value)} hPa`;
}

export function formatHumidity(value) {
  if (value == null || Number.isNaN(value)) return '--';
  return `${Math.round(value)}%`;
}

export function formatProbability(value) {
  if (value == null || Number.isNaN(value)) return '--';
  const bounded = Math.min(100, Math.max(0, Math.round(value)));
  return `${bounded}%`;
}

export function formatTimestamp(unix, offset = 0) {
  const date = offsetDate(unix, offset);
  return date ? format(date, 'MMM d, p') : '';
}

export function formatRelativeTimestamp(ms) {
  if (!ms) return '';
  const date = new Date(ms);
  if (!isValid(date)) return '';
  return format(date, 'MMM d, p');
}

export function cacheKeyForCity(city, units) {
  const slug = city?.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'unknown';
  return `weather-cache-${slug}-${units}`;
}

export function cacheKeyForCoords(lat, lon, units) {
  const latKey = typeof lat === 'number' ? lat.toFixed(2) : lat;
  const lonKey = typeof lon === 'number' ? lon.toFixed(2) : lon;
  return `weather-cache-${latKey}-${lonKey}-${units}`;
}

export function isCacheFresh(timestamp, ttlMinutes = 15) {
  if (!timestamp) return false;
  const ttlMs = ttlMinutes * 60 * 1000;
  return Date.now() - timestamp < ttlMs;
}

export function upsertRecentSearches(list, entry) {
  const next = [entry, ...(list?.filter((item) => item.toLowerCase() !== entry.toLowerCase()) ?? [])];
  return next.slice(0, 5);
}
