"use client";

import { filmeLancado, type Filme } from "@/lib/data";
import { toEmbed, thumbOf } from "@/lib/video-utils";
import { useModal } from "./ModalProvider";
import { useLanguage } from "@/lib/language-context";

export default function CinemaList({ items }: { items: Filme[] }) {
  const { openModal } = useModal();
  const { t } = useLanguage();

  return (
    <div id="lista-filmes">
      {items.map((f) => {
        const posterSrc = f.banner ?? f.poster ?? thumbOf(f.url) ?? undefined;
        const lancado = filmeLancado(f);

        return (
          <div
            key={f.id}
            className={`filmes-row${lancado ? "" : " sem-video"}`}
            onClick={lancado ? () => openModal({ embedUrl: toEmbed(f.url), filme: f }) : undefined}
          >
            {posterSrc ? (
              <img className="poster" src={posterSrc} alt={`Pôster de ${f.titulo}`} loading="lazy" />
            ) : (
              <div className="poster poster-placeholder" aria-hidden="true" />
            )}
            <span className="ano">
              {f.ano}
              {!lancado && (
                <>
                  <br />
                  <span className="ano-nota">({t("cinema.gravacao")})</span>
                </>
              )}
            </span>
            <span className="titulo">{f.titulo}</span>
            {/* formato (longa/curta) fica só no modal; aqui vão direção e fotografia */}
            <span className="tipo creditos">
              {f.direcao && (
                <span>
                  <span className="creditos-rotulo">{t("cinema.direcao")}</span> {f.direcao}
                </span>
              )}
              {f.fotografia && (
                <span>
                  <span className="creditos-rotulo">{t("cinema.dop")}</span> {f.fotografia}
                </span>
              )}
              {!f.direcao && !f.fotografia && !lancado && t("cinema.em_finalizacao")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
