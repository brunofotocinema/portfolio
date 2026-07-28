"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import VideoModal from "./VideoModal";

interface ModalContextValue {
  openModal: (embedUrl: string | null) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal deve ser usado dentro de ModalProvider");
  return ctx;
}

export default function ModalProvider({ children }: { children: ReactNode }) {
  const [src, setSrc] = useState<string | null>(null);

  return (
    <ModalContext.Provider value={{ openModal: setSrc }}>
      {children}
      <VideoModal src={src} onClose={() => setSrc(null)} />
    </ModalContext.Provider>
  );
}
