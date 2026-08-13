"use client";

import type { CSSProperties } from "react";
import type { Comercial } from "@/lib/data";
import { toEmbed, thumbOf } from "@/lib/video-utils";
import { useModal } from "./ModalProvider";
import type { RelatedVideo } from "./VideoModal";

export default function ComerciaisGrid({ items }: { items: Comercial[] }) {
  const { openModal } = useModal();

  function handleCardClick(c: Comercial) {
    const related: RelatedVideo[] = (c.extras ?? []).flatMap((extra) => {
      const embedUrl = toEmbed(extra.url);
      if (!embedUrl) return [];
      return [
        {
          id: extra.id,
          embedUrl,
          thumb: thumbOf(extra.url) ?? undefined,
          logo: c.logo,
          titulo: extra.titulo,
          sub: extra.ano ? `${c.alt} · ${extra.ano}` : c.alt,
        },
      ];
    });

    openModal({ embedUrl: toEmbed(c.url), related });
  }

  return (
    <div className="works">
      {items.map((c) => (
        <div
          key={c.id}
          className="card"
          style={c.zoom ? ({ "--zoom": c.zoom } as CSSProperties) : undefined}
          onClick={() => handleCardClick(c)}
        >
          <img className="thumb" src={c.banner ?? thumbOf(c.url) ?? undefined} alt={c.alt} loading="lazy" />
          <div className="shade" />
          <div className="logo">
            <img src={c.logo} alt={c.alt} />
          </div>
          <div className="play">
            <svg viewBox="0 0 12 12">
              <path d="M0 0 L12 6 L0 12 Z" />
            </svg>
          </div>
          <div className="meta">
            <span className="t">{c.titulo}</span>
            <span className="s">{c.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
