import { useCallback, useEffect, useState } from 'preact/hooks';
import { loadAll } from '../db/db';
import { todayISO } from '../lib/dates';
import type { AppData, ISODate } from '../types';

export interface ScreenProps {
  data: AppData;
  today: ISODate;
  refresh(): Promise<void>;
}

export function useApp() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [today, setToday] = useState(() => todayISO());

  const refresh = useCallback(async () => {
    try {
      const { settings, weights, measurements } = await loadAll();
      setData(settings ? { settings, weights, measurements } : null);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const updateToday = () => setToday(todayISO());
    document.addEventListener('visibilitychange', updateToday);
    window.addEventListener('pageshow', updateToday);
    return () => {
      document.removeEventListener('visibilitychange', updateToday);
      window.removeEventListener('pageshow', updateToday);
    };
  }, [refresh]);

  return { loading, loadError, data, today, refresh };
}
