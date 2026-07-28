"use client";

import type { Filme } from "@/lib/data";
import { toEmbed, thumbOf } from "@/lib/video-utils";
import { useModal } from "./ModalProvider";

export default function CinemaList({ items }: { items: Filme[] }) {
  const { openModal } = useModal();

  return (
    <div id="lista-filmes">
      {items.map((f) => (
        <div key={f.titulo} className="filmes-row" onClick={() => openModal(toEmbed(f.url))}>
          <span className="ano">{f.ano}</span>
          <span className="titulo">{f.titulo}</span>
          <span className="tipo">{f.tipo}</span>
          <img className="thumb" src={thumbOf(f.url) ?? undefined} alt="" loading="lazy" />
        </div>
      ))}
    </div>
  );
}
