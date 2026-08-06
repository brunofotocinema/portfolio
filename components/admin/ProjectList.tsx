"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import type { Comercial, Filme } from "@/lib/data";

type EditableField = "titulo" | "ano" | "url";

interface ProjectListProps {
  comerciais: Comercial[];
  filmes: Filme[];
  deletedComerciais: Set<string>;
  deletedFilmes: Set<string>;
  pendingLogoFiles: Record<string, File>;
  pendingBannerFiles: Record<string, File>;
  onMoveComercial: (index: number, direction: -1 | 1) => void;
  onMoveFilme: (index: number, direction: -1 | 1) => void;
  onFieldChangeComercial: (id: string, field: EditableField, value: string) => void;
  onFieldChangeFilme: (id: string, field: EditableField, value: string) => void;
  onLogoFileChange: (id: string, file: File | null) => void;
  onBannerFileChange: (id: string, file: File | null) => void;
  onToggleDeleteComercial: (id: string) => void;
  onToggleDeleteFilme: (id: string) => void;
  onExtraRemoved: (comercialId: string, extraId: string) => void;
}

function useObjectUrl(file: File | undefined): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}

function ComercialRow({
  comercial,
  index,
  total,
  deleted,
  pendingLogo,
  onMove,
  onFieldChange,
  onLogoFileChange,
  onToggleDelete,
  onExtraRemoved,
}: {
  comercial: Comercial;
  index: number;
  total: number;
  deleted: boolean;
  pendingLogo: File | undefined;
  onMove: (direction: -1 | 1) => void;
  onFieldChange: (field: EditableField, value: string) => void;
  onLogoFileChange: (file: File | null) => void;
  onToggleDelete: () => void;
  onExtraRemoved: (extraId: string) => void;
}) {
  const previewUrl = useObjectUrl(pendingLogo);
  const [busyExtraId, setBusyExtraId] = useState<string | null>(null);
  const [extraError, setExtraError] = useState<string | null>(null);

  async function handleRemoveExtra(extraId: string, titulo: string) {
    if (!confirm(`Remover o vídeo extra "${titulo}"?`)) return;
    setBusyExtraId(extraId);
    setExtraError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("no-user");
      const idToken = await user.getIdToken();
      const params = new URLSearchParams({ categoria: "publicidade", parentId: comercial.id });
      const res = await fetch(
        `/api/admin/projects/${encodeURIComponent(extraId)}?${params.toString()}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${idToken}` } }
      );
      const json = await res.json();
      if (!res.ok) {
        setExtraError(json.error ?? "Erro ao remover.");
        return;
      }
      onExtraRemoved(extraId);
    } catch {
      setExtraError("Erro de rede ao remover.");
    } finally {
      setBusyExtraId(null);
    }
  }

  return (
    <li className={`admin-draft-item${deleted ? " admin-draft-item-deleted" : ""}`}>
      <div className="admin-draft-row">
        {/* eslint-disable-next-line @next/next/no-img-element -- small admin list thumbnail */}
        <img className="admin-draft-thumb" src={previewUrl ?? comercial.logo} alt="" />
        <div className="admin-draft-fields">
          <input
            value={comercial.titulo}
            onChange={(e) => onFieldChange("titulo", e.target.value)}
            disabled={deleted}
            placeholder="Título"
          />
          <input
            type="number"
            value={comercial.ano}
            onChange={(e) => onFieldChange("ano", e.target.value)}
            disabled={deleted}
            placeholder="Ano"
          />
          <input
            type="url"
            value={comercial.url}
            onChange={(e) => onFieldChange("url", e.target.value)}
            disabled={deleted}
            placeholder="Link do vídeo"
          />
          <label className="admin-draft-file">
            Trocar logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={deleted}
              onChange={(e) => onLogoFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="admin-item-actions">
          <div className="admin-order-btns">
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0 || deleted}>
              ▲
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === total - 1 || deleted}
            >
              ▼
            </button>
          </div>
          <button type="button" onClick={onToggleDelete}>
            {deleted ? "Desfazer" : "Remover"}
          </button>
        </div>
      </div>

      {extraError && <p className="admin-error">{extraError}</p>}

      {comercial.extras && comercial.extras.length > 0 && (
        <ul className="admin-project-extras">
          {comercial.extras.map((extra) => (
            <li key={extra.id}>
              <span>
                ↳ {extra.titulo}
                {extra.ano ? ` (${extra.ano})` : ""}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveExtra(extra.id, extra.titulo)}
                disabled={busyExtraId === extra.id}
              >
                {busyExtraId === extra.id ? "Removendo..." : "Remover"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function FilmeRow({
  filme,
  index,
  total,
  deleted,
  pendingBanner,
  onMove,
  onFieldChange,
  onBannerFileChange,
  onToggleDelete,
}: {
  filme: Filme;
  index: number;
  total: number;
  deleted: boolean;
  pendingBanner: File | undefined;
  onMove: (direction: -1 | 1) => void;
  onFieldChange: (field: EditableField, value: string) => void;
  onBannerFileChange: (file: File | null) => void;
  onToggleDelete: () => void;
}) {
  const previewUrl = useObjectUrl(pendingBanner);

  return (
    <li className={`admin-draft-item${deleted ? " admin-draft-item-deleted" : ""}`}>
      <div className="admin-draft-row">
        {/* eslint-disable-next-line @next/next/no-img-element -- small admin list thumbnail */}
        <img
          className="admin-draft-thumb"
          src={previewUrl ?? filme.banner ?? filme.poster ?? undefined}
          alt=""
        />
        <div className="admin-draft-fields">
          <input
            value={filme.titulo}
            onChange={(e) => onFieldChange("titulo", e.target.value)}
            disabled={deleted}
            placeholder="Título"
          />
          <input
            type="number"
            value={filme.ano}
            onChange={(e) => onFieldChange("ano", e.target.value)}
            disabled={deleted}
            placeholder="Ano"
          />
          <input
            type="url"
            value={filme.url}
            onChange={(e) => onFieldChange("url", e.target.value)}
            disabled={deleted}
            placeholder="Link do vídeo"
          />
          <label className="admin-draft-file">
            Trocar banner
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={deleted}
              onChange={(e) => onBannerFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="admin-item-actions">
          <div className="admin-order-btns">
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0 || deleted}>
              ▲
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === total - 1 || deleted}
            >
              ▼
            </button>
          </div>
          <button type="button" onClick={onToggleDelete}>
            {deleted ? "Desfazer" : "Remover"}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function ProjectList({
  comerciais,
  filmes,
  deletedComerciais,
  deletedFilmes,
  pendingLogoFiles,
  pendingBannerFiles,
  onMoveComercial,
  onMoveFilme,
  onFieldChangeComercial,
  onFieldChangeFilme,
  onLogoFileChange,
  onBannerFileChange,
  onToggleDeleteComercial,
  onToggleDeleteFilme,
  onExtraRemoved,
}: ProjectListProps) {
  return (
    <div className="admin-project-list">
      <h2>Comerciais</h2>
      <ul className="admin-draft-list">
        {comerciais.map((c, index) => (
          <ComercialRow
            key={c.id}
            comercial={c}
            index={index}
            total={comerciais.length}
            deleted={deletedComerciais.has(c.id)}
            pendingLogo={pendingLogoFiles[c.id]}
            onMove={(direction) => onMoveComercial(index, direction)}
            onFieldChange={(field, value) => onFieldChangeComercial(c.id, field, value)}
            onLogoFileChange={(file) => onLogoFileChange(c.id, file)}
            onToggleDelete={() => onToggleDeleteComercial(c.id)}
            onExtraRemoved={(extraId) => onExtraRemoved(c.id, extraId)}
          />
        ))}
        {comerciais.length === 0 && <li>Nenhum projeto.</li>}
      </ul>

      <h2>Filmes e Séries</h2>
      <ul className="admin-draft-list">
        {filmes.map((f, index) => (
          <FilmeRow
            key={f.id}
            filme={f}
            index={index}
            total={filmes.length}
            deleted={deletedFilmes.has(f.id)}
            pendingBanner={pendingBannerFiles[f.id]}
            onMove={(direction) => onMoveFilme(index, direction)}
            onFieldChange={(field, value) => onFieldChangeFilme(f.id, field, value)}
            onBannerFileChange={(file) => onBannerFileChange(f.id, file)}
            onToggleDelete={() => onToggleDeleteFilme(f.id)}
          />
        ))}
        {filmes.length === 0 && <li>Nenhum projeto.</li>}
      </ul>
    </div>
  );
}
