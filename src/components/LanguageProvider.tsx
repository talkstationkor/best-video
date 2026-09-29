"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Language = "한국어" | "English";

const STORAGE_KEY = "bv_language";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
}>({
  language: "한국어",
  setLanguage: () => {}
});

export function LanguageProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("한국어");

  // Remember the choice per browser so it survives full page loads.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "English" || saved === "한국어") setLanguageState(saved);
    } catch {}
  }, []);

  function setLanguage(next: Language) {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
