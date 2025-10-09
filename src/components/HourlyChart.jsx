import React, { memo, useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatTemp, toHourLabel } from '../lib/utils.js';

function TooltipContent({ active, payload, label, units }) {
  if (!active || !payload?.length) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white shadow">
      <p className="font-semibold">{label}</p>
      <p>{formatTemp(point.value, units)}</p>
    </div>
  );
}

function HourlyChart({ loading, data = [], units, timezoneOffset }) {
  if (loading) {
    return (
      <section className="card h-full" aria-label="Hourly forecast loading">
        <div className="skeleton h-64 w-full" />
      </section>
    );
  }

  if (!data.length) {
    return null;
  }

  const chartData = useMemo(() => (
    data.map((hour) => ({
      label: toHourLabel(hour.dt, timezoneOffset),
      value: Math.round(hour.temp * 10) / 10,
    }))
  ), [data, timezoneOffset]);

  return (
    <section className="card h-full cv-auto cis-chart" aria-label="Hourly forecast" aria-live="polite">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Next 24 hours</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Temperature</span>
      </div>
      <div className="h-64 w-full will-change-transform">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
            <XAxis dataKey="label" stroke="#475569" angle={0} height={24} interval={2} tickMargin={8} tickLine={false} />
            <YAxis stroke="#475569" tickFormatter={(value) => formatTemp(value, units)} width={56} tickLine={false} axisLine={false} />
            <Tooltip isAnimationActive={false} content={<TooltipContent units={units} />} />
            <Line isAnimationActive={false} type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default memo(HourlyChart);
