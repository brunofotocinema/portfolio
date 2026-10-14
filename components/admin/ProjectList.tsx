"use client";

import { useEffect, useMemo, useState } from "react";
import type { Comercial, Filme } from "@/lib/data";
import { buscarFichaImdb, fichaVazia, type FichaFilme } from "@/lib/imdb-client";

type EditableField = "titulo" | "ano" | "url";
export type FilmeField = EditableField | "imdb" | "direcao" | "fotografia" | "produtora";

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
  onFieldChangeFilme: (id: string, field: FilmeField, value: string) => void;
  onApplyFichaFilme: (id: string, ficha: FichaFilme) => void;
  onLogoFileChange: (id: string, file: File | null) => void;
  onBannerFileChange: (id: string, file: File | null) => void;
  onToggleDeleteComercial: (id: string) => void;
  onToggleDeleteFilme: (id: string) => void;
  onFieldChangeExtra: (comercialId: string, extraId: string, field: EditableField, value: string) => void;
  onAddExtra: (comercialId: string) => void;
  onRemoveExtra: (comercialId: string, extraId: string) => void;
  onPromoteExtra: (comercialId: string, extraId: string) => void;
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
  pendingBanner,
  onMove,
  onFieldChange,
  onLogoFileChange,
  onBannerFileChange,
  onToggleDelete,
  onFieldChangeExtra,
  onAddExtra,
  onRemoveExtra,
  onPromoteExtra,
}: {
  comercial: Comercial;
  index: number;
  total: number;
  deleted: boolean;
  pendingLogo: File | undefined;
  pendingBanner: File | undefined;
  onMove: (direction: -1 | 1) => void;
  onFieldChange: (field: EditableField, value: string) => void;
  onLogoFileChange: (file: File | null) => void;
  onBannerFileChange: (file: File | null) => void;
  onToggleDelete: () => void;
  onFieldChangeExtra: (extraId: string, field: EditableField, value: string) => void;
  onAddExtra: () => void;
  onRemoveExtra: (extraId: string) => void;
  onPromoteExtra: (extraId: string) => void;
}) {
  const previewUrl = useObjectUrl(pendingLogo);
  const bannerPreviewUrl = useObjectUrl(pendingBanner);
  const extras = comercial.extras ?? [];

  return (
    <li className={`admin-draft-item${deleted ? " admin-draft-item-deleted" : ""}`}>
      <div className="admin-draft-row">
        {/* eslint-disable-next-line @next/next/no-img-element -- small admin list thumbnail */}
        <img className="admin-draft-thumb" src={previewUrl ?? comercial.logo} alt="" />
        <label className="admin-draft-file">
          Trocar logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={deleted}
            onChange={(e) => onLogoFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {/* eslint-disable-next-line @next/next/no-img-element -- small admin list thumbnail */}
        <img
          className="admin-draft-thumb"
          src={bannerPreviewUrl ?? comercial.banner ?? undefined}
          alt=""
        />
        <label className="admin-draft-file">
          Trocar thumbnail do card
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={deleted}
            onChange={(e) => onBannerFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
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

      <div className="admin-marca-videos">
        <div className="admin-video-row">
          <span className="admin-video-badge">Principal</span>
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
        </div>

        {extras.map((extra) => (
          <div key={extra.id} className="admin-video-row">
            <input
              value={extra.titulo}
              onChange={(e) => onFieldChangeExtra(extra.id, "titulo", e.target.value)}
              disabled={deleted}
              placeholder="Título"
            />
            <input
              type="number"
              value={extra.ano ?? ""}
              onChange={(e) => onFieldChangeExtra(extra.id, "ano", e.target.value)}
              disabled={deleted}
              placeholder="Ano"
            />
            <input
              type="url"
              value={extra.url}
              onChange={(e) => onFieldChangeExtra(extra.id, "url", e.target.value)}
              disabled={deleted}
              placeholder="Link do vídeo"
            />
            <div className="admin-video-actions">
              <button type="button" onClick={() => onPromoteExtra(extra.id)} disabled={deleted}>
                Tornar principal
              </button>
              <button type="button" onClick={() => onRemoveExtra(extra.id)} disabled={deleted}>
                Remover
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="admin-add-video-btn" onClick={onAddExtra} disabled={deleted}>
          + Novo link
        </button>
      </div>
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
  onApplyFicha,
}: {
  filme: Filme;
  index: number;
  total: number;
  deleted: boolean;
  pendingBanner: File | undefined;
  onMove: (direction: -1 | 1) => void;
  onFieldChange: (field: FilmeField, value: string) => void;
  onBannerFileChange: (file: File | null) => void;
  onToggleDelete: () => void;
  onApplyFicha: (ficha: FichaFilme) => void;
}) {
  const previewUrl = useObjectUrl(pendingBanner);
  const [buscando, setBuscando] = useState(false);
  const [buscaMsg, setBuscaMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function buscar() {
    setBuscando(true);
    setBuscaMsg(null);
    try {
      const ficha = await buscarFichaImdb(filme.imdb ?? "");
      onApplyFicha(ficha);
      setBuscaMsg(
        fichaVazia(ficha)
          ? { ok: false, text: "O TMDB ainda não tem a ficha desse título. Só o link do IMDb foi guardado; preencha o resto à mão." }
          : { ok: true, text: "Ficha atualizada (título e ano mantidos)." }
      );
    } catch (err) {
      setBuscaMsg({ ok: false, text: err instanceof Error ? err.message : "Falha na busca." });
    } finally {
      setBuscando(false);
    }
  }

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
            value={filme.url ?? ""}
            onChange={(e) => onFieldChange("url", e.target.value)}
            disabled={deleted}
            placeholder="Link do vídeo (opcional)"
          />
          <div className="admin-imdb-row">
            <input
              type="url"
              value={filme.imdb ?? ""}
              onChange={(e) => onFieldChange("imdb", e.target.value)}
              disabled={deleted}
              placeholder="Link do IMDb (vazio = ainda não lançado)"
            />
            <button type="button" onClick={buscar} disabled={deleted || buscando || !filme.imdb?.trim()}>
              {buscando ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {buscaMsg && (
            <p className={buscaMsg.ok ? "admin-success" : "admin-error"}>{buscaMsg.text}</p>
          )}
          <input
            value={filme.direcao ?? ""}
            onChange={(e) => onFieldChange("direcao", e.target.value)}
            disabled={deleted}
            placeholder="Direção"
          />
          <input
            value={filme.fotografia ?? ""}
            onChange={(e) => onFieldChange("fotografia", e.target.value)}
            disabled={deleted}
            placeholder="Direção de fotografia"
          />
          <input
            value={filme.produtora ?? ""}
            onChange={(e) => onFieldChange("produtora", e.target.value)}
            disabled={deleted}
            placeholder="Produtora"
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
  onApplyFichaFilme,
  onLogoFileChange,
  onBannerFileChange,
  onToggleDeleteComercial,
  onToggleDeleteFilme,
  onFieldChangeExtra,
  onAddExtra,
  onRemoveExtra,
  onPromoteExtra,
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
            pendingBanner={pendingBannerFiles[c.id]}
            onMove={(direction) => onMoveComercial(index, direction)}
            onFieldChange={(field, value) => onFieldChangeComercial(c.id, field, value)}
            onLogoFileChange={(file) => onLogoFileChange(c.id, file)}
            onBannerFileChange={(file) => onBannerFileChange(c.id, file)}
            onToggleDelete={() => onToggleDeleteComercial(c.id)}
            onFieldChangeExtra={(extraId, field, value) =>
              onFieldChangeExtra(c.id, extraId, field, value)
            }
            onAddExtra={() => onAddExtra(c.id)}
            onRemoveExtra={(extraId) => onRemoveExtra(c.id, extraId)}
            onPromoteExtra={(extraId) => onPromoteExtra(c.id, extraId)}
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
            onApplyFicha={(ficha) => onApplyFichaFilme(f.id, ficha)}
          />
        ))}
        {filmes.length === 0 && <li>Nenhum projeto.</li>}
      </ul>
    </div>
  );
}
