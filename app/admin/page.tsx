"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginForm from "@/components/admin/LoginForm";
import ProjectForm from "@/components/admin/ProjectForm";
import ProjectList from "@/components/admin/ProjectList";
import AboutForm from "@/components/admin/AboutForm";
import type { Comercial, Filme, ImagemGaleria } from "@/lib/data";
import type { AboutContent } from "@/lib/about";
import "./admin.css";

export interface ProjectsData {
  comerciais: Comercial[];
  filmes: Filme[];
  galeria: ImagemGaleria[];
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [projects, setProjects] = useState<ProjectsData | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [about, setAbout] = useState<AboutContent | null>(null);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [aboutLoading, setAboutLoading] = useState(false);

  useEffect(() => {
    // onAuthStateChanged is a push-based listener from the Firebase SDK,
    // not polling: it fires once on mount and again only on real auth changes.
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    async function run() {
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        const idToken = await user!.getIdToken();
        const res = await fetch("/api/admin/projects", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const json = await res.json();
        if (ignore) return;
        if (!res.ok) {
          setProjectsError(json.error ?? "Erro ao carregar projetos.");
          return;
        }
        setProjects(json);
      } catch {
        if (!ignore) setProjectsError("Erro de rede ao carregar projetos.");
      } finally {
        if (!ignore) setProjectsLoading(false);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [user, reloadToken]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    async function run() {
      setAboutLoading(true);
      setAboutError(null);
      try {
        const idToken = await user!.getIdToken();
        const res = await fetch("/api/admin/about", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const json = await res.json();
        if (ignore) return;
        if (!res.ok) {
          setAboutError(json.error ?? "Erro ao carregar a seção Sobre.");
          return;
        }
        setAbout(json);
      } catch {
        if (!ignore) setAboutError("Erro de rede ao carregar a seção Sobre.");
      } finally {
        if (!ignore) setAboutLoading(false);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [user]);

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
        Ao salvar ou remover um projeto, o app commita direto na branch principal do
        repositório. O deploy na Vercel é automático e leva cerca de 1 a 2 minutos para o
        site refletir a mudança — isso é esperado.
      </p>

      {aboutError && <p className="admin-error">{aboutError}</p>}
      {aboutLoading && !about && <p>Carregando seção Sobre...</p>}
      {about && <AboutForm data={about} onSaved={(next) => setAbout(next)} />}

      <ProjectForm
        existingComerciais={projects?.comerciais ?? []}
        onCreated={() => setReloadToken((n) => n + 1)}
      />
      <ProjectList
        data={projects}
        loading={projectsLoading}
        error={projectsError}
        onChanged={() => setReloadToken((n) => n + 1)}
      />
    </div>
  );
}
