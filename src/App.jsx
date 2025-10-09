// README:
// npm install
// npm run dev
import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense, startTransition } from 'react';
import Toolbar from './components/Toolbar.jsx';
import CurrentCard from './components/CurrentCard.jsx';
import DailyGrid from './components/DailyGrid.jsx';
import ForecastHighlights from './components/ForecastHighlights.jsx';
import {
  cacheKeyForCity,
  cacheKeyForCoords,
  formatRelativeTimestamp,
  isCacheFresh,
  upsertRecentSearches,
} from './lib/utils.js';
import { getCoordsByCity, getWeather } from './lib/api.js';

const FALLBACK_CITY = 'Nairobi';

const HourlyChart = lazy(() => import('./components/HourlyChart.jsx'));

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('weather-theme') ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  const [units, setUnits] = useState(() => {
    if (typeof window === 'undefined') return 'metric';
    return localStorage.getItem('weather-units') ?? 'metric';
  });

  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const [activeTarget, setActiveTarget] = useState(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('weather-recent-searches') ?? '[]');
    } catch (err) {
      console.warn('Failed to parse recent searches', err);
      return [];
    }
  });

  const recentSearchesRef = useRef(recentSearches);
  useEffect(() => {
    recentSearchesRef.current = recentSearches;
  }, [recentSearches]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('weather-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('weather-units', units);
  }, [units]);

  const fetchWeather = useCallback(async ({ city, coords, label, preferCache = false }) => {
    if (!city && !coords) return null;

    const useCity = Boolean(city);
    const trimmedCity = city?.trim();
    let cacheKey = null;
    if (typeof window !== 'undefined') {
      cacheKey = useCity ? cacheKeyForCity(trimmedCity, units) : cacheKeyForCoords(coords.lat, coords.lon, units);
    }

    let cached = null;
    if (cacheKey && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          cached = JSON.parse(raw);
        }
      } catch (err) {
        console.warn('Failed to read cache', err);
      }
      if (cached?.data && isCacheFresh(cached.fetchedAt)) {
        startTransition(() => {
          setWeather(cached.data);
          setOffline(false);
        });
        if (preferCache) {
          return cached.data;
        }
      }
    }

    setLoading(true);
    setError(null);

    try {
      let resolvedCoords = coords;
      let resolvedMeta = { name: label ?? '', country: '' };

      if (!resolvedCoords && trimmedCity) {
        resolvedCoords = await getCoordsByCity(trimmedCity);
        resolvedMeta = { name: resolvedCoords.name, country: resolvedCoords.country };
      }

      if (!resolvedCoords) {
        throw new Error('We could not resolve that location.');
      }

      const normalized = await getWeather(resolvedCoords.lat, resolvedCoords.lon, units, resolvedMeta);
      const mergedLocation = {
        ...normalized.location,
        name: normalized.location.name || resolvedMeta.name || trimmedCity || label || '',
        country: normalized.location.country || resolvedMeta.country || '',
      };
      const enriched = { ...normalized, location: mergedLocation };

      startTransition(() => {
        setWeather(enriched);
        setOffline(false);
      });

      if (cacheKey && typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify({ fetchedAt: enriched.fetchedAt, data: enriched }));
      }

      if (useCity && mergedLocation.name) {
        const updated = upsertRecentSearches(recentSearchesRef.current, mergedLocation.name);
        recentSearchesRef.current = updated;
        startTransition(() => setRecentSearches(updated));
        if (typeof window !== 'undefined') {
          localStorage.setItem('weather-recent-searches', JSON.stringify(updated));
          localStorage.setItem('weather-last-query', mergedLocation.name);
        }
        startTransition(() => setQuery(mergedLocation.name));
        startTransition(() => setActiveTarget((prev) => {
          if (prev?.type === "city" && prev.value === mergedLocation.name) {
            return prev;
          }
          return { type: "city", value: mergedLocation.name };
        }));
      } else if (!useCity) {
        const labelName = mergedLocation.name || label || 'My location';
        if (mergedLocation.name) {
          const updated = upsertRecentSearches(recentSearchesRef.current, mergedLocation.name);
          recentSearchesRef.current = updated;
          startTransition(() => setRecentSearches(updated));
          if (typeof window !== 'undefined') {
            localStorage.setItem('weather-recent-searches', JSON.stringify(updated));
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('weather-last-query', labelName);
        }
        startTransition(() => setQuery(labelName));
        startTransition(() => setActiveTarget((prev) => {
          if (prev?.type === "coords" && prev.value?.lat === resolvedCoords.lat && prev.value?.lon === resolvedCoords.lon) {
            return prev;
          }
          return { type: "coords", value: resolvedCoords, label: labelName };
        }));
      }

      return enriched;
    } catch (err) {
      console.error(err);
      if (cached?.data) {
        startTransition(() => {
          setWeather(cached.data);
          setOffline(true);
        });
      }
      setError(err?.response?.data?.message ?? err.message ?? 'Unable to load weather right now.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [units]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (typeof window === 'undefined') return;
    const storedQuery = localStorage.getItem('weather-last-query') || FALLBACK_CITY;
    setQuery(storedQuery);
    setActiveTarget({ type: 'city', value: storedQuery });
    fetchWeather({ city: storedQuery, label: storedQuery, preferCache: true });
    // Idle prefetch for the chart chunk
    const idle = (cb) => (window.requestIdleCallback ? window.requestIdleCallback(cb) : setTimeout(cb, 1500));
    idle(() => import('./components/HourlyChart.jsx'));
  }, [fetchWeather]);

  useEffect(() => {
    if (!activeTarget) return;
    if (!initializedRef.current) return;
    if (activeTarget.type === "city") {
      fetchWeather({ city: activeTarget.value, label: activeTarget.value, preferCache: false });
    } else if (activeTarget.type === "coords") {
      fetchWeather({ coords: activeTarget.value, label: activeTarget.label, preferCache: false });
    }
  }, [activeTarget, fetchWeather, units]);

  const handleQueryChange = useCallback((value) => {
    setQuery(value);
  }, []);

  const handleDebouncedInput = useCallback((value) => {
    if (!value || typeof window === 'undefined') return;
    const key = cacheKeyForCity(value, units);
    try {
      const cachedRaw = localStorage.getItem(key);
      if (!cachedRaw) return;
      const cached = JSON.parse(cachedRaw);
      if (cached?.data && isCacheFresh(cached.fetchedAt)) {
        setWeather(cached.data);
        setOffline(false);
      }
    } catch (err) {
      console.warn('Failed to hydrate from cache', err);
    }
  }, [units]);

  const handleSearchSubmit = useCallback((input) => {
    const value = (typeof input === 'string' ? input : query).trim();
    if (!value) return;
    fetchWeather({ city: value, label: value, preferCache: false });
  }, [fetchWeather, query]);

  const handleSelectSuggestion = useCallback((city) => {
    if (!city) return;
    fetchWeather({ city, label: city, preferCache: false });
  }, [fetchWeather]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleUnitChange = useCallback((nextUnits) => {
    setUnits((prev) => (prev === nextUnits ? prev : nextUnits));
  }, []);

  const handleUseLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        fetchWeather({ coords, label: 'My location', preferCache: false });
      },
      (geoError) => {
        setError(geoError.message || 'Unable to access your location.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [fetchWeather]);

  const handleRetry = useCallback(() => {
    if (!activeTarget) return;
    if (activeTarget.type === 'city') {
      fetchWeather({ city: activeTarget.value, label: activeTarget.value, preferCache: false });
    } else {
      fetchWeather({ coords: activeTarget.value, label: activeTarget.label, preferCache: false });
    }
  }, [activeTarget, fetchWeather]);

  const timezoneName = weather?.timezone?.name ?? '';
  const timezoneOffset = weather?.timezone?.offset ?? 0;

  const currentData = useMemo(() => weather?.current ?? null, [weather]);
  const hourlyData = useMemo(() => weather?.hourly ?? [], [weather]);
  const dailyData = useMemo(() => weather?.daily ?? [], [weather]);
  const todayForecast = useMemo(() => dailyData[0] ?? null, [dailyData]);
  const tomorrowForecast = useMemo(() => dailyData[1] ?? null, [dailyData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-slate-100 text-slate-900 transition-colors duration-300 ease-out dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <Toolbar
        query={query}
        onQueryChange={handleQueryChange}
        onSubmit={handleSearchSubmit}
        onDebouncedInput={handleDebouncedInput}
        units={units}
        onUnitChange={handleUnitChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onUseLocation={handleUseLocation}
        isLoading={loading}
        offline={offline}
        lastUpdated={weather?.fetchedAt ?? null}
        timezoneName={timezoneName}
        recentSearches={recentSearches}
        onSelectSuggestion={handleSelectSuggestion}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 will-change-transform" role="main">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100" role="alert" aria-live="assertive">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 rounded-full border border-rose-400 px-3 py-1 text-sm font-medium text-rose-700 transition hover:bg-rose-100 focus:outline-none focus-visible:ring focus-visible:ring-rose-400 dark:border-rose-300/50 dark:text-rose-200 dark:hover:bg-rose-500/20"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <ForecastHighlights
          current={currentData}
          today={todayForecast}
          tomorrow={tomorrowForecast}
          units={units}
        />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] cv-auto cis-chart" aria-label="Current and hourly forecast">
          <CurrentCard
            loading={loading && !currentData}
            current={currentData}
            location={weather?.location}
            units={units}
            timezoneOffset={timezoneOffset}
          />
          <Suspense fallback={
            <section className="card h-full cv-auto cis-chart" aria-label="Hourly forecast loading">
              <div className="skeleton h-64 w-full" />
            </section>
          }>
            <HourlyChart
              loading={loading && !hourlyData.length}
              data={hourlyData}
              units={units}
              timezoneOffset={timezoneOffset}
            />
          </Suspense>
        </section>
        <DailyGrid
          loading={loading && !dailyData.length}
          data={dailyData}
          units={units}
          timezoneOffset={timezoneOffset}
        />
        <footer className="pb-8 text-xs text-slate-500 dark:text-slate-500">
          <p>Data provided by {weather?.provider === 'openweather' ? 'OpenWeather' : 'Open-Meteo'}{weather?.location?.name ? ` - Last updated ${formatRelativeTimestamp(weather?.fetchedAt)}` : ''}</p>
        </footer>
      </main>
    </div>
  );
}









