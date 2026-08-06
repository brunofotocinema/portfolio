"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginForm from "@/components/admin/LoginForm";
import ProjectForm from "@/components/admin/ProjectForm";
import ProjectList from "@/components/admin/ProjectList";
import AboutForm from "@/components/admin/AboutForm";
import GaleriaList from "@/components/admin/GaleriaList";
import SaveReviewModal from "@/components/admin/SaveReviewModal";
import { buildChangeSummary } from "@/lib/admin-change-summary";
import type { Comercial, Filme, ImagemGaleria, SiteData } from "@/lib/data";
import type { AboutContent } from "@/lib/about";
import "./admin.css";

type EditableField = "titulo" | "ano" | "url";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [content, setContent] = useState<SiteData | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const [draftAbout, setDraftAbout] = useState<AboutContent | null>(null);
  const [draftComerciais, setDraftComerciais] = useState<Comercial[] | null>(null);
  const [draftFilmes, setDraftFilmes] = useState<Filme[] | null>(null);
  const [galeria, setGaleria] = useState<ImagemGaleria[]>([]);

  const [deletedComerciais, setDeletedComerciais] = useState<Set<string>>(new Set());
  const [deletedFilmes, setDeletedFilmes] = useState<Set<string>>(new Set());
  const [pendingLogoFiles, setPendingLogoFiles] = useState<Record<string, File>>({});
  const [pendingBannerFiles, setPendingBannerFiles] = useState<Record<string, File>>({});

  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // onAuthStateChanged is a push-based listener from the Firebase SDK,
    // not polling: it fires once on mount and again only on real auth changes.
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  async function loadContent(u: User) {
    setContentLoading(true);
    setContentError(null);
    try {
      const idToken = await u.getIdToken();
      const res = await fetch("/api/admin/content", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setContentError(json.error ?? "Erro ao carregar conteúdo.");
        return;
      }
      const data = json as SiteData;
      setContent(data);
      setDraftAbout(data.about);
      setDraftComerciais(data.comerciais);
      setDraftFilmes(data.filmes);
      setGaleria(data.galeria ?? []);
      setDeletedComerciais(new Set());
      setDeletedFilmes(new Set());
      setPendingLogoFiles({});
      setPendingBannerFiles({});
    } catch {
      setContentError("Erro de rede ao carregar conteúdo.");
    } finally {
      setContentLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    (async () => {
      if (!ignore) await loadContent(user);
    })();
    return () => {
      ignore = true;
    };
  }, [user]);

  const changes = useMemo(() => {
    if (!content || !draftAbout || !draftComerciais || !draftFilmes) return [];
    return buildChangeSummary({
      originalAbout: content.about,
      originalComerciais: content.comerciais,
      originalFilmes: content.filmes,
      draftAbout,
      draftComerciais,
      draftFilmes,
      deletedComerciais,
      deletedFilmes,
      pendingLogoFiles,
      pendingBannerFiles,
    });
  }, [
    content,
    draftAbout,
    draftComerciais,
    draftFilmes,
    deletedComerciais,
    deletedFilmes,
    pendingLogoFiles,
    pendingBannerFiles,
  ]);

  function moveComercial(index: number, direction: -1 | 1) {
    setDraftComerciais((prev) => {
      if (!prev) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function moveFilme(index: number, direction: -1 | 1) {
    setDraftFilmes((prev) => {
      if (!prev) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function fieldChangeComercial(id: string, field: EditableField, value: string) {
    setDraftComerciais(
      (prev) =>
        prev?.map((c) =>
          c.id === id ? { ...c, [field]: field === "ano" ? Number(value) : value } : c
        ) ?? prev
    );
  }

  function fieldChangeFilme(id: string, field: EditableField, value: string) {
    setDraftFilmes(
      (prev) =>
        prev?.map((f) =>
          f.id === id ? { ...f, [field]: field === "ano" ? Number(value) : value } : f
        ) ?? prev
    );
  }

  function logoFileChange(id: string, file: File | null) {
    setPendingLogoFiles((prev) => {
      const next = { ...prev };
      if (file) next[id] = file;
      else delete next[id];
      return next;
    });
  }

  function bannerFileChange(id: string, file: File | null) {
    setPendingBannerFiles((prev) => {
      const next = { ...prev };
      if (file) next[id] = file;
      else delete next[id];
      return next;
    });
  }

  function toggleDeleteComercial(id: string) {
    setDeletedComerciais((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDeleteFilme(id: string) {
    setDeletedFilmes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function extraRemoved(comercialId: string, extraId: string) {
    setDraftComerciais(
      (prev) =>
        prev?.map((c) =>
          c.id === comercialId
            ? { ...c, extras: (c.extras ?? []).filter((e) => e.id !== extraId) }
            : c
        ) ?? prev
    );
  }

  async function handleProjectCreated() {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/content", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (!res.ok) return;
      const data = json as SiteData;
      setContent(data);
      setGaleria(data.galeria ?? []);
      setDraftComerciais((prev) => {
        if (!prev) return data.comerciais;
        const existingIds = new Set(prev.map((c) => c.id));
        const brandNew = data.comerciais.filter((c) => !existingIds.has(c.id));
        return [...prev, ...brandNew];
      });
      setDraftFilmes((prev) => {
        if (!prev) return data.filmes;
        const existingIds = new Set(prev.map((f) => f.id));
        const brandNew = data.filmes.filter((f) => !existingIds.has(f.id));
        return [...prev, ...brandNew];
      });
    } catch {
      // Ignore — the next manual reload (or page refresh) will reconcile.
    }
  }

  async function reloadGaleria() {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/content", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (res.ok) setGaleria((json as SiteData).galeria ?? []);
    } catch {
      // Ignore — the next manual reload (or page refresh) will reconcile.
    }
  }

  function discardChanges() {
    if (!content) return;
    setDraftAbout(content.about);
    setDraftComerciais(content.comerciais);
    setDraftFilmes(content.filmes);
    setDeletedComerciais(new Set());
    setDeletedFilmes(new Set());
    setPendingLogoFiles({});
    setPendingBannerFiles({});
  }

  async function confirmSave() {
    if (!user || !draftAbout || !draftComerciais || !draftFilmes) return;
    setSaving(true);
    setSaveError(null);
    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();
      formData.set("about", JSON.stringify(draftAbout));
      formData.set(
        "comerciais",
        JSON.stringify(draftComerciais.filter((c) => !deletedComerciais.has(c.id)))
      );
      formData.set(
        "filmes",
        JSON.stringify(draftFilmes.filter((f) => !deletedFilmes.has(f.id)))
      );
      for (const [id, file] of Object.entries(pendingLogoFiles)) {
        if (!deletedComerciais.has(id)) formData.append(`logo__${id}`, file);
      }
      for (const [id, file] of Object.entries(pendingBannerFiles)) {
        if (!deletedFilmes.has(id)) formData.append(`banner__${id}`, file);
      }

      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.error ?? "Não foi possível salvar.");
        return;
      }
      setReviewOpen(false);
      await loadContent(user);
    } catch {
      setSaveError("Erro de rede ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="admin-page">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Painel administrativo</h1>
        <div>
          <span>{user.email}</span>
          <button type="button" onClick={() => signOut(auth)}>
            Sair
          </button>
        </div>
      </header>

      <p className="admin-note">
        Adicionar um projeto novo commita direto na branch principal. As demais alterações
        (reordenar, editar campos, remover, e a seção Sobre) ficam num rascunho — só são
        commitadas quando você revisa e confirma em &ldquo;Salvar alterações&rdquo;. O deploy na
        Vercel é automático e leva cerca de 1 a 2 minutos para o site refletir a mudança.
      </p>

      {contentError && <p className="admin-error">{contentError}</p>}
      {contentLoading && !content && <p>Carregando conteúdo...</p>}

      {content && draftAbout && draftComerciais && draftFilmes && (
        <>
          <div className="admin-save-bar">
            <span>
              {changes.length === 0
                ? "Nenhuma alteração pendente."
                : `${changes.length} alteração(ões) pendente(s).`}
            </span>
            <div className="admin-save-bar-actions">
              <button type="button" onClick={discardChanges} disabled={changes.length === 0}>
                Descartar
              </button>
              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                disabled={changes.length === 0}
              >
                Revisar e salvar
              </button>
            </div>
          </div>

          <ProjectForm existingComerciais={draftComerciais} onCreated={handleProjectCreated} />

          <ProjectList
            comerciais={draftComerciais}
            filmes={draftFilmes}
            deletedComerciais={deletedComerciais}
            deletedFilmes={deletedFilmes}
            pendingLogoFiles={pendingLogoFiles}
            pendingBannerFiles={pendingBannerFiles}
            onMoveComercial={moveComercial}
            onMoveFilme={moveFilme}
            onFieldChangeComercial={fieldChangeComercial}
            onFieldChangeFilme={fieldChangeFilme}
            onLogoFileChange={logoFileChange}
            onBannerFileChange={bannerFileChange}
            onToggleDeleteComercial={toggleDeleteComercial}
            onToggleDeleteFilme={toggleDeleteFilme}
            onExtraRemoved={extraRemoved}
          />

          <AboutForm value={draftAbout} onChange={setDraftAbout} />

          <GaleriaList items={galeria} onChanged={reloadGaleria} />
        </>
      )}

      {reviewOpen && (
        <SaveReviewModal
          changes={changes}
          submitting={saving}
          error={saveError}
          onCancel={() => setReviewOpen(false)}
          onConfirm={confirmSave}
        />
      )}
    </div>
  );
}
