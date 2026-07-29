"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type { Comercial, Filme } from "@/lib/data";
import { CATEGORIA_LABEL, type Categoria } from "@/lib/admin-types";

interface ProjectsData {
  comerciais: Comercial[];
  filmes: Filme[];
}

export default function ProjectList({ reloadToken }: { reloadToken: number }) {
  const [data, setData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [localReload, setLocalReload] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();
        const res = await fetch("/api/admin/projects", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const json = await res.json();
        if (ignore) return;
        if (!res.ok) {
          setError(json.error ?? "Erro ao carregar projetos.");
          return;
        }
        setData(json);
      } catch {
        if (!ignore) setError("Erro de rede ao carregar projetos.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [reloadToken, localReload]);

  async function handleRemove(id: string, categoria: Categoria, titulo: string) {
    if (!confirm(`Remover "${titulo}"? Isso commita a remoção direto na branch principal.`)) {
      return;
    }
    setRemovingId(id);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("no-user");
      const idToken = await user.getIdToken();
      const res = await fetch(
        `/api/admin/projects/${encodeURIComponent(id)}?categoria=${categoria}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao remover projeto.");
        return;
      }
      setLocalReload((n) => n + 1);
    } catch {
      setError("Erro de rede ao remover projeto.");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading && !data) return <p>Carregando projetos...</p>;

  return (
    <div className="admin-project-list">
      <h2>Projetos existentes</h2>
      {error && <p className="admin-error">{error}</p>}

      {data && (
        <>
          <h3>{CATEGORIA_LABEL.publicidade}</h3>
          <ul>
            {data.comerciais.map((c) => (
              <li key={c.id}>
                <span>
                  {c.titulo} ({c.ano})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(c.id, "publicidade", c.titulo)}
                  disabled={removingId === c.id}
                >
                  {removingId === c.id ? "Removendo..." : "Remover"}
                </button>
              </li>
            ))}
            {data.comerciais.length === 0 && <li>Nenhum projeto.</li>}
          </ul>

          <h3>{CATEGORIA_LABEL["filmes-series"]}</h3>
          <ul>
            {data.filmes.map((f) => (
              <li key={f.id}>
                <span>
                  {f.titulo} ({f.ano})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(f.id, "filmes-series", f.titulo)}
                  disabled={removingId === f.id}
                >
                  {removingId === f.id ? "Removendo..." : "Remover"}
                </button>
              </li>
            ))}
            {data.filmes.length === 0 && <li>Nenhum projeto.</li>}
          </ul>
        </>
      )}
    </div>
  );
}
