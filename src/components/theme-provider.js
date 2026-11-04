"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

const ThemeContext = createContext({ theme: "light", toggle: () => {} });

// Sumber kebenaran tema = class "dark" di <html> (dipasang script di <head> sebelum render,
// supaya tidak ada kedipan). React hanya berlangganan perubahan class tersebut.
function subscribe(cb) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
const getSnapshot = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const getServerSnapshot = () => "light";

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("phelya-theme", next);
    } catch {}
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
