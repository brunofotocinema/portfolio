"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import LogoUploader from "./LogoUploader";
import type { Categoria } from "@/lib/admin-types";
import type { Comercial } from "@/lib/data";

interface ProjectFormProps {
  existingComerciais: Comercial[];
  onCreated: () => void;
}

const initialState = {
  categoria: "publicidade" as Categoria,
  titulo: "",
  ano: "",
  videoUrl: "",
  vincularA: "",
  creditosProdutora: "",
  creditosDirecao: "",
  creditosFuncaoBruno: "",
};

export default function ProjectForm({ existingComerciais, onCreated }: ProjectFormProps) {
  const [fields, setFields] = useState(initialState);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof typeof initialState>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setFields(initialState);
    setLogoFile(null);
    setBannerFile(null);
  }

  function validate(): string | null {
    if (!fields.titulo.trim()) return "Título é obrigatório.";
    if (!fields.ano.trim() || Number.isNaN(Number(fields.ano))) return "Ano é obrigatório.";
    if (!fields.videoUrl.trim()) return "Link do vídeo é obrigatório.";

    if (fields.categoria === "publicidade") {
      if (!fields.vincularA && !logoFile) return "Logo (PNG) é obrigatória para Publicidade.";
    } else {
      if (!bannerFile) return "Banner é obrigatório para Filmes e Séries.";
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();

      const formData = new FormData();
      formData.set("categoria", fields.categoria);
      formData.set("titulo", fields.titulo.trim());
      formData.set("ano", fields.ano.trim());
      formData.set("videoUrl", fields.videoUrl.trim());
      if (fields.creditosProdutora.trim())
        formData.set("creditosProdutora", fields.creditosProdutora.trim());
      if (fields.creditosDirecao.trim())
        formData.set("creditosDirecao", fields.creditosDirecao.trim());
      if (fields.creditosFuncaoBruno.trim())
        formData.set("creditosFuncaoBruno", fields.creditosFuncaoBruno.trim());
      if (fields.vincularA) formData.set("vincularA", fields.vincularA);
      if (logoFile) formData.set("logo", logoFile);
      if (bannerFile) formData.set("banner", bannerFile);

      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível salvar o projeto.");
        return;
      }

      setSuccess(
        "Projeto salvo! O commit foi feito no repositório — o site leva cerca de 1 a 2 minutos para atualizar (tempo normal do deploy da Vercel)."
      );
      resetForm();
      onCreated();
    } catch {
      setError("Erro de rede ao salvar o projeto. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-project-form" onSubmit={handleSubmit}>
      <h2>Adicionar projeto</h2>

      <label>
        Categoria *
        <select
          value={fields.categoria}
          onChange={(e) => update("categoria", e.target.value as Categoria)}
        >
          <option value="publicidade">Publicidade</option>
          <option value="filmes-series">Filmes e Séries</option>
        </select>
      </label>

      <label>
        Título *
        <input value={fields.titulo} onChange={(e) => update("titulo", e.target.value)} />
      </label>

      <label>
        Ano *
        <input
          type="number"
          value={fields.ano}
          onChange={(e) => update("ano", e.target.value)}
        />
      </label>

      <label>
        Link do vídeo (YouTube) *
        <input
          type="url"
          value={fields.videoUrl}
          onChange={(e) => update("videoUrl", e.target.value)}
          placeholder="https://..."
        />
      </label>

      {fields.categoria === "publicidade" && existingComerciais.length > 0 && (
        <label>
          Vincular a uma marca já existente? (opcional)
          <select
            value={fields.vincularA}
            onChange={(e) => update("vincularA", e.target.value)}
          >
            <option value="">Não — criar um card novo</option>
            {existingComerciais.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
        </label>
      )}

      {fields.categoria === "publicidade" && fields.vincularA && (
        <p className="admin-note">
          Este vídeo não vai gerar um card novo — ele aparece como vídeo extra da marca
          selecionada, revelado quando alguém clicar no card dela.
        </p>
      )}

      {fields.categoria === "publicidade" && !fields.vincularA ? (
        <LogoUploader label="Logo (PNG)" required onChange={setLogoFile} />
      ) : fields.categoria === "filmes-series" ? (
        <div className="admin-field">
          <label>
            Banner *
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      ) : null}

      <fieldset className="admin-creditos">
        <legend>Créditos (opcional)</legend>
        <label>
          Produtora
          <input
            value={fields.creditosProdutora}
            onChange={(e) => update("creditosProdutora", e.target.value)}
          />
        </label>
        <label>
          Diretor(a) / DP
          <input
            value={fields.creditosDirecao}
            onChange={(e) => update("creditosDirecao", e.target.value)}
          />
        </label>
        <label>
          Função do Bruno
          <input
            value={fields.creditosFuncaoBruno}
            onChange={(e) => update("creditosFuncaoBruno", e.target.value)}
          />
        </label>
      </fieldset>

      {error && <p className="admin-error">{error}</p>}
      {success && <p className="admin-success">{success}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Salvando..." : "Adicionar projeto"}
      </button>
    </form>
  );
}
