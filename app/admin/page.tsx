"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginForm from "@/components/admin/LoginForm";
import ProjectForm from "@/components/admin/ProjectForm";
import ProjectList from "@/components/admin/ProjectList";
import "./admin.css";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    // onAuthStateChanged is a push-based listener from the Firebase SDK,
    // not polling: it fires once on mount and again only on real auth changes.
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

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

      <ProjectForm onCreated={() => setReloadToken((n) => n + 1)} />
      <ProjectList reloadToken={reloadToken} />
    </div>
  );
}
