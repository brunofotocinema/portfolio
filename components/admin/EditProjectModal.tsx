"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import LogoUploader from "./LogoUploader";
import type { Categoria } from "@/lib/admin-types";
import type { Comercial, Filme, ImagemGaleria } from "@/lib/data";

interface EditProjectModalProps {
  categoria: Categoria;
  project: Comercial | Filme | ImagemGaleria;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProjectModal({
  categoria,
  project,
  onClose,
  onSaved,
}: EditProjectModalProps) {
  const isGaleria = categoria === "galeria";
  const [titulo, setTitulo] = useState(isGaleria ? "" : (project as Comercial | Filme).titulo);
  const [ano, setAno] = useState(isGaleria ? "" : String((project as Comercial | Filme).ano));
  const [videoUrl, setVideoUrl] = useState(isGaleria ? "" : (project as Comercial | Filme).url);
  const [alt, setAlt] = useState(isGaleria ? (project as ImagemGaleria).alt ?? "" : "");
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [newImagemFile, setNewImagemFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentImageUrl = isGaleria
    ? (project as ImagemGaleria).src
    : categoria === "publicidade"
      ? (project as Comercial).logo
      : (project as Filme).banner;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isGaleria) {
      if (!titulo.trim()) return setError("Título é obrigatório.");
      if (!ano.trim() || Number.isNaN(Number(ano))) return setError("Ano é obrigatório.");
      if (!videoUrl.trim()) return setError("Link do vídeo é obrigatório.");
    }

    const user = auth.currentUser;
    if (!user) return setError("Sessão expirada. Faça login novamente.");

    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();

      if (isGaleria) {
        if (alt.trim()) formData.set("alt", alt.trim());
        if (newImagemFile) formData.set("imagem", newImagemFile);
      } else {
        formData.set("titulo", titulo.trim());
        formData.set("ano", ano.trim());
        formData.set("videoUrl", videoUrl.trim());
        if (newLogoFile) formData.set("logo", newLogoFile);
        if (newBannerFile) formData.set("banner", newBannerFile);
      }

      const res = await fetch(
        `/api/admin/projects/${encodeURIComponent(project.id)}?categoria=${categoria}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }
      onSaved();
    } catch {
      setError("Erro de rede ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal-box">
        <h2>
          Editar &ldquo;{isGaleria ? (project as ImagemGaleria).alt || "imagem" : titulo}&rdquo;
        </h2>
        <form className="admin-project-form" onSubmit={handleSubmit}>
          {isGaleria ? (
            <label>
              Legenda (opcional)
              <input value={alt} onChange={(e) => setAlt(e.target.value)} />
            </label>
          ) : (
            <>
              <label>
                Título *
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </label>

              <label>
                Ano *
                <input type="number" value={ano} onChange={(e) => setAno(e.target.value)} />
              </label>

              <label>
                Link do vídeo (YouTube) *
                <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              </label>
            </>
          )}

          {currentImageUrl && (
            <div className="admin-field">
              <label>Imagem atual</label>
              <img src={currentImageUrl} alt="" className="admin-current-image" />
            </div>
          )}

          {isGaleria ? (
            <div className="admin-field">
              <label>
                Substituir imagem (opcional)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setNewImagemFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ) : categoria === "publicidade" ? (
            <LogoUploader label="Substituir logo (opcional)" onChange={setNewLogoFile} />
          ) : (
            <div className="admin-field">
              <label>
                Substituir banner (opcional)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setNewBannerFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-modal-actions">
            <button type="button" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
