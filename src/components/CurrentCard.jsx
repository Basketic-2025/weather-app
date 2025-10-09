import React, { memo } from 'react';
import { describeCondition, formatHumidity, formatPressure, formatSpeed, formatTemp, formatTimestamp, pickIcon } from '../lib/utils.js';

function CurrentCard({ loading, current, location, units, timezoneOffset }) {
  if (loading) {
    return (
      <section className="card" aria-label="Current conditions loading">
        <div className="flex flex-col gap-4">
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-12 w-24" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-4 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!current) {
    return null;
  }

  const locationSuffix = location?.country ? `, ${location.country}` : '';
  const title = location?.name ? `${location.name}${locationSuffix}` : 'Now';
  const description = current.description || describeCondition(current.iconCode);

  return (
    <section className="card glass h-full cv-auto" aria-label="Current conditions" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <div className="text-4xl drop-shadow-sm" aria-hidden="true">{pickIcon(current.iconCode)}</div>
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <span className="text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
          {formatTemp(current.temp, units)}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">Feels like {formatTemp(current.feelsLike, units)}</span>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Humidity</dt>
          <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatHumidity(current.humidity)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Wind</dt>
          <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatSpeed(current.windSpeed, units)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Pressure</dt>
          <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatPressure(current.pressure)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Sunrise</dt>
          <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatTimestamp(current.sunrise, timezoneOffset)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Sunset</dt>
          <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatTimestamp(current.sunset, timezoneOffset)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Updated</dt>
          <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatTimestamp(current.dt, timezoneOffset)}</dd>
        </div>
      </dl>
    </section>
  );
}

export default memo(CurrentCard);
