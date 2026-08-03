"use client";

import { useEffect, useState } from "react";
import type { Filme } from "@/lib/data";
import { toEmbed, thumbOf } from "@/lib/video-utils";
import { useModal } from "./ModalProvider";

function shuffle<T>(list: T[]): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function CinemaList({ items }: { items: Filme[] }) {
  const { openModal } = useModal();
  const [ordered, setOrdered] = useState(items);

  useEffect(() => {
    // Intentional: shuffle only after the client mounts, so SSR and the
    // first client render match (no hydration mismatch), then randomize.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrdered(shuffle(items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="lista-filmes">
      {ordered.map((f) => (
        <div key={f.id} className="filmes-row" onClick={() => openModal(toEmbed(f.url))}>
          <img
            className="poster"
            src={f.banner ?? f.poster ?? thumbOf(f.url) ?? undefined}
            alt={`Pôster de ${f.titulo}`}
            loading="lazy"
          />
          <span className="ano">{f.ano}</span>
          <span className="titulo">{f.titulo}</span>
          <span className="tipo">{f.tipo}</span>
        </div>
      ))}
    </div>
  );
}
