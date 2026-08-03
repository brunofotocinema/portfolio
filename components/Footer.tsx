"use client";

import { useLanguage } from "@/lib/language-context";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer>
      <span>© 2026 Bruno Homem</span>
      <span>{t("footer.tagline")}</span>
    </footer>
  );
}
