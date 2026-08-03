"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang } from "./i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage deve ser usado dentro de LanguageProvider");
  return ctx;
}

const STORAGE_KEY = "lang";

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    // Intentional: default render is "pt" (matches SSR) so there's no
    // hydration mismatch; the stored preference is applied right after.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "pt" || stored === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(stored);
    }
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function t(key: string): string {
    return translations[lang][key] ?? translations.pt[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}
