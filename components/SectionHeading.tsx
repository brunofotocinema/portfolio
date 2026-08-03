"use client";

import { useLanguage } from "@/lib/language-context";

export default function SectionHeading({ i18nKey }: { i18nKey: string }) {
  const { t } = useLanguage();
  return <h2>{t(i18nKey)}</h2>;
}
