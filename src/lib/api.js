import axios from 'axios';
import { normalizeOpenWeather, normalizeOpenMeteo } from './normalize';

const OPENWEATHER_BASE = 'https://api.openweathermap.org';
const OPENMETEO_BASE = 'https://api.open-meteo.com';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim();

const openWeatherClient = axios.create({
  baseURL: OPENWEATHER_BASE,
  timeout: 10000,
});

const openMeteoClient = axios.create({
  baseURL: OPENMETEO_BASE,
  timeout: 10000,
});

const nominatimClient = axios.create({
  baseURL: NOMINATIM_BASE,
  timeout: 10000,
  headers: {
    'User-Agent': 'WeatherDashboard/1.0 (+https://openai.com)',
    Accept: 'application/json',
  },
});

export const hasOpenWeatherKey = Boolean(openWeatherKey);

export async function getCoordsByCity(city) {
  const query = city?.trim();
  if (!query) {
    throw new Error('Please enter a city name.');
  }

  if (hasOpenWeatherKey) {
    const { data } = await openWeatherClient.get('/data/2.5/weather', {
      params: {
        q: query,
        appid: openWeatherKey,
      },
    });

    return {
      lat: data.coord.lat,
      lon: data.coord.lon,
      name: data.name,
      country: data.sys?.country ?? '',
    };
  }

  const { data } = await nominatimClient.get('/search', {
    params: {
      q: query,
      format: 'jsonv2',
      limit: 1,
      addressdetails: 1,
    },
  });

  if (!data?.length) {
    throw new Error('Location not found.');
  }

  const match = data[0];

  return {
    lat: parseFloat(match.lat),
    lon: parseFloat(match.lon),
    name: match.name || match.display_name?.split(',')[0] || query,
    country: match.address?.country_code?.toUpperCase() ?? '',
  };
}

export async function getWeather(lat, lon, units = 'metric', context = {}) {
  if (lat == null || lon == null) {
    throw new Error('Missing coordinates.');
  }

  if (hasOpenWeatherKey) {
    try {
      const { data } = await openWeatherClient.get('/data/3.0/onecall', {
        params: {
          lat,
          lon,
          units,
          exclude: 'minutely,alerts',
          appid: openWeatherKey,
        },
      });

      return normalizeOpenWeather(data, { units, lat, lon, ...context });
    } catch (error) {
      console.warn('OpenWeather request failed, falling back to Open-Meteo.', error);
    }
  }

  const { data } = await openMeteoClient.get('/v1/forecast', {
    params: {
      latitude: lat,
      longitude: lon,
      hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode,precipitation_probability',
      daily: 'weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
      current_weather: true,
      timezone: 'auto',
      temperature_unit: units === 'imperial' ? 'fahrenheit' : 'celsius',
      wind_speed_unit: units === 'imperial' ? 'mph' : 'kmh',
    },
  });

  return normalizeOpenMeteo(data, { units, lat, lon, ...context });
}
