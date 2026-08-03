"use client";

import { useState, type CSSProperties } from "react";
import type { Comercial } from "@/lib/data";
import { toEmbed, thumbOf } from "@/lib/video-utils";
import { useModal } from "./ModalProvider";

export default function ComerciaisGrid({ items }: { items: Comercial[] }) {
  const { openModal } = useModal();
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  function handleCardClick(c: Comercial) {
    openModal(toEmbed(c.url));
    if (c.extras && c.extras.length > 0 && !revealed.has(c.id)) {
      setRevealed((prev) => new Set(prev).add(c.id));
    }
  }

  const extraEntries = items.flatMap((c) =>
    revealed.has(c.id) && c.extras
      ? c.extras.map((extra) => ({ parent: c, extra }))
      : []
  );

  return (
    <>
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

      {extraEntries.length > 0 && (
        <div className="works-extra">
          {extraEntries.map(({ parent, extra }) => (
            <div
              key={extra.id}
              className="extra-card"
              onClick={() => openModal(toEmbed(extra.url))}
            >
              <img src={thumbOf(extra.url) ?? undefined} alt={extra.titulo} loading="lazy" />
              <div className="shade" />
              <div className="logo">
                <img src={parent.logo} alt={parent.alt} />
              </div>
              <div className="meta">
                <span className="t">{extra.titulo}</span>
                <span className="s">
                  {parent.alt}
                  {extra.ano ? ` · ${extra.ano}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
