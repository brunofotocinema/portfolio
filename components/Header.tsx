"use client";

import { useLanguage } from "@/lib/language-context";
import LanguageToggle from "./LanguageToggle";

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="site">
      <nav>
        <a href="#trabalhos">{t("nav.trabalhos")}</a>
        <a href="#cinema">{t("nav.cinema")}</a>
        <a href="#sobre">{t("nav.sobre")}</a>
        <a href="#contato">{t("nav.contato")}</a>
        <LanguageToggle />
      </nav>
    </header>
  );
}
