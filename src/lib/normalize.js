import { parseISO } from 'date-fns';

const clampSlice = (list = [], length) => list.slice(0, length);

const convertWindSpeed = (value, units) => {
  if (value == null) return value;
  if (units === 'metric') {
    return Math.round(value * 3.6 * 10) / 10; // convert m/s to km/h
  }
  return Math.round(value * 10) / 10; // already mph from API when imperial
};

const toPercent = (value, scale = 100) => {
  if (value == null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.round(numeric * scale);
};

const openMeteoDescriptions = new Map([
  ['0', 'Clear sky'],
  ['1', 'Mainly clear'],
  ['2', 'Partly cloudy'],
  ['3', 'Overcast'],
  ['45', 'Fog'],
  ['48', 'Depositing rime fog'],
  ['51', 'Light drizzle'],
  ['53', 'Moderate drizzle'],
  ['55', 'Dense drizzle'],
  ['56', 'Freezing drizzle'],
  ['57', 'Dense freezing drizzle'],
  ['61', 'Slight rain'],
  ['63', 'Moderate rain'],
  ['65', 'Heavy rain'],
  ['66', 'Light freezing rain'],
  ['67', 'Heavy freezing rain'],
  ['71', 'Slight snow fall'],
  ['73', 'Moderate snow fall'],
  ['75', 'Heavy snow fall'],
  ['77', 'Snow grains'],
  ['80', 'Rain showers'],
  ['81', 'Heavy rain showers'],
  ['82', 'Violent rain showers'],
  ['85', 'Snow showers'],
  ['86', 'Heavy snow showers'],
  ['95', 'Thunderstorm'],
  ['96', 'Thunderstorm with hail'],
  ['99', 'Thunderstorm with heavy hail'],
]);

export function normalizeOpenWeather(payload, context = {}) {
  const { units = 'metric', lat, lon, name, country } = context;
  const currentWeather = payload.current?.weather?.[0] ?? {};

  return {
    provider: 'openweather',
    fetchedAt: Date.now(),
    units,
    location: {
      lat: lat ?? payload.lat,
      lon: lon ?? payload.lon,
      name: name ?? '',
      country: country ?? '',
    },
    timezone: {
      name: payload.timezone,
      offset: payload.timezone_offset,
    },
    current: {
      dt: payload.current?.dt,
      temp: payload.current?.temp,
      feelsLike: payload.current?.feels_like,
      description: currentWeather.description ?? '',
      iconCode: String(currentWeather.id ?? ''),
      humidity: payload.current?.humidity,
      windSpeed: convertWindSpeed(payload.current?.wind_speed, units),
      pressure: payload.current?.pressure,
      precipitationProbability: toPercent(payload.hourly?.[0]?.pop),
      sunrise: payload.current?.sunrise,
      sunset: payload.current?.sunset,
    },
    hourly: clampSlice(payload.hourly ?? [], 24).map((hour) => {
      const weather = hour.weather?.[0] ?? {};
      return {
        dt: hour.dt,
        temp: hour.temp,
        feelsLike: hour.feels_like,
        humidity: hour.humidity,
        windSpeed: convertWindSpeed(hour.wind_speed, units),
        pressure: hour.pressure,
        iconCode: String(weather.id ?? ''),
        description: weather.description ?? '',
        precipitationProbability: toPercent(hour.pop),
      };
    }),
    daily: clampSlice(payload.daily ?? [], 7).map((day) => {
      const weather = day.weather?.[0] ?? {};
      return {
        dt: day.dt,
        tempMin: day.temp?.min,
        tempMax: day.temp?.max,
        iconCode: String(weather.id ?? ''),
        description: weather.description ?? '',
        precipitationProbability: toPercent(day.pop),
        sunrise: day.sunrise,
        sunset: day.sunset,
      };
    }),
  };
}

export function normalizeOpenMeteo(payload, context = {}) {
  const { units = 'metric', lat, lon, name, country } = context;
  const hourly = [];
  const limit = Math.min(payload.hourly?.time?.length ?? 0, 48);

  for (let i = 0; i < limit; i += 1) {
    const ts = payload.hourly.time[i];
    if (!ts) continue;
    const code = payload.hourly.weathercode?.[i];
    const probability = payload.hourly.precipitation_probability?.[i];
    hourly.push({
      dt: Math.floor(parseISO(ts).getTime() / 1000),
      temp: payload.hourly.temperature_2m?.[i],
      feelsLike: payload.hourly.temperature_2m?.[i],
      humidity: payload.hourly.relative_humidity_2m?.[i],
      windSpeed: payload.hourly.wind_speed_10m?.[i],
      pressure: null,
      iconCode: 'om-' + (code ?? payload.current_weather?.weathercode ?? ''),
      description: openMeteoDescriptions.get(String(code)) ?? '',
      precipitationProbability: toPercent(probability, 1),
    });
  }

  const currentTs = payload.current_weather?.time
    ? Math.floor(parseISO(payload.current_weather.time).getTime() / 1000)
    : null;

  const matchingHour = hourly.find((h) => h.dt === currentTs);

  const sunriseList = payload.daily?.sunrise ?? [];
  const sunsetList = payload.daily?.sunset ?? [];
  const firstSunrise = sunriseList[0] ? Math.floor(parseISO(sunriseList[0]).getTime() / 1000) : null;
  const firstSunset = sunsetList[0] ? Math.floor(parseISO(sunsetList[0]).getTime() / 1000) : null;

  return {
    provider: 'open-meteo',
    fetchedAt: Date.now(),
    units,
    location: {
      lat: lat ?? payload.latitude,
      lon: lon ?? payload.longitude,
      name: name ?? '',
      country: country ?? '',
    },
    timezone: {
      name: payload.timezone,
      offset: payload.utc_offset_seconds,
    },
    current: {
      dt: currentTs,
      temp: payload.current_weather?.temperature,
      feelsLike: payload.current_weather?.temperature,
      description: openMeteoDescriptions.get(String(payload.current_weather?.weathercode ?? '')) ?? '',
      iconCode: 'om-' + (payload.current_weather?.weathercode ?? ''),
      humidity: matchingHour?.humidity ?? null,
      windSpeed: payload.current_weather?.windspeed,
      pressure: matchingHour?.pressure ?? null,
      precipitationProbability: matchingHour?.precipitationProbability ?? null,
      sunrise: firstSunrise,
      sunset: firstSunset,
    },
    hourly: clampSlice(hourly, 24),
    daily: clampSlice(payload.daily?.time ?? [], 7).map((date, index) => {
      const code = payload.daily.weathercode?.[index];
      const probability = payload.daily.precipitation_probability_max?.[index];
      return {
        dt: Math.floor(parseISO(date).getTime() / 1000),
        tempMin: payload.daily.temperature_2m_min?.[index],
        tempMax: payload.daily.temperature_2m_max?.[index],
        iconCode: 'om-' + (code ?? ''),
        description: openMeteoDescriptions.get(String(code)) ?? '',
        precipitationProbability: toPercent(probability, 1),
        sunrise: sunriseList[index] ? Math.floor(parseISO(sunriseList[index]).getTime() / 1000) : null,
        sunset: sunsetList[index] ? Math.floor(parseISO(sunsetList[index]).getTime() / 1000) : null,
      };
    }),
  };
}
