"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { formatoFilme, type Filme } from "@/lib/data";

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
  filme?: Filme | null;
}

function FichaFilme({ filme, comPoster }: { filme: Filme; comPoster: boolean }) {
  const { t } = useLanguage();
  const formato = formatoFilme(filme);
  const poster = filme.poster ?? filme.banner;
  const creditos = [
    ["filme.direcao", filme.direcao],
    ["filme.fotografia", filme.fotografia],
    ["filme.produtora", filme.produtora],
  ].filter((c): c is [string, string] => !!c[1]);

  return (
    <div className="ficha">
      {comPoster && poster && (
        // eslint-disable-next-line @next/next/no-img-element -- poster may be a remote TMDB image
        <img className="ficha-poster" src={poster} alt="" />
      )}
      <div className="ficha-info">
        <div className="ficha-head">
          <h3 className="ficha-titulo">{filme.titulo}</h3>
          {filme.imdb && (
            <a className="ficha-imdb" href={filme.imdb} target="_blank" rel="noopener noreferrer">
              {t("filme.imdb")}
            </a>
          )}
        </div>
        <p className="ficha-meta">
          {filme.ano}
          {formato && ` · ${t(`filme.${formato}`)}`}
        </p>
        {creditos.length > 0 && (
          <dl className="ficha-creditos">
            {creditos.map(([key, value]) => (
              <div key={key}>
                <dt>{t(key)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

export default function VideoModal({ src, related, onSelect, onClose, filme }: VideoModalProps) {
  const open = !!src || !!filme;
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
      {filme ? (
        <div className={`modal-filme${src ? "" : " sem-video"}`}>
          <button className="modal-close" onClick={onClose}>
            {t("modal.close")}
          </button>
          {src && (
            <div className="modal-box">
              <iframe
                src={src}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Player de vídeo"
              />
            </div>
          )}
          <FichaFilme filme={filme} comPoster={!src} />
        </div>
      ) : (
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
      )}
    </div>
  );
}
