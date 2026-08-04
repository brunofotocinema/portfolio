"use client";

import { useEffect, useRef, useState } from "react";
import type { ImagemGaleria } from "@/lib/data";
import { useLanguage } from "@/lib/language-context";
import SectionHeading from "./SectionHeading";

const SWIPE_THRESHOLD = 50;

export default function Galeria({ items }: { items: ImagemGaleria[] }) {
  const { t } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dragStartX = useRef<number | null>(null);

  const hasImages = items.length > 0;

  useEffect(() => {
    if (openIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === "ArrowLeft")
        setOpenIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openIndex, items.length]);

  if (!hasImages) return null;

  function scrollTrack(dir: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  }

  function next() {
    setOpenIndex((i) => (i === null ? i : (i + 1) % items.length));
  }
  function prev() {
    setOpenIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length));
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStartX.current = e.clientX;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (delta > SWIPE_THRESHOLD) prev();
    else if (delta < -SWIPE_THRESHOLD) next();
  }

  return (
    <>
      <section id="galeria">
        <div className="sec-head">
          <SectionHeading i18nKey="section.galeria" />
        </div>
        <div className="galeria-wrap">
          <button
            type="button"
            className="galeria-arrow galeria-arrow-left"
            aria-label="Anterior"
            onClick={() => scrollTrack(-1)}
          >
            ‹
          </button>
          <div className="galeria-track" ref={trackRef}>
            {items.map((img, i) => (
              <button
                type="button"
                key={img.id}
                className="galeria-item"
                onClick={() => setOpenIndex(i)}
              >
                <img src={img.src} alt={img.alt ?? ""} loading="lazy" />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="galeria-arrow galeria-arrow-right"
            aria-label="Próxima"
            onClick={() => scrollTrack(1)}
          >
            ›
          </button>
        </div>
      </section>

      {openIndex !== null && (
        <div className="lightbox" onClick={() => setOpenIndex(null)}>
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setOpenIndex(null)}
          >
            {t("modal.close")}
          </button>

          <button
            type="button"
            className="lightbox-arrow lightbox-arrow-left"
            aria-label="Anterior"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            ‹
          </button>

          <img
            className="lightbox-image"
            src={items[openIndex].src}
            alt={items[openIndex].alt ?? ""}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            draggable={false}
          />

          <button
            type="button"
            className="lightbox-arrow lightbox-arrow-right"
            aria-label="Próxima"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
