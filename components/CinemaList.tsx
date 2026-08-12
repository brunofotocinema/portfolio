"use client";

import type { Filme } from "@/lib/data";
import { toEmbed, thumbOf } from "@/lib/video-utils";
import { useModal } from "./ModalProvider";

export default function CinemaList({ items }: { items: Filme[] }) {
  const { openModal } = useModal();

  return (
    <div id="lista-filmes">
      {items.map((f) => {
        const posterSrc = f.banner ?? f.poster ?? thumbOf(f.url) ?? undefined;
        const embedUrl = toEmbed(f.url);

        return (
          <div
            key={f.id}
            className={`filmes-row${embedUrl ? "" : " sem-video"}`}
            onClick={embedUrl ? () => openModal(embedUrl) : undefined}
          >
            {posterSrc ? (
              <img className="poster" src={posterSrc} alt={`Pôster de ${f.titulo}`} loading="lazy" />
            ) : (
              <div className="poster poster-placeholder" aria-hidden="true" />
            )}
            <span className="ano">
              {f.ano}
              {!embedUrl && (
                <>
                  <br />
                  <span className="ano-nota">(gravação)</span>
                </>
              )}
            </span>
            <span className="titulo">{f.titulo}</span>
            <span className="tipo">{f.tipo}</span>
          </div>
        );
      })}
    </div>
  );
}
