"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import VideoModal, { type RelatedVideo } from "./VideoModal";
import type { Filme } from "@/lib/data";

interface OpenModalOptions {
  embedUrl: string | null;
  related?: RelatedVideo[];
  /** film opens with its ficha below the player (or poster, if no video) */
  filme?: Filme;
}

interface ModalContextValue {
  openModal: (options: OpenModalOptions) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal deve ser usado dentro de ModalProvider");
  return ctx;
}

export default function ModalProvider({ children }: { children: ReactNode }) {
  const [src, setSrc] = useState<string | null>(null);
  const [related, setRelated] = useState<RelatedVideo[]>([]);
  const [filme, setFilme] = useState<Filme | null>(null);

  function openModal({ embedUrl, related: relatedVideos, filme: f }: OpenModalOptions) {
    setSrc(embedUrl);
    setRelated(relatedVideos ?? []);
    setFilme(f ?? null);
  }

  function closeModal() {
    setSrc(null);
    setRelated([]);
    setFilme(null);
  }

  return (
    <ModalContext.Provider value={{ openModal }}>
      {children}
      <VideoModal
        src={src}
        related={related}
        filme={filme}
        onSelect={(video) => setSrc(video.embedUrl)}
        onClose={closeModal}
      />
    </ModalContext.Provider>
  );
}
