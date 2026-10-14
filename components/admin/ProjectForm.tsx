"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import LogoUploader from "./LogoUploader";
import { CATEGORIA_LABEL, type Categoria } from "@/lib/admin-types";
import { buscarFichaImdb } from "@/lib/imdb-client";
import type { Comercial } from "@/lib/data";

interface ProjectFormProps {
  /** marcas já publicadas, para "mais um vídeo de marca existente" */
  marcas: Comercial[];
  onCreated: () => void;
}

const initialFields = {
  titulo: "",
  ano: "",
  videoUrl: "",
  imdb: "",
  direcao: "",
  fotografia: "",
  produtora: "",
};

const TIPOS: Categoria[] = ["publicidade", "filmes-series", "galeria"];

/**
 * Guided "add" flow: pick what to add, then each field only shows up once the
 * one before it is filled, so the form never shows more than the next step.
 */
export default function ProjectForm({ marcas, onCreated }: ProjectFormProps) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  // comerciais: null = ainda não respondeu "é uma marca nova?"
  const [marcaNova, setMarcaNova] = useState<boolean | null>(null);
  const [marcaId, setMarcaId] = useState("");
  // filmes: null = ainda não respondeu "já foi lançado?"
  const [lancado, setLancado] = useState<boolean | null>(null);
  // filme lançado: ficha liberada depois da busca no IMDb (ou "preencher à mão")
  const [fichaAberta, setFichaAberta] = useState(false);
  const [fields, setFields] = useState(initialFields);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  // what the IMDb lookup brought that has no input of its own
  const [poster, setPoster] = useState<string | null>(null);
  const [duracao, setDuracao] = useState<number | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof typeof initialFields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function recomecar() {
    setCategoria(null);
    setMarcaNova(null);
    setMarcaId("");
    setLancado(null);
    setFichaAberta(false);
    setFields(initialFields);
    setLogoFile(null);
    setBannerFile(null);
    setImagemFile(null);
    setPoster(null);
    setDuracao(null);
    setError(null);
  }

  function escolherTipo(value: Categoria) {
    recomecar();
    setSuccess(null);
    setCategoria(value);
  }

  async function buscarImdb() {
    setError(null);
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
      setFichaAberta(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível buscar no IMDb.");
    } finally {
      setBuscando(false);
    }
  }

  const temTitulo = !!fields.titulo.trim();
  const temAno = !!fields.ano.trim() && !Number.isNaN(Number(fields.ano));
  const isFilmeLancado = categoria === "filmes-series" && lancado === true;
  const isFilmeEmFinalizacao = categoria === "filmes-series" && lancado === false;
  const isVideoDeMarca = categoria === "publicidade" && marcaNova === false;
  const marcaEscolhida = marcas.find((m) => m.id === marcaId);

  function escolherMarca(id: string) {
    setMarcaId(id);
    // o vídeo começa com o nome da marca; dá pra trocar pelo nome da campanha
    update("titulo", marcas.find((m) => m.id === id)?.titulo ?? "");
  }

  function validate(): string | null {
    if (categoria === "galeria") return imagemFile ? null : "Escolha a imagem.";
    if (!temTitulo) return "Título é obrigatório.";
    if (!temAno) return "Ano é obrigatório.";
    if (isFilmeEmFinalizacao) return null;
    if (isFilmeLancado) {
      if (!fields.imdb.trim() && !fields.videoUrl.trim()) return "Informe o link do IMDb ou do vídeo.";
      if (!poster && !bannerFile) return "Sem pôster do IMDb: envie um banner.";
      return null;
    }
    if (!fields.videoUrl.trim()) return "Link do vídeo é obrigatório.";
    if (isVideoDeMarca) return marcaEscolhida ? null : "Escolha a marca.";
    if (!logoFile) return `Logo (PNG) é obrigatória para ${CATEGORIA_LABEL.publicidade}.`;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError || !categoria) {
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
      formData.set("categoria", categoria);

      if (categoria === "galeria") {
        if (fields.titulo.trim()) formData.set("alt", fields.titulo.trim());
        if (imagemFile) formData.set("imagem", imagemFile);
      } else {
        formData.set("titulo", fields.titulo.trim());
        formData.set("ano", fields.ano.trim());
        if (fields.videoUrl.trim()) formData.set("videoUrl", fields.videoUrl.trim());
        if (isVideoDeMarca) formData.set("marcaId", marcaId);
        if (logoFile) formData.set("logo", logoFile);
        if (bannerFile) formData.set("banner", bannerFile);
        if (isFilmeEmFinalizacao) formData.set("emFinalizacao", "true");
        if (categoria === "filmes-series") {
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
        "Publicado! O site leva cerca de 1 a 2 minutos para mostrar a novidade (tempo normal do deploy da Vercel)."
      );
      recomecar();
      onCreated();
    } catch {
      setError("Erro de rede ao salvar o projeto. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const submit = (
    <button type="submit" className="admin-step admin-publicar" disabled={submitting}>
      {submitting ? "Publicando..." : "Publicar"}
    </button>
  );

  return (
    <form className="admin-project-form" onSubmit={handleSubmit}>
      <h2>O que você quer adicionar?</h2>

      <div className="admin-tipos">
        {TIPOS.map((tipo) => (
          <button
            key={tipo}
            type="button"
            className={`admin-tipo${categoria === tipo ? " active" : ""}`}
            onClick={() => escolherTipo(tipo)}
          >
            <strong>{CATEGORIA_LABEL[tipo]}</strong>
          </button>
        ))}
      </div>

      {success && <p className="admin-success">{success}</p>}

      {/* ---------- Comercial: marca nova? → (marca existente | nome + logo) ---------- */}
      {categoria === "publicidade" && (
        <>
          <div className="admin-step">
            <span className="admin-pergunta">É uma marca nova?</span>
            <div className="admin-tipos admin-tipos-sm">
              <button
                type="button"
                className={`admin-tipo${marcaNova === true ? " active" : ""}`}
                onClick={() => {
                  setMarcaNova(true);
                  setMarcaId("");
                  update("titulo", "");
                }}
              >
                <strong>Sim</strong>
              </button>
              <button
                type="button"
                className={`admin-tipo${marcaNova === false ? " active" : ""}`}
                onClick={() => {
                  setMarcaNova(false);
                  update("titulo", "");
                }}
                disabled={marcas.length === 0}
              >
                <strong>Não, já está no site</strong>
              </button>
            </div>
          </div>

          {isVideoDeMarca && (
            <label className="admin-step">
              Marca
              <select value={marcaId} onChange={(e) => escolherMarca(e.target.value)}>
                <option value="" disabled>
                  Escolha a marca
                </option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.titulo}
                  </option>
                ))}
              </select>
            </label>
          )}
          {marcaEscolhida && isVideoDeMarca && (
            <label className="admin-step">
              Nome do vídeo (ex.: nome da campanha)
              <input value={fields.titulo} onChange={(e) => update("titulo", e.target.value)} />
            </label>
          )}

          {marcaNova === true && (
            <label className="admin-step">
              Nome da marca
              <input autoFocus value={fields.titulo} onChange={(e) => update("titulo", e.target.value)} />
            </label>
          )}

          {(marcaNova === true || (isVideoDeMarca && marcaEscolhida)) && temTitulo && (
            <label className="admin-step">
              Ano de lançamento
              <input type="number" value={fields.ano} onChange={(e) => update("ano", e.target.value)} />
            </label>
          )}
          {(marcaNova === true || (isVideoDeMarca && marcaEscolhida)) && temTitulo && temAno && (
            <label className="admin-step">
              Link do vídeo (YouTube ou Vimeo)
              <input
                type="url"
                value={fields.videoUrl}
                onChange={(e) => update("videoUrl", e.target.value)}
                placeholder="https://..."
              />
            </label>
          )}
          {isVideoDeMarca && marcaEscolhida && temTitulo && temAno && fields.videoUrl.trim() && submit}

          {marcaNova === true && temTitulo && temAno && fields.videoUrl.trim() && (
            <div className="admin-step">
              <LogoUploader label="Logo da marca (PNG)" required onChange={setLogoFile} />
            </div>
          )}
          {marcaNova === true && logoFile && submit}
        </>
      )}

      {/* ---------- Filme: lançado? → IMDb → ficha → extras ---------- */}
      {categoria === "filmes-series" && (
        <>
          <div className="admin-step">
            <span className="admin-pergunta">O filme já foi lançado?</span>
            <div className="admin-tipos admin-tipos-sm">
              <button
                type="button"
                className={`admin-tipo${lancado === true ? " active" : ""}`}
                onClick={() => setLancado(true)}
              >
                <strong>Sim</strong>
                <span>Tem página no IMDb</span>
              </button>
              <button
                type="button"
                className={`admin-tipo${lancado === false ? " active" : ""}`}
                onClick={() => setLancado(false)}
              >
                <strong>Ainda não</strong>
                <span>Em finalização — não abre ao clicar</span>
              </button>
            </div>
          </div>

          {isFilmeLancado && (
            <div className="admin-step admin-imdb">
              <label>
                Link do IMDb
                <div className="admin-imdb-row">
                  <input
                    autoFocus
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
              {!fichaAberta && (
                <button type="button" className="admin-link" onClick={() => setFichaAberta(true)}>
                  Não está no IMDb? Preencher à mão
                </button>
              )}
            </div>
          )}

          {isFilmeLancado && fichaAberta && (
            <>
              {poster && (
                <div className="admin-step admin-imdb-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of the TMDB poster */}
                  <img src={poster} alt="" />
                  <span>
                    Confira a ficha abaixo e ajuste o que precisar.
                    <br />
                    {duracao ? `${duracao > 40 ? "Longa" : "Curta"} · ${duracao} min` : "Duração não informada"}
                  </span>
                </div>
              )}
              <label className="admin-step">
                Título
                <input value={fields.titulo} onChange={(e) => update("titulo", e.target.value)} />
              </label>
              <label className="admin-step">
                Ano
                <input type="number" value={fields.ano} onChange={(e) => update("ano", e.target.value)} />
              </label>
              <label className="admin-step">
                Direção
                <input value={fields.direcao} onChange={(e) => update("direcao", e.target.value)} />
              </label>
              <label className="admin-step">
                Direção de fotografia
                <input value={fields.fotografia} onChange={(e) => update("fotografia", e.target.value)} />
              </label>
              <label className="admin-step">
                Produtora
                <input value={fields.produtora} onChange={(e) => update("produtora", e.target.value)} />
              </label>
              {temTitulo && temAno && (
                <>
                  <label className="admin-step">
                    {fields.imdb.trim()
                      ? "Link do vídeo (YouTube) — opcional"
                      : "Link do vídeo (YouTube) — obrigatório sem IMDb"}
                    <input
                      type="url"
                      value={fields.videoUrl}
                      onChange={(e) => update("videoUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="admin-step">
                    {poster ? "Banner — opcional (sem ele, usa o pôster do IMDb)" : "Banner (pôster do filme)"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {submit}
                </>
              )}
            </>
          )}

          {isFilmeEmFinalizacao && (
            <>
              <label className="admin-step">
                Título
                <input autoFocus value={fields.titulo} onChange={(e) => update("titulo", e.target.value)} />
              </label>
              {temTitulo && (
                <label className="admin-step">
                  Ano da filmagem
                  <input type="number" value={fields.ano} onChange={(e) => update("ano", e.target.value)} />
                </label>
              )}
              {temTitulo && temAno && (
                <>
                  <label className="admin-step">
                    Direção — opcional
                    <input value={fields.direcao} onChange={(e) => update("direcao", e.target.value)} />
                  </label>
                  {submit}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ---------- Galeria: imagem → legenda ---------- */}
      {categoria === "galeria" && (
        <>
          <label className="admin-step">
            Imagem
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setImagemFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {imagemFile && (
            <>
              <label className="admin-step">
                Legenda — opcional
                <input value={fields.titulo} onChange={(e) => update("titulo", e.target.value)} />
              </label>
              {submit}
            </>
          )}
        </>
      )}

      {error && <p className="admin-error">{error}</p>}
    </form>
  );
}
