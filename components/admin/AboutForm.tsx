"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import type { AboutContent, ExpertiseItem } from "@/lib/about";

interface AboutFormProps {
  data: AboutContent;
  onSaved: (next: AboutContent) => void;
}

type ExpertiseField = "titlePt" | "titleEn" | "subPt" | "subEn";

export default function AboutForm({ data, onSaved }: AboutFormProps) {
  const [p1Pt, setP1Pt] = useState(data.p1.pt);
  const [p1En, setP1En] = useState(data.p1.en);
  const [p2Pt, setP2Pt] = useState(data.p2.pt);
  const [p2En, setP2En] = useState(data.p2.en);
  const [expertise, setExpertise] = useState<ExpertiseItem[]>(data.expertise);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateItem(index: number, field: ExpertiseField, value: string) {
    setExpertise((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        switch (field) {
          case "titlePt":
            return { ...item, title: { ...item.title, pt: value } };
          case "titleEn":
            return { ...item, title: { ...item.title, en: value } };
          case "subPt":
            return { ...item, sub: { ...item.sub, pt: value } };
          case "subEn":
            return { ...item, sub: { ...item.sub, en: value } };
        }
      })
    );
  }

  function addItem() {
    setExpertise((prev) => [...prev, { title: { pt: "", en: "" }, sub: { pt: "", en: "" } }]);
  }

  function removeItem(index: number) {
    setExpertise((prev) => prev.filter((_, i) => i !== index));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setExpertise((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!p1Pt.trim() || !p1En.trim() || !p2Pt.trim() || !p2En.trim()) {
      setError("Preencha os parágrafos em PT e EN.");
      return;
    }
    if (expertise.length === 0) {
      setError("Adicione ao menos um item de destaque.");
      return;
    }
    if (expertise.some((item) => !item.title.pt.trim() || !item.title.en.trim())) {
      setError("Preencha o título (PT e EN) de todos os destaques.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    const payload: AboutContent = {
      p1: { pt: p1Pt.trim(), en: p1En.trim() },
      p2: { pt: p2Pt.trim(), en: p2En.trim() },
      expertise: expertise.map((item) => ({
        title: { pt: item.title.pt.trim(), en: item.title.en.trim() },
        sub: { pt: item.sub.pt.trim(), en: item.sub.en.trim() },
      })),
    };

    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Não foi possível salvar.");
        return;
      }
      setSuccess(
        "Seção Sobre salva! O commit foi feito no repositório — o site leva cerca de 1 a 2 minutos para atualizar."
      );
      onSaved(payload);
    } catch {
      setError("Erro de rede ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-project-form" onSubmit={handleSubmit}>
      <h2>Seção Sobre</h2>

      <fieldset className="admin-about-block">
        <legend>Parágrafo 1</legend>
        <label>
          PT
          <textarea rows={3} value={p1Pt} onChange={(e) => setP1Pt(e.target.value)} />
        </label>
        <label>
          EN
          <textarea rows={3} value={p1En} onChange={(e) => setP1En(e.target.value)} />
        </label>
      </fieldset>

      <fieldset className="admin-about-block">
        <legend>Parágrafo 2</legend>
        <label>
          PT
          <textarea rows={3} value={p2Pt} onChange={(e) => setP2Pt(e.target.value)} />
        </label>
        <label>
          EN
          <textarea rows={3} value={p2En} onChange={(e) => setP2En(e.target.value)} />
        </label>
      </fieldset>

      <fieldset className="admin-about-block">
        <legend>Destaques</legend>
        {expertise.map((item, i) => (
          <div key={i} className="admin-about-expertise-item">
            <div className="admin-about-expertise-grid">
              <label>
                Título (PT)
                <input
                  value={item.title.pt}
                  onChange={(e) => updateItem(i, "titlePt", e.target.value)}
                />
              </label>
              <label>
                Título (EN)
                <input
                  value={item.title.en}
                  onChange={(e) => updateItem(i, "titleEn", e.target.value)}
                />
              </label>
              <label>
                Subtítulo (PT)
                <input
                  value={item.sub.pt}
                  onChange={(e) => updateItem(i, "subPt", e.target.value)}
                />
              </label>
              <label>
                Subtítulo (EN)
                <input
                  value={item.sub.en}
                  onChange={(e) => updateItem(i, "subEn", e.target.value)}
                />
              </label>
            </div>
            <div className="admin-item-actions">
              <div className="admin-order-btns">
                <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0}>
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(i, 1)}
                  disabled={i === expertise.length - 1}
                >
                  ▼
                </button>
              </div>
              <button type="button" onClick={() => removeItem(i)}>
                Remover
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addItem}>
          + Adicionar destaque
        </button>
      </fieldset>

      {error && <p className="admin-error">{error}</p>}
      {success && <p className="admin-success">{success}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Salvando..." : "Salvar seção Sobre"}
      </button>
    </form>
  );
}
