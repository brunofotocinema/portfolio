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
            <span className="titulo-wrap">
              <span className="titulo">{f.titulo}</span>
              {f.direcao && (
                <span className="direcao">
                  {t("cinema.dir_por")}: {f.direcao}
                </span>
              )}
            </span>
            <span className="tipo">{lancado ? f.tipo : t("cinema.em_finalizacao")}</span>
          </div>
        );
      })}
    </div>
  );
}
