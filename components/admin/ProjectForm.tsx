"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import LogoUploader from "./LogoUploader";
import { CATEGORIA_LABEL, type Categoria } from "@/lib/admin-types";
import { buscarFichaImdb } from "@/lib/imdb-client";

interface ProjectFormProps {
  onCreated: () => void;
}

const initialState = {
  categoria: "publicidade" as Categoria,
  titulo: "",
  ano: "",
  videoUrl: "",
  imdb: "",
  direcao: "",
  fotografia: "",
  produtora: "",
};

export default function ProjectForm({ onCreated }: ProjectFormProps) {
  const [fields, setFields] = useState(initialState);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [emFinalizacao, setEmFinalizacao] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // what the IMDb lookup brought that has no input of its own
  const [poster, setPoster] = useState<string | null>(null);
  const [duracao, setDuracao] = useState<number | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [buscaInfo, setBuscaInfo] = useState<string | null>(null);

  function update<K extends keyof typeof initialState>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setFields(initialState);
    setLogoFile(null);
    setBannerFile(null);
    setImagemFile(null);
    setEmFinalizacao(false);
    setPoster(null);
    setDuracao(null);
    setBuscaInfo(null);
  }

  async function buscarImdb() {
    setError(null);
    setBuscaInfo(null);
    setBuscando(true);
    try {
      const ficha = await buscarFichaImdb(fields.imdb);
      setFields((prev) => ({
        ...prev,
        imdb: ficha.imdb,
        titulo: ficha.titulo,
        ano: ficha.ano ? String(ficha.ano) : prev.ano,
        direcao: ficha.direcao ?? "",
        fotografia: ficha.fotografia ?? "",
        produtora: ficha.produtora ?? "",
      }));
      setPoster(ficha.poster ?? null);
      setDuracao(ficha.duracao ?? null);
      setBuscaInfo("Ficha preenchida. Confira e ajuste o que precisar antes de salvar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível buscar no IMDb.");
    } finally {
      setBuscando(false);
    }
  }

  const isFilmeEmFinalizacao = fields.categoria === "filmes-series" && emFinalizacao;
  const isFilmeLancado = fields.categoria === "filmes-series" && !emFinalizacao;

  function validate(): string | null {
    if (fields.categoria === "galeria") {
      if (!imagemFile) return "Imagem é obrigatória para Galeria.";
      return null;
    }

    if (!fields.titulo.trim()) return "Título é obrigatório.";
    if (!fields.ano.trim() || Number.isNaN(Number(fields.ano))) return "Ano é obrigatório.";

    if (isFilmeEmFinalizacao) return null;

    if (isFilmeLancado) {
      if (!fields.imdb.trim() && !fields.videoUrl.trim()) {
        return "Informe o link do IMDb ou do vídeo.";
      }
      if (!poster && !bannerFile) return "Sem pôster do IMDb: envie um banner.";
      return null;
    }

    if (!fields.videoUrl.trim()) return "Link do vídeo é obrigatório.";
    if (!logoFile) return `Logo (PNG) é obrigatória para ${CATEGORIA_LABEL.publicidade}.`;

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

      if (fields.categoria === "galeria") {
        if (fields.titulo.trim()) formData.set("alt", fields.titulo.trim());
        if (imagemFile) formData.set("imagem", imagemFile);
      } else {
        formData.set("titulo", fields.titulo.trim());
        formData.set("ano", fields.ano.trim());
        if (fields.videoUrl.trim()) formData.set("videoUrl", fields.videoUrl.trim());
        if (logoFile) formData.set("logo", logoFile);
        if (bannerFile) formData.set("banner", bannerFile);
        if (isFilmeEmFinalizacao) formData.set("emFinalizacao", "true");
        if (fields.categoria === "filmes-series") {
          for (const key of ["imdb", "direcao", "fotografia", "produtora"] as const) {
            if (fields[key].trim()) formData.set(key, fields[key].trim());
          }
          if (isFilmeLancado && poster) formData.set("poster", poster);
          if (isFilmeLancado && duracao) formData.set("duracao", String(duracao));
        }
      }

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

      {fields.categoria === "publicidade" && (
        <p className="admin-note">
          Aqui só se cria marca nova. Pra acrescentar mais um vídeo a uma marca que já existe, vá
          até o card dela lá embaixo e use “+ Novo link”.
        </p>
      )}

      <label>
        Categoria *
        <select
          value={fields.categoria}
          onChange={(e) => update("categoria", e.target.value as Categoria)}
        >
          <option value="publicidade">{CATEGORIA_LABEL.publicidade}</option>
          <option value="filmes-series">{CATEGORIA_LABEL["filmes-series"]}</option>
          <option value="galeria">{CATEGORIA_LABEL.galeria}</option>
        </select>
      </label>

      {fields.categoria === "filmes-series" && (
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={emFinalizacao}
            onChange={(e) => setEmFinalizacao(e.target.checked)}
          />
          Ainda sem lançamento (em finalização) — entra só com título, ano da filmagem e, se
          quiser, a direção. No site, não abre ao clicar.
        </label>
      )}

      {isFilmeLancado && (
        <div className="admin-imdb">
          <label>
            Link do IMDb
            <div className="admin-imdb-row">
              <input
                type="url"
                value={fields.imdb}
                onChange={(e) => update("imdb", e.target.value)}
                placeholder="https://www.imdb.com/title/tt..."
              />
              <button type="button" onClick={buscarImdb} disabled={buscando || !fields.imdb.trim()}>
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </label>
          {buscaInfo && <p className="admin-success">{buscaInfo}</p>}
          {poster && (
            <div className="admin-imdb-preview">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of the TMDB poster */}
              <img src={poster} alt="" />
              <span>
                {duracao ? `${duracao > 40 ? "Longa" : "Curta"} · ${duracao} min` : "Duração não informada"}
              </span>
            </div>
          )}
        </div>
      )}

      <label>
        {fields.categoria === "galeria" ? "Legenda (opcional)" : "Título *"}
        <input value={fields.titulo} onChange={(e) => update("titulo", e.target.value)} />
      </label>

      {fields.categoria !== "galeria" && (
        <label>
          {isFilmeEmFinalizacao ? "Ano da filmagem *" : "Ano *"}
          <input
            type="number"
            value={fields.ano}
            onChange={(e) => update("ano", e.target.value)}
          />
        </label>
      )}

      {fields.categoria === "filmes-series" && (
        <label>
          Direção
          <input value={fields.direcao} onChange={(e) => update("direcao", e.target.value)} />
        </label>
      )}

      {isFilmeLancado && (
        <>
          <label>
            Direção de fotografia
            <input value={fields.fotografia} onChange={(e) => update("fotografia", e.target.value)} />
          </label>
          <label>
            Produtora
            <input value={fields.produtora} onChange={(e) => update("produtora", e.target.value)} />
          </label>
        </>
      )}

      {fields.categoria !== "galeria" && !isFilmeEmFinalizacao && (
        <label>
          {isFilmeLancado ? "Link do vídeo (YouTube) — opcional" : "Link do vídeo (YouTube) *"}
          <input
            type="url"
            value={fields.videoUrl}
            onChange={(e) => update("videoUrl", e.target.value)}
            placeholder="https://..."
          />
        </label>
      )}

      {fields.categoria === "publicidade" ? (
        <LogoUploader label="Logo (PNG)" required onChange={setLogoFile} />
      ) : fields.categoria === "filmes-series" && !isFilmeEmFinalizacao ? (
        <div className="admin-field">
          <label>
            {poster ? "Banner (opcional — sem ele, usa o pôster do IMDb)" : "Banner *"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      ) : fields.categoria === "galeria" ? (
        <div className="admin-field">
          <label>
            Imagem *
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setImagemFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      ) : null}

      {error && <p className="admin-error">{error}</p>}
      {success && <p className="admin-success">{success}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Salvando..." : "Adicionar projeto"}
      </button>
    </form>
  );
}
