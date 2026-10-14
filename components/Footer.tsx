"use client";

import { useLanguage } from "@/lib/language-context";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer>
      <span>© 2026 Bruno Homem</span>
      <span>{t("footer.tagline")}</span>
      {/* attribution required by TMDB's API terms (film data comes from there) */}
      <a className="footer-tmdb" href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG logo */}
        <img src="/tmdb.svg" alt="TMDB" />
        <span>{t("footer.tmdb")}</span>
      </a>
    </footer>
  );
}
