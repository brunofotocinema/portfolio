"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { CATEGORIA_LABEL, type Categoria } from "@/lib/admin-types";
import type { ProjectsData } from "@/app/admin/page";
import type { Comercial, Filme, ImagemGaleria } from "@/lib/data";
import EditProjectModal from "./EditProjectModal";

interface ProjectListProps {
  data: ProjectsData | null;
  loading: boolean;
  error: string | null;
  onChanged: () => void;
}

export default function ProjectList({ data, loading, error, onChanged }: ProjectListProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    categoria: Categoria;
    project: Comercial | Filme | ImagemGaleria;
  } | null>(null);

  async function removeRequest(
    id: string,
    categoria: Categoria,
    parentId: string | undefined,
    busyKeyValue: string
  ) {
    setBusyKey(busyKeyValue);
    setActionError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("no-user");
      const idToken = await user.getIdToken();
      const params = new URLSearchParams({ categoria });
      if (parentId) params.set("parentId", parentId);
      const res = await fetch(
        `/api/admin/projects/${encodeURIComponent(id)}?${params.toString()}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "Erro ao remover.");
        return;
      }
      onChanged();
    } catch {
      setActionError("Erro de rede ao remover.");
    } finally {
      setBusyKey(null);
    }
  }

  function handleRemoveComercial(e: React.MouseEvent, id: string, titulo: string) {
    e.stopPropagation();
    if (!confirm(`Remover "${titulo}"? Isso commita a remoção direto na branch principal.`)) return;
    removeRequest(id, "publicidade", undefined, `comercial:${id}`);
  }

  function handleRemoveFilme(e: React.MouseEvent, id: string, titulo: string) {
    e.stopPropagation();
    if (!confirm(`Remover "${titulo}"? Isso commita a remoção direto na branch principal.`)) return;
    removeRequest(id, "filmes-series", undefined, `filme:${id}`);
  }

  function handleRemoveExtra(parentId: string, extraId: string, titulo: string) {
    if (!confirm(`Remover o vídeo extra "${titulo}"?`)) return;
    removeRequest(extraId, "publicidade", parentId, `extra:${extraId}`);
  }

  function handleRemoveGaleria(e: React.MouseEvent, id: string, label: string) {
    e.stopPropagation();
    if (!confirm(`Remover a imagem "${label}"? Isso commita a remoção direto na branch principal.`))
      return;
    removeRequest(id, "galeria", undefined, `galeria:${id}`);
  }

  return (
    <div className="admin-project-list">
      <h2>Projetos existentes</h2>
      {error && <p className="admin-error">{error}</p>}
      {actionError && <p className="admin-error">{actionError}</p>}
      {loading && !data && <p>Carregando projetos...</p>}

      {data && (
        <>
          <h3>{CATEGORIA_LABEL.publicidade}</h3>
          <ul>
            {data.comerciais.map((c) => (
              <li key={c.id} className="admin-project-item">
                <div
                  className="admin-project-item-row admin-project-item-clickable"
                  onClick={() => setEditing({ categoria: "publicidade", project: c })}
                >
                  <span>
                    {c.titulo} ({c.ano})
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveComercial(e, c.id, c.titulo)}
                    disabled={busyKey === `comercial:${c.id}`}
                  >
                    {busyKey === `comercial:${c.id}` ? "Removendo..." : "Remover"}
                  </button>
                </div>
                {c.extras && c.extras.length > 0 && (
                  <ul className="admin-project-extras">
                    {c.extras.map((extra) => (
                      <li key={extra.id}>
                        <span>
                          ↳ {extra.titulo}
                          {extra.ano ? ` (${extra.ano})` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtra(c.id, extra.id, extra.titulo)}
                          disabled={busyKey === `extra:${extra.id}`}
                        >
                          {busyKey === `extra:${extra.id}` ? "Removendo..." : "Remover"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {data.comerciais.length === 0 && <li>Nenhum projeto.</li>}
          </ul>

          <h3>{CATEGORIA_LABEL["filmes-series"]}</h3>
          <ul>
            {data.filmes.map((f) => (
              <li
                key={f.id}
                className="admin-project-item-clickable"
                onClick={() => setEditing({ categoria: "filmes-series", project: f })}
              >
                <span>
                  {f.titulo} ({f.ano})
                </span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveFilme(e, f.id, f.titulo)}
                  disabled={busyKey === `filme:${f.id}`}
                >
                  {busyKey === `filme:${f.id}` ? "Removendo..." : "Remover"}
                </button>
              </li>
            ))}
            {data.filmes.length === 0 && <li>Nenhum projeto.</li>}
          </ul>

          <h3>{CATEGORIA_LABEL.galeria}</h3>
          <ul className="admin-gallery-list">
            {data.galeria.map((g) => (
              <li
                key={g.id}
                className="admin-project-item-clickable admin-gallery-item"
                onClick={() => setEditing({ categoria: "galeria", project: g })}
              >
                <img src={g.src} alt="" className="admin-gallery-thumb" />
                <span>{g.alt || "(sem legenda)"}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveGaleria(e, g.id, g.alt || g.id)}
                  disabled={busyKey === `galeria:${g.id}`}
                >
                  {busyKey === `galeria:${g.id}` ? "Removendo..." : "Remover"}
                </button>
              </li>
            ))}
            {data.galeria.length === 0 && <li>Nenhuma imagem.</li>}
          </ul>
        </>
      )}

      {editing && (
        <EditProjectModal
          categoria={editing.categoria}
          project={editing.project}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
