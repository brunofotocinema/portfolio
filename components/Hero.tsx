"use client";

import { useEffect, useRef } from "react";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const tryPlay = () => video.play().catch(() => {});
    tryPlay();
    const onVisibility = () => {
      if (!document.hidden) tryPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", tryPlay);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", tryPlay);
    };
  }, []);

  return (
    <section className="hero" id="top" style={{ padding: 0 }}>
      <video ref={videoRef} autoPlay muted loop playsInline preload="auto">
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      <div className="grade" />
      <div className="name-plate">
        <h1>Bruno Homem</h1>
        <div className="role">Gaffer</div>
      </div>
      <div className="scroll">Role para ver os trabalhos</div>
    </section>
  );
}
