import React, { memo } from 'react';
import { describeCondition, formatTemp, pickIcon, toDayName } from '../lib/utils.js';

function DailyGrid({ loading, data = [], units, timezoneOffset }) {
  if (loading) {
    return (
      <section className="card" aria-label="7 day forecast loading">
        <div className="grid gap-4 md:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="skeleton h-28 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (!data.length) {
    return null;
  }

  return (
    <section className="card glass cv-auto cis-grid will-change-transform" aria-label="7 day forecast" aria-live="polite">
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Next 7 days</h2>
      <div className="grid gap-4 md:grid-cols-7">
        {data.map((day) => {
          const title = toDayName(day.dt, timezoneOffset);
          const description = day.description || describeCondition(day.iconCode);
          return (
            <article key={day.dt} className="flex flex-col items-center gap-2 rounded-2xl border border-white/30 bg-white/60 p-3 text-center shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-800/50">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</h3>
              <span className="text-3xl" aria-hidden="true">{pickIcon(day.iconCode)}</span>
              {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
              <p className="mt-auto flex w-full flex-wrap items-center justify-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="inline-flex items-center justify-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200" title="High">
                  <span aria-hidden="true">H</span>
                  <span>{formatTemp(day.tempMax, units)}</span>
                </span>
                <span className="inline-flex items-center justify-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-sky-700 dark:bg-sky-400/20 dark:text-sky-200" title="Low">
                  <span aria-hidden="true">L</span>
                  <span>{formatTemp(day.tempMin, units)}</span>
                </span>
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default memo(DailyGrid);
