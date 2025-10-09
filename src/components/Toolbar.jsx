import React, { memo } from 'react';
import SearchBox from './SearchBox.jsx';
import UnitToggle from './UnitToggle.jsx';
import { formatRelativeTimestamp } from '../lib/utils.js';

function Toolbar({
  query,
  onQueryChange,
  onSubmit,
  onDebouncedInput,
  units,
  onUnitChange,
  theme,
  onToggleTheme,
  onUseLocation,
  isLoading,
  offline,
  lastUpdated,
  timezoneName,
  recentSearches,
  onSelectSuggestion,
}) {
  const themeIcon = theme === 'dark' ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m13.9 0l-1.41 1.41M6.46 17.54l-1.41 1.41" />
    </svg>
  );
  return (
    <header className="sticky top-0 z-20 glass text-slate-900 dark:text-slate-100 will-change-transform" role="banner">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Weather for F1</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
              {offline ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
                  Offline data - cached {formatRelativeTimestamp(lastUpdated)}
                </span>
              ) : (
                <span>{timezoneName ? `Timezone: ${timezoneName}` : 'Search for any city worldwide.'}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UnitToggle units={units} onChange={onUnitChange} />
            <button
              type="button"
              className="btn-ghost inline-flex items-center gap-2"
              onClick={onToggleTheme}
            >
              <span aria-hidden="true">{themeIcon}</span>
              <span>{theme === 'dark' ? 'Dark' : 'Light'} mode</span>
            </button>
            <button
              type="button"
              onClick={onUseLocation}
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading}
            >
              <span aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2m8-10h2M2 12H0m15.536 6.536l1.414 1.414M7.05 6.464L5.636 5.05m12.728 0l-1.414 1.414M7.05 17.536l-1.414 1.414" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </span>
              Use my location
            </button>
          </div>
        </div>
        <SearchBox
          value={query}
          onChange={onQueryChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onDebouncedChange={onDebouncedInput}
          recentSearches={recentSearches}
          onSelectSuggestion={onSelectSuggestion}
        />
      </div>
    </header>
  );
}

export default memo(Toolbar);
