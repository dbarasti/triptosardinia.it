'use client';

import { useState } from 'react';
import { migrateDraftMediaAction } from '@/app/actions/admin-experiences';

export function MigrateDraftMediaButton() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; migrated?: number; error?: string } | null>(null);

  const handleClick = async () => {
    if (!confirm('This will move all _draft images to their permanent experience folders and update the database. Continue?')) return;
    setPending(true);
    setResult(null);
    const res = await migrateDraftMediaAction();
    setPending(false);
    setResult(res);
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Migrate Draft Media</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Moves images stored in the <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">_draft</code> folder
        to their permanent per-experience folders and updates the database. Safe to run multiple times.
      </p>
      {result && (
        <p className={`text-sm mb-3 ${result.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {result.ok ? `Done — ${result.migrated} experience(s) migrated.` : result.error}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {pending ? 'Migrating…' : 'Run Migration'}
      </button>
    </section>
  );
}
