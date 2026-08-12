import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { commitFiles, getJsonFile, GithubCommitError, type FileChange } from "@/lib/github";
import { fileExtension, fileToBase64, MAX_FILE_BYTES } from "@/lib/admin-server-utils";
import type { Comercial, Filme, SiteData } from "@/lib/data";
import type { AboutContent, Bilingual } from "@/lib/about";

const DATA_PATH = "data/site.json";

type ComercialDraft = Omit<Comercial, "alt" | "sub"> & { alt?: string; sub?: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isBilingual(v: unknown): v is Bilingual {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.pt === "string" && typeof o.en === "string";
}

function isExpertiseItem(v: unknown): v is { title: Bilingual; sub: Bilingual } {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return isBilingual(o.title) && isBilingual(o.sub);
}

function isAboutContent(v: unknown): v is AboutContent {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    isBilingual(o.p1) &&
    isBilingual(o.p2) &&
    Array.isArray(o.expertise) &&
    o.expertise.length > 0 &&
    o.expertise.every(isExpertiseItem)
  );
}

function isComercialDraft(v: unknown): v is ComercialDraft {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    isNonEmptyString(o.id) &&
    isNonEmptyString(o.titulo) &&
    isNonEmptyString(o.url) &&
    isFiniteNumber(o.ano) &&
    typeof o.logo === "string" &&
    (o.zoom === undefined || typeof o.zoom === "number") &&
    (o.banner === undefined || typeof o.banner === "string") &&
    (o.extras === undefined || Array.isArray(o.extras))
  );
}

function isFilmeDraft(v: unknown): v is Filme {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    isNonEmptyString(o.id) &&
    isNonEmptyString(o.titulo) &&
    (o.url === undefined || typeof o.url === "string") &&
    isFiniteNumber(o.ano) &&
    isNonEmptyString(o.tipo) &&
    (o.poster === undefined || typeof o.poster === "string") &&
    (o.banner === undefined || typeof o.banner === "string")
  );
}

export async function GET(request: Request) {
  try {
    await requireFirebaseUser(request);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  try {
    const current = await getJsonFile<SiteData>(DATA_PATH);
    return NextResponse.json(current);
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao carregar o conteúdo do site." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireFirebaseUser(request);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const form = await request.formData();

  const about = JSON.parse((form.get("about") as string | null) ?? "null");
  const comerciaisRaw = JSON.parse((form.get("comerciais") as string | null) ?? "null");
  const filmesRaw = JSON.parse((form.get("filmes") as string | null) ?? "null");

  if (!isAboutContent(about)) {
    return NextResponse.json({ error: "Dados da seção Sobre inválidos." }, { status: 400 });
  }
  if (!Array.isArray(comerciaisRaw) || !comerciaisRaw.every(isComercialDraft)) {
    return NextResponse.json({ error: "Dados de comerciais inválidos." }, { status: 400 });
  }
  if (!Array.isArray(filmesRaw) || !filmesRaw.every(isFilmeDraft)) {
    return NextResponse.json({ error: "Dados de filmes inválidos." }, { status: 400 });
  }
  const comerciaisInput = comerciaisRaw as ComercialDraft[];
  const filmesInput = filmesRaw as Filme[];

  const logoFiles = new Map<string, File>();
  const bannerFiles = new Map<string, File>();
  for (const [key, value] of form.entries()) {
    if (!(value instanceof File) || value.size === 0) continue;
    if (value.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `Arquivo "${key}" muito grande (máximo 8MB).` }, { status: 400 });
    }
    if (key.startsWith("logo__")) logoFiles.set(key.slice("logo__".length), value);
    else if (key.startsWith("banner__")) bannerFiles.set(key.slice("banner__".length), value);
  }

  try {
    const current = await getJsonFile<SiteData>(DATA_PATH);
    const currentComerciaisById = new Map(current.comerciais.map((c) => [c.id, c]));
    const currentFilmesById = new Map(current.filmes.map((f) => [f.id, f]));

    const assetWrites: FileChange[] = [];
    const assetDeletes: FileChange[] = [];

    const finalComerciais: Comercial[] = [];
    for (const input of comerciaisInput) {
      const prev = currentComerciaisById.get(input.id);
      let logo = prev?.logo ?? input.logo;
      const file = logoFiles.get(input.id);
      if (file) {
        const ext = fileExtension(file);
        const newPath = `/logos/${input.id}.${ext}`;
        assetWrites.push({ path: `public${newPath}`, content: await fileToBase64(file), encoding: "base64" });
        if (prev?.logo && prev.logo !== newPath) {
          assetDeletes.push({ path: `public${prev.logo}`, delete: true });
        }
        logo = newPath;
      }
      finalComerciais.push({
        ...input,
        logo,
        alt: input.titulo,
        sub: `Comercial · ${input.ano}`,
      });
    }

    const finalFilmes: Filme[] = [];
    for (const input of filmesInput) {
      const prev = currentFilmesById.get(input.id);
      let banner = input.banner ?? prev?.banner;
      const file = bannerFiles.get(input.id);
      if (file) {
        const ext = fileExtension(file);
        const newPath = `/banners/${input.id}.${ext}`;
        assetWrites.push({ path: `public${newPath}`, content: await fileToBase64(file), encoding: "base64" });
        if (prev?.banner && prev.banner !== newPath) {
          assetDeletes.push({ path: `public${prev.banner}`, delete: true });
        }
        banner = newPath;
      }
      finalFilmes.push({ ...input, banner, url: input.url?.trim() || undefined });
    }

    const newComercialIds = new Set(finalComerciais.map((c) => c.id));
    for (const c of current.comerciais) {
      if (newComercialIds.has(c.id)) continue;
      if (c.logo) assetDeletes.push({ path: `public${c.logo}`, delete: true });
      if (c.banner) assetDeletes.push({ path: `public${c.banner}`, delete: true });
    }

    const newFilmeIds = new Set(finalFilmes.map((f) => f.id));
    for (const f of current.filmes) {
      if (newFilmeIds.has(f.id)) continue;
      if (f.poster) assetDeletes.push({ path: `public${f.poster}`, delete: true });
      if (f.banner) assetDeletes.push({ path: `public${f.banner}`, delete: true });
    }

    const next: SiteData = {
      about,
      comerciais: finalComerciais,
      filmes: finalFilmes,
      galeria: current.galeria,
    };

    const changes: FileChange[] = [
      ...assetWrites,
      { path: DATA_PATH, content: JSON.stringify(next, null, 2) + "\n", encoding: "utf-8" },
      ...assetDeletes,
    ];

    const { commitSha } = await commitFiles(changes, "Admin: salva alterações da página");

    return NextResponse.json({ ok: true, commitSha });
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro inesperado ao salvar as alterações." }, { status: 500 });
  }
}
