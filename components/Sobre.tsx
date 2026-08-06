"use client";

import { useLanguage } from "@/lib/language-context";
import type { AboutContent } from "@/lib/about";

export default function Sobre({ about }: { about: AboutContent }) {
  const { t, lang } = useLanguage();

  return (
    <section id="sobre">
      <div className="sec-head">
        <h2>{t("nav.sobre")}</h2>
      </div>
      <div className="sobre-grid">
        <div className="sobre-foto">
          {/* eslint-disable-next-line @next/next/no-img-element -- static profile portrait, no next/image optimization needed */}
          <img src="/fotos/bruno-perfil.jpg" alt="Bruno Homem" />
        </div>
        <div>
          <p>{about.p1[lang]}</p>
          <p>{about.p2[lang]}</p>
        </div>
        <ul className="expertise">
          {about.expertise.map((item, i) => (
            <li key={i}>
              <span>{item.title[lang]}</span>
              <span>{item.sub[lang]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
