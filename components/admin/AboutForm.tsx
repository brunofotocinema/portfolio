"use client";

import type { AboutContent, ExpertiseItem } from "@/lib/about";

interface AboutFormProps {
  value: AboutContent;
  onChange: (next: AboutContent) => void;
}

type ExpertiseField = "titlePt" | "titleEn" | "subPt" | "subEn";

export default function AboutForm({ value, onChange }: AboutFormProps) {
  function updateItem(index: number, field: ExpertiseField, fieldValue: string) {
    const expertise = value.expertise.map((item, i) => {
      if (i !== index) return item;
      switch (field) {
        case "titlePt":
          return { ...item, title: { ...item.title, pt: fieldValue } };
        case "titleEn":
          return { ...item, title: { ...item.title, en: fieldValue } };
        case "subPt":
          return { ...item, sub: { ...item.sub, pt: fieldValue } };
        case "subEn":
          return { ...item, sub: { ...item.sub, en: fieldValue } };
      }
    });
    onChange({ ...value, expertise });
  }

  function addItem() {
    const item: ExpertiseItem = { title: { pt: "", en: "" }, sub: { pt: "", en: "" } };
    onChange({ ...value, expertise: [...value.expertise, item] });
  }

  function removeItem(index: number) {
    onChange({ ...value, expertise: value.expertise.filter((_, i) => i !== index) });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.expertise.length) return;
    const expertise = [...value.expertise];
    [expertise[index], expertise[target]] = [expertise[target], expertise[index]];
    onChange({ ...value, expertise });
  }

  return (
    <div className="admin-project-form">
      <h2>Seção Sobre</h2>

      <fieldset className="admin-about-block">
        <legend>Parágrafo 1</legend>
        <label>
          PT
          <textarea
            rows={3}
            value={value.p1.pt}
            onChange={(e) => onChange({ ...value, p1: { ...value.p1, pt: e.target.value } })}
          />
        </label>
        <label>
          EN
          <textarea
            rows={3}
            value={value.p1.en}
            onChange={(e) => onChange({ ...value, p1: { ...value.p1, en: e.target.value } })}
          />
        </label>
      </fieldset>

      <fieldset className="admin-about-block">
        <legend>Parágrafo 2</legend>
        <label>
          PT
          <textarea
            rows={3}
            value={value.p2.pt}
            onChange={(e) => onChange({ ...value, p2: { ...value.p2, pt: e.target.value } })}
          />
        </label>
        <label>
          EN
          <textarea
            rows={3}
            value={value.p2.en}
            onChange={(e) => onChange({ ...value, p2: { ...value.p2, en: e.target.value } })}
          />
        </label>
      </fieldset>

      <fieldset className="admin-about-block">
        <legend>Destaques</legend>
        {value.expertise.map((item, i) => (
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
                  disabled={i === value.expertise.length - 1}
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
    </div>
  );
}
