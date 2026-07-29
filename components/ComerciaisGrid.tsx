"use client";

import type { CSSProperties } from "react";
import type { Comercial } from "@/lib/data";
import { toEmbed, thumbOf } from "@/lib/video-utils";
import { useModal } from "./ModalProvider";

export default function ComerciaisGrid({ items }: { items: Comercial[] }) {
  const { openModal } = useModal();

  return (
    <div className="works">
      {items.map((c) => (
        <div
          key={c.id}
          className="card"
          style={c.zoom ? ({ "--zoom": c.zoom } as CSSProperties) : undefined}
          onClick={() => openModal(toEmbed(c.url))}
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
