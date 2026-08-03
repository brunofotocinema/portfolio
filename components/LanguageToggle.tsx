"use client";

import { useLanguage } from "@/lib/language-context";

function FlagBR() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" fill="#000" />
      <polygon points="10,1 19,7 10,13 1,7" fill="#fff" />
      <clipPath id="flagBrCircle">
        <circle cx="10" cy="7" r="4" />
      </clipPath>
      <circle cx="10" cy="7" r="4" fill="#000" />
      <rect
        x="3"
        y="5.8"
        width="14"
        height="2.4"
        fill="#fff"
        transform="rotate(-18 10 7)"
        clipPath="url(#flagBrCircle)"
      />
    </svg>
  );
}

function FlagUK() {
  return (
    <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true">
      <rect width="28" height="14" fill="#000" />
      <path d="M0,0 L28,14 M28,0 L0,14" stroke="#fff" strokeWidth="4.6" />
      <path d="M0,0 L28,14" stroke="#000" strokeWidth="1.2" transform="translate(1,-0.6)" />
      <path d="M28,0 L0,14" stroke="#000" strokeWidth="1.2" transform="translate(-1,-0.6)" />
      <rect x="11" width="6" height="14" fill="#fff" />
      <rect y="5" width="28" height="4" fill="#fff" />
      <rect x="12.7" width="2.6" height="14" fill="#000" />
      <rect y="6.2" width="28" height="1.6" fill="#000" />
    </svg>
  );
}

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
        <FlagBR />
      </button>
      <button
        type="button"
        aria-label="English"
        aria-pressed={lang === "en"}
        className={lang === "en" ? "active" : undefined}
        onClick={() => setLang("en")}
      >
        <FlagUK />
      </button>
    </div>
  );
}
