"use client";

import { useLanguage } from "@/lib/language-context";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-toggle" role="group" aria-label="Idioma / Language">
      <button
        type="button"
        aria-label="Português"
        aria-pressed={lang === "pt"}
        className={lang === "pt" ? "active" : undefined}
        onClick={() => setLang("pt")}
      >
        PT
      </button>
      <span className="lang-toggle-sep">/</span>
      <button
        type="button"
        aria-label="English"
        aria-pressed={lang === "en"}
        className={lang === "en" ? "active" : undefined}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}
