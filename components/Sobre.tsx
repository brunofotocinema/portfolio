"use client";

import { useLanguage } from "@/lib/language-context";

export default function Sobre() {
  const { t } = useLanguage();

  return (
    <section id="sobre">
      <div className="sec-head">
        <h2>{t("nav.sobre")}</h2>
      </div>
      <div className="sobre-grid">
        <div>
          <p>{t("sobre.p1")}</p>
          <p>{t("sobre.p2")}</p>
        </div>
        <ul className="expertise">
          <li>
            <span>{t("sobre.expertise.chefia.title")}</span>
            <span>{t("sobre.expertise.chefia.sub")}</span>
          </li>
          <li>
            <span>{t("sobre.expertise.comerciais.title")}</span>
            <span>{t("sobre.expertise.comerciais.sub")}</span>
          </li>
          <li>
            <span>{t("sobre.expertise.prelight.title")}</span>
            <span>{t("sobre.expertise.prelight.sub")}</span>
          </li>
          <li>
            <span>{t("sobre.expertise.coordenacao.title")}</span>
            <span>{t("sobre.expertise.coordenacao.sub")}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
