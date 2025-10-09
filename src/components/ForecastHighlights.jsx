import React, { memo } from 'react';
import {
  describeCondition,
  formatHumidity,
  formatProbability,
  formatSpeed,
  formatTemp,
  pickIcon,
} from '../lib/utils.js';

function ForecastHighlights({ current, today, tomorrow, units }) {
  if (!current && !today) {
    return null;
  }

  const todayIcon = current?.iconCode ?? today?.iconCode;
  const todayDescription = current?.description || describeCondition(todayIcon);
  const todayPrecip = today?.precipitationProbability ?? current?.precipitationProbability ?? null;
  const tomorrowDescription = tomorrow?.description || describeCondition(tomorrow?.iconCode);

  return (
    <section className="card glass will-change-transform" aria-label="Forecast highlights">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Today at a glance</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-800/50">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Sky</h3>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">{pickIcon(todayIcon)}</span>
            <div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{todayDescription || 'Details coming soon'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                High {formatTemp(today?.tempMax ?? current?.temp, units)} - Low {formatTemp(today?.tempMin ?? current?.temp, units)}
              </p>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-800/50">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Rain chance</h3>
          <p className="mt-3 text-3xl font-semibold text-slate-800 dark:text-slate-100">{formatProbability(todayPrecip)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Chance of rain today</p>
          {tomorrow && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Tomorrow: {formatProbability(tomorrow.precipitationProbability)}
            </p>
          )}
        </article>
        <article className="rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-800/50">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Comfort</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Humidity</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatHumidity(current?.humidity)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Wind</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatSpeed(current?.windSpeed, units)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Tomorrow</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">
                {tomorrow ? `${formatTemp(tomorrow.tempMax, units)} / ${formatTemp(tomorrow.tempMin, units)}` : '--'}
              </dd>
            </div>
          </dl>
          {tomorrowDescription && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{tomorrowDescription}</p>
          )}
        </article>
      </div>
    </section>
  );
}

export default memo(ForecastHighlights);
