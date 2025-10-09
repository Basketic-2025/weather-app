import React, { memo, useEffect, useId, useState } from 'react';

function SearchBox({
  value,
  onChange,
  onSubmit,
  onDebouncedChange,
  isLoading,
  recentSearches = [],
  onSelectSuggestion,
}) {
  const inputId = useId();
  const [localValue, setLocalValue] = useState(value ?? '');

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      onDebouncedChange?.(localValue);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [localValue, onDebouncedChange]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(localValue.trim());
  };

  const handleInput = (event) => {
    const next = event.target.value;
    setLocalValue(next);
    onChange?.(next);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
    const input = document.getElementById(inputId);
    if (input) input.focus();
  };

  const handleSelect = (city) => {
    setLocalValue(city);
    onChange?.(city);
    onSelectSuggestion?.(city);
    onSubmit?.(city);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" role="search" aria-labelledby={`${inputId}-label`}>
      <label id={`${inputId}-label`} htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Search for a city
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative glass flex w-full flex-1 items-center rounded-full pl-10 pr-10 py-2 transition focus-within:ring-2 focus-within:ring-primary-400">
          <span aria-hidden="true" className="pointer-events-none absolute left-4 text-slate-400 dark:text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.6 3.6a7.5 7.5 0 0013.05 13.05z" />
            </svg>
          </span>
          <input
            id={inputId}
            type="search"
            autoComplete="off"
            className="w-full bg-transparent text-base outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Type a city and press Enter. Tip: use recent chips below."
            value={localValue}
            onChange={handleInput}
            aria-describedby={recentSearches.length ? `${inputId}-help` : undefined}
          />
          {isLoading ? (
            <span className="absolute right-3 text-slate-400 dark:text-slate-500" aria-hidden="true">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </span>
          ) : (
            !!localValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 rounded-full p-1 text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring focus-visible:ring-brand dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )
          )}
        </div>
        <button
          type="submit"
          className="btn-primary inline-flex items-center justify-center px-5 py-2 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading || !localValue.trim()}
        >
          {isLoading ? 'Loading...' : 'Search'}
        </button>
      </div>
      {recentSearches.length > 0 && (
        <div id={`${inputId}-help`} className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Recent searches">
          {recentSearches.map((city) => (
            <button
              key={city}
              type="button"
              className="chip hover:bg-slate-200 dark:hover:bg-slate-700"
              onClick={() => handleSelect(city)}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

export default memo(SearchBox);
