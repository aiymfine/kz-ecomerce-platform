import { useState, useEffect, useCallback } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      // Default to LIGHT mode — user must explicitly toggle to dark
      return false;
    } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(dark));
  }, [dark]);

  const toggle = useCallback(() => setDark(d => !d), []);

  return { dark, toggle };
}
