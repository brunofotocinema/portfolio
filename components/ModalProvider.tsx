"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import VideoModal, { type RelatedVideo } from "./VideoModal";

interface OpenModalOptions {
  embedUrl: string | null;
  related?: RelatedVideo[];
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

  function openModal({ embedUrl, related: relatedVideos }: OpenModalOptions) {
    setSrc(embedUrl);
    setRelated(relatedVideos ?? []);
  }

  function closeModal() {
    setSrc(null);
    setRelated([]);
  }

  return (
    <ModalContext.Provider value={{ openModal }}>
      {children}
      <VideoModal
        src={src}
        related={related}
        onSelect={(video) => setSrc(video.embedUrl)}
        onClose={closeModal}
      />
    </ModalContext.Provider>
  );
}
