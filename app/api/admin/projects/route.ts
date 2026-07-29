import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { commitFiles, getJsonFile, GithubCommitError, type FileChange } from "@/lib/github";
import { slugify, uniqueSlug } from "@/lib/slugify";
import type { Comercial, Filme } from "@/lib/data";
import type { Categoria, CreditosInput } from "@/lib/admin-types";

const DATA_PATH = "data/projects.json";
const MAX_FILE_BYTES = 8 * 1024 * 1024;

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
    const current = await getJsonFile<ProjectsData>(DATA_PATH);
    return NextResponse.json(current);
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao carregar projetos." }, { status: 500 });
  }
}

interface ProjectsData {
  comerciais: Comercial[];
  filmes: Filme[];
}

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

function readCreditos(form: FormData): CreditosInput | undefined {
  const produtora = (form.get("creditosProdutora") as string | null)?.trim();
  const direcao = (form.get("creditosDirecao") as string | null)?.trim();
  const funcaoBruno = (form.get("creditosFuncaoBruno") as string | null)?.trim();

  if (!produtora && !direcao && !funcaoBruno) return undefined;
  return {
    ...(produtora ? { produtora } : {}),
    ...(direcao ? { direcao } : {}),
    ...(funcaoBruno ? { funcaoBruno } : {}),
  };
}

export async function POST(request: Request) {
  try {
    await requireFirebaseUser(request);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const form = await request.formData();

  const categoria = form.get("categoria") as Categoria | null;
  const titulo = (form.get("titulo") as string | null)?.trim();
  const anoRaw = form.get("ano") as string | null;
  const videoUrl = (form.get("videoUrl") as string | null)?.trim() || undefined;
  const banner = form.get("banner");
  const logo = form.get("logo");
  const poster = form.get("poster");

  if (categoria !== "publicidade" && categoria !== "filmes-series") {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }
  if (!titulo) {
    return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
  }
  const ano = Number(anoRaw);
  if (!anoRaw || Number.isNaN(ano)) {
    return NextResponse.json({ error: "Ano é obrigatório." }, { status: 400 });
  }
  if (!(banner instanceof File) || banner.size === 0) {
    return NextResponse.json({ error: "Banner/thumbnail é obrigatório." }, { status: 400 });
  }
  if (banner.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Banner/thumbnail muito grande (máximo 8MB)." },
      { status: 400 }
    );
  }

  if (categoria === "publicidade") {
    if (!videoUrl) {
      return NextResponse.json(
        { error: "Link do vídeo é obrigatório para Publicidade." },
        { status: 400 }
      );
    }
    if (!(logo instanceof File) || logo.size === 0) {
      return NextResponse.json(
        { error: "Logo (PNG sem fundo) é obrigatória para Publicidade." },
        { status: 400 }
      );
    }
    if (logo.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Logo muito grande (máximo 8MB)." }, { status: 400 });
    }
  } else {
    if (!(poster instanceof File) || poster.size === 0) {
      return NextResponse.json(
        { error: "Pôster é obrigatório para Filmes e Séries." },
        { status: 400 }
      );
    }
    if (poster.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Pôster muito grande (máximo 8MB)." }, { status: 400 });
    }
  }

  try {
    const current = await getJsonFile<ProjectsData>(DATA_PATH);
    const existingIds = [...current.comerciais, ...current.filmes].map((p) => p.id);
    const id = uniqueSlug(slugify(titulo), existingIds);
    const creditos = readCreditos(form);

    const changes: FileChange[] = [];

    const bannerFile = banner as File;
    const bannerExt = fileExtension(bannerFile);
    const bannerPath = `public/banners/${id}.${bannerExt}`;
    changes.push({
      path: bannerPath,
      content: await fileToBase64(bannerFile),
      encoding: "base64",
    });
    const bannerPublicUrl = `/banners/${id}.${bannerExt}`;

    if (categoria === "publicidade") {
      const logoFile = logo as File;
      const logoExt = fileExtension(logoFile);
      const logoPath = `public/logos/${id}.${logoExt}`;
      changes.push({
        path: logoPath,
        content: await fileToBase64(logoFile),
        encoding: "base64",
      });

      const novoComercial: Comercial = {
        id,
        logo: `/logos/${id}.${logoExt}`,
        alt: titulo,
        titulo,
        sub: creditos?.funcaoBruno ? `${creditos.funcaoBruno} · ${ano}` : `Publicidade · ${ano}`,
        url: videoUrl!,
        ano,
        banner: bannerPublicUrl,
        ...(creditos ? { creditos } : {}),
      };

      current.comerciais = [...current.comerciais, novoComercial];
    } else {
      const posterFile = poster as File;
      const posterExt = fileExtension(posterFile);
      const posterPath = `public/posters/${id}.${posterExt}`;
      changes.push({
        path: posterPath,
        content: await fileToBase64(posterFile),
        encoding: "base64",
      });

      const novoFilme: Filme = {
        id,
        titulo,
        ano,
        tipo: creditos?.funcaoBruno ?? "Filme e Série",
        ...(videoUrl ? { url: videoUrl } : {}),
        poster: `/posters/${id}.${posterExt}`,
        banner: bannerPublicUrl,
        ...(creditos ? { creditos } : {}),
      };

      current.filmes = [...current.filmes, novoFilme];
    }

    changes.push({
      path: DATA_PATH,
      content: JSON.stringify(current, null, 2) + "\n",
      encoding: "utf-8",
    });

    const { commitSha } = await commitFiles(changes, `Admin: adiciona projeto "${titulo}"`);

    return NextResponse.json({ ok: true, id, commitSha });
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro inesperado ao salvar o projeto." }, { status: 500 });
  }
}
