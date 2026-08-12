"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import type { AboutContent } from "@/lib/about";

export default function Sobre({ about }: { about: AboutContent }) {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <section id="sobre">
      <div className="sec-head">
        <h2>{t("nav.sobre")}</h2>
      </div>
      <ul className="expertise">
        {about.expertise.map((item, i) => (
          <li key={i}>
            <span>{item.title[lang]}</span>
            <span>{item.sub[lang]}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="sobre-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? t("sobre.ver_menos") : t("sobre.saiba_mais")}
      </button>

      {expanded && (
        <div className="sobre-expandido">
          <div className="sobre-fotos">
            <div className="sobre-foto">
              {/* eslint-disable-next-line @next/next/no-img-element -- static profile portrait, no next/image optimization needed */}
              <img src="/fotos/bruno-perfil.jpg" alt="Bruno Homem" />
            </div>
            <div className="sobre-foto">
              {/* eslint-disable-next-line @next/next/no-img-element -- static profile portrait, no next/image optimization needed */}
              <img src="/fotos/bruno-perfil-expandido.jpg" alt="Bruno Homem" />
            </div>
          </div>
          <div className="sobre-texto">
            <p>{about.p1[lang]}</p>
            <p>{about.p2[lang]}</p>
          </div>
        </div>
      )}
    </section>
  );
}
