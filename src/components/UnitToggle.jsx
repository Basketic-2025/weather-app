import React, { memo } from 'react';
function UnitToggle({ units = 'metric', onChange }) {
  const handleSelect = (event) => {
    onChange?.(event.target.value);
  };

  const baseClasses = 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition focus-within:ring focus-within:ring-brand';

  const renderLabel = (value, text) => (
    <label className={`${baseClasses} ${units === value ? 'border-brand bg-brand/10 text-brand-dark dark:text-brand-light' : 'border-slate-300 dark:border-slate-700'}`}>
      <input
        type="radio"
        name="units"
        value={value}
        checked={units === value}
        onChange={handleSelect}
        className="sr-only"
      />
      <span aria-hidden="true">{text}</span>
    </label>
  );

  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">Temperature units</legend>
      {renderLabel('metric', 'degC')}
      {renderLabel('imperial', 'degF')}
    </fieldset>
  );
}

export default memo(UnitToggle);
