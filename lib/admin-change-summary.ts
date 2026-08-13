import type { Comercial, Filme } from "@/lib/data";
import type { AboutContent } from "@/lib/about";

export interface ChangeSummaryInput {
  originalAbout: AboutContent;
  originalComerciais: Comercial[];
  originalFilmes: Filme[];
  draftAbout: AboutContent;
  draftComerciais: Comercial[];
  draftFilmes: Filme[];
  deletedComerciais: Set<string>;
  deletedFilmes: Set<string>;
  pendingLogoFiles: Record<string, File>;
  pendingBannerFiles: Record<string, File>;
}

export function buildChangeSummary(input: ChangeSummaryInput): string[] {
  const lines: string[] = [];

  if (
    input.originalAbout.p1.pt !== input.draftAbout.p1.pt ||
    input.originalAbout.p1.en !== input.draftAbout.p1.en
  ) {
    lines.push("Sobre: parágrafo 1 alterado");
  }
  if (
    input.originalAbout.p2.pt !== input.draftAbout.p2.pt ||
    input.originalAbout.p2.en !== input.draftAbout.p2.en
  ) {
    lines.push("Sobre: parágrafo 2 alterado");
  }
  if (JSON.stringify(input.originalAbout.expertise) !== JSON.stringify(input.draftAbout.expertise)) {
    if (input.draftAbout.expertise.length > input.originalAbout.expertise.length) {
      lines.push("Sobre: destaque adicionado");
    } else if (input.draftAbout.expertise.length < input.originalAbout.expertise.length) {
      lines.push("Sobre: destaque removido");
    } else {
      lines.push("Sobre: destaques alterados ou reordenados");
    }
  }

  const originalComerciaisById = new Map(input.originalComerciais.map((c) => [c.id, c]));
  const keptComercialOrder = input.draftComerciais
    .filter((c) => !input.deletedComerciais.has(c.id))
    .map((c) => c.id);
  const originalComercialOrder = input.originalComerciais
    .map((c) => c.id)
    .filter((id) => !input.deletedComerciais.has(id));
  if (JSON.stringify(keptComercialOrder) !== JSON.stringify(originalComercialOrder)) {
    lines.push("Comerciais: ordem alterada");
  }
  for (const c of input.draftComerciais) {
    if (input.deletedComerciais.has(c.id)) continue;
    const prev = originalComerciaisById.get(c.id);
    if (!prev) continue;
    if (prev.titulo !== c.titulo) {
      lines.push(`Comercial "${prev.titulo}": título alterado para "${c.titulo}"`);
    }
    if (prev.ano !== c.ano) {
      lines.push(`Comercial "${c.titulo}": ano alterado de ${prev.ano} para ${c.ano}`);
    }
    if (prev.url !== c.url) {
      lines.push(`Comercial "${c.titulo}": link do vídeo alterado`);
    }
    if (input.pendingLogoFiles[c.id]) {
      lines.push(`Comercial "${c.titulo}": logo substituída`);
    }
    if (input.pendingBannerFiles[c.id]) {
      lines.push(`Comercial "${c.titulo}": thumbnail do card substituída`);
    }

    const originalExtrasById = new Map((prev.extras ?? []).map((e) => [e.id, e]));
    const draftExtrasById = new Map((c.extras ?? []).map((e) => [e.id, e]));
    for (const [extraId, extra] of draftExtrasById) {
      const prevExtra = originalExtrasById.get(extraId);
      if (!prevExtra) {
        if (extra.url.trim()) {
          lines.push(`Comercial "${c.titulo}": novo link adicionado ("${extra.titulo}")`);
        }
        continue;
      }
      if (
        prevExtra.titulo !== extra.titulo ||
        prevExtra.ano !== extra.ano ||
        prevExtra.url !== extra.url
      ) {
        lines.push(`Comercial "${c.titulo}": link "${prevExtra.titulo}" editado`);
      }
    }
    for (const [extraId, prevExtra] of originalExtrasById) {
      if (!draftExtrasById.has(extraId)) {
        lines.push(`Comercial "${c.titulo}": link "${prevExtra.titulo}" removido`);
      }
    }
  }
  for (const id of input.deletedComerciais) {
    const prev = originalComerciaisById.get(id);
    if (prev) lines.push(`Comercial "${prev.titulo}" será removido`);
  }

  const originalFilmesById = new Map(input.originalFilmes.map((f) => [f.id, f]));
  const keptFilmeOrder = input.draftFilmes
    .filter((f) => !input.deletedFilmes.has(f.id))
    .map((f) => f.id);
  const originalFilmeOrder = input.originalFilmes
    .map((f) => f.id)
    .filter((id) => !input.deletedFilmes.has(id));
  if (JSON.stringify(keptFilmeOrder) !== JSON.stringify(originalFilmeOrder)) {
    lines.push("Filmes e Séries: ordem alterada");
  }
  for (const f of input.draftFilmes) {
    if (input.deletedFilmes.has(f.id)) continue;
    const prev = originalFilmesById.get(f.id);
    if (!prev) continue;
    if (prev.titulo !== f.titulo) {
      lines.push(`Filme "${prev.titulo}": título alterado para "${f.titulo}"`);
    }
    if (prev.ano !== f.ano) {
      lines.push(`Filme "${f.titulo}": ano alterado de ${prev.ano} para ${f.ano}`);
    }
    if (prev.url !== f.url) {
      lines.push(`Filme "${f.titulo}": link do vídeo alterado`);
    }
    if (input.pendingBannerFiles[f.id]) {
      lines.push(`Filme "${f.titulo}": banner substituído`);
    }
  }
  for (const id of input.deletedFilmes) {
    const prev = originalFilmesById.get(id);
    if (prev) lines.push(`Filme "${prev.titulo}" será removido`);
  }

  return lines;
}
