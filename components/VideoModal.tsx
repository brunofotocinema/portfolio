"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/language-context";

export interface RelatedVideo {
  id: string;
  embedUrl: string;
  thumb?: string;
  logo?: string;
  titulo: string;
  sub?: string;
}

interface VideoModalProps {
  src: string | null;
  related: RelatedVideo[];
  onSelect: (video: RelatedVideo) => void;
  onClose: () => void;
}

export default function VideoModal({ src, related, onSelect, onClose }: VideoModalProps) {
  const open = !!src;
  const hasRelated = related.length > 0;
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
      <div className={`modal-content${hasRelated ? " modal-content-with-related" : ""}`}>
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

        {hasRelated && (
          <div className="modal-related">
            {related.map((video) => (
              <button
                key={video.id}
                type="button"
                className={`modal-related-card${video.embedUrl === src ? " active" : ""}`}
                onClick={() => onSelect(video)}
              >
                {video.thumb && (
                  // eslint-disable-next-line @next/next/no-img-element -- small modal sidebar thumbnail
                  <img src={video.thumb} alt="" loading="lazy" />
                )}
                <div className="shade" />
                {video.logo && (
                  <div className="logo">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small modal sidebar logo */}
                    <img src={video.logo} alt="" />
                  </div>
                )}
                <div className="meta">
                  <span className="t">{video.titulo}</span>
                  {video.sub && <span className="s">{video.sub}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
