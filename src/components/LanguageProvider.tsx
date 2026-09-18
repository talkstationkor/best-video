"use client";

import { createContext, useContext, useState } from "react";

type Language = "한국어" | "English";

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
  const [language, setLanguage] = useState<Language>("한국어");

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}