"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import type { ImagemGaleria } from "@/lib/data";
import EditProjectModal from "./EditProjectModal";

interface GaleriaListProps {
  items: ImagemGaleria[];
  onChanged: () => void;
}

export default function GaleriaList({ items, onChanged }: GaleriaListProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ImagemGaleria | null>(null);

  async function handleRemove(e: React.MouseEvent, id: string, label: string) {
    e.stopPropagation();
    if (!confirm(`Remover a imagem "${label}"? Isso commita a remoção direto na branch principal.`))
      return;
    setBusyKey(id);
    setActionError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("no-user");
      const idToken = await user.getIdToken();
      const params = new URLSearchParams({ categoria: "galeria" });
      const res = await fetch(
        `/api/admin/projects/${encodeURIComponent(id)}?${params.toString()}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${idToken}` } }
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

  return (
    <div className="admin-project-list">
      <h2>Galeria</h2>
      {actionError && <p className="admin-error">{actionError}</p>}
      <ul className="admin-gallery-list">
        {items.map((g) => (
          <li
            key={g.id}
            className="admin-project-item-clickable admin-gallery-item"
            onClick={() => setEditing(g)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- small admin list thumbnail */}
            <img src={g.src} alt="" className="admin-gallery-thumb" />
            <span>{g.alt || "(sem legenda)"}</span>
            <button
              type="button"
              onClick={(e) => handleRemove(e, g.id, g.alt || g.id)}
              disabled={busyKey === g.id}
            >
              {busyKey === g.id ? "Removendo..." : "Remover"}
            </button>
          </li>
        ))}
        {items.length === 0 && <li>Nenhuma imagem.</li>}
      </ul>

      {editing && (
        <EditProjectModal
          project={editing}
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
