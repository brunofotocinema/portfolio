"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/language-context";

interface VideoModalProps {
  src: string | null;
  onClose: () => void;
}

export default function VideoModal({ src, onClose }: VideoModalProps) {
  const open = !!src;
  const { t } = useLanguage();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className={`modal${open ? " open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          {t("modal.close")}
        </button>
        {open && (
          <iframe
            src={src ?? ""}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Player de vídeo"
          />
        )}
      </div>
    </div>
  );
}
