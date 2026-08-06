"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import type { ImagemGaleria } from "@/lib/data";

interface EditGaleriaModalProps {
  project: ImagemGaleria;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProjectModal({ project, onClose, onSaved }: EditGaleriaModalProps) {
  const [alt, setAlt] = useState(project.alt ?? "");
  const [newImagemFile, setNewImagemFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const user = auth.currentUser;
    if (!user) return setError("Sessão expirada. Faça login novamente.");

    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();
      if (alt.trim()) formData.set("alt", alt.trim());
      if (newImagemFile) formData.set("imagem", newImagemFile);

      const res = await fetch(
        `/api/admin/projects/${encodeURIComponent(project.id)}?categoria=galeria`,
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
        <h2>Editar &ldquo;{project.alt || "imagem"}&rdquo;</h2>
        <form className="admin-project-form" onSubmit={handleSubmit}>
          <label>
            Legenda (opcional)
            <input value={alt} onChange={(e) => setAlt(e.target.value)} />
          </label>

          <div className="admin-field">
            <label>Imagem atual</label>
            {/* eslint-disable-next-line @next/next/no-img-element -- small admin preview thumbnail */}
            <img src={project.src} alt="" className="admin-current-image" />
          </div>

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
