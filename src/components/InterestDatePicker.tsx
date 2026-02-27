'use client';

import { DayPicker } from 'react-day-picker';
import { enUS, it } from 'react-day-picker/locale';
import type { Locale } from '@/lib/types';
import { MAX_DATES_OF_INTEREST } from '@/lib/types';
import 'react-day-picker/style.css';

function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDatesRaw(raw: string): Date[] {
  if (!raw || !raw.trim()) return [];
  const parts = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const dates: Date[] = [];
  for (const p of parts) {
    if (!iso.test(p)) continue;
    const [y, m, day] = p.split('-').map(Number);
    const date = new Date(y, m - 1, day);
    if (!Number.isNaN(date.getTime())) dates.push(date);
  }
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  locale: Locale;
  max?: number;
  'aria-describedby'?: string;
};

export function InterestDatePicker({
  value,
  onChange,
  error,
  locale,
  max = MAX_DATES_OF_INTEREST,
  'aria-describedby': ariaDescribedby,
}: Props) {
  const selected = parseDatesRaw(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSelect = (dates: Date[] | undefined) => {
    if (!dates || dates.length === 0) {
      onChange('');
      return;
    }
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    const next = sorted.slice(0, max).map(toISODateString).join(', ');
    onChange(next);
  };

  const dayPickerLocale = locale === 'it' ? it : enUS;

  return (
    <div className="rdp-interest-wrapper">
      <DayPicker
        mode="multiple"
        selected={selected}
        onSelect={handleSelect}
        max={max}
        disabled={{ before: today }}
        defaultMonth={today}
        startMonth={today}
        endMonth={new Date(today.getFullYear() + 1, 11, 31)}
        locale={dayPickerLocale}
        showOutsideDays
        className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4"
        aria-label="Select dates of interest"
        aria-describedby={ariaDescribedby}
        modifiersClassNames={{
          selected: 'rdp-interest-selected',
          today: 'rdp-interest-today',
          disabled: 'rdp-interest-disabled',
          outside: 'rdp-interest-outside',
        }}
      />
      {selected.length > 0 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {selected.length} date{selected.length !== 1 ? 's' : ''} selected
          {max > 0 ? ` (max ${max})` : ''}
        </p>
      )}
      {error && (
        <p id={ariaDescribedby} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
