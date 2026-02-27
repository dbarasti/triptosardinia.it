'use client';

import { createContext, useContext, useCallback, useState, useEffect } from 'react';

const FAVORITES_KEY = 'ce_favorites';

type FavoritesContextType = {
  ids: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        const parsed = Array.isArray(arr) ? arr.map((id) => String(id)) : [];
        setIds(new Set(parsed));
      }
    } catch {
      setIds(new Set());
    }
  }, []);

  const persist = useCallback((next: Set<string>) => {
    sessionStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next)));
    setIds(next);
  }, []);

  const isFavorite = useCallback(
    (id: string) => ids.has(String(id)),
    [ids]
  );

  const toggle = useCallback((id: string) => {
    const key = String(id);
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      sessionStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{ ids, isFavorite, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
