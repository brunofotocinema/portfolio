import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { commitFiles, getJsonFile, GithubCommitError, type FileChange } from "@/lib/github";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { fileExtension, fileToBase64, readCreditos, MAX_FILE_BYTES } from "@/lib/admin-server-utils";
import type { Comercial, ComercialExtra, Filme } from "@/lib/data";
import type { Categoria } from "@/lib/admin-types";

const DATA_PATH = "data/projects.json";

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
  const vincularA = (form.get("vincularA") as string | null)?.trim() || undefined;
  const banner = form.get("banner");
  const logo = form.get("logo");

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
  if (!videoUrl) {
    return NextResponse.json({ error: "Link do vídeo é obrigatório." }, { status: 400 });
  }

  if (categoria === "publicidade") {
    if (!vincularA) {
      if (!(logo instanceof File) || logo.size === 0) {
        return NextResponse.json(
          { error: "Logo (PNG) é obrigatória para Comerciais." },
          { status: 400 }
        );
      }
      if (logo.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "Logo muito grande (máximo 8MB)." }, { status: 400 });
      }
    }
  } else {
    if (!(banner instanceof File) || banner.size === 0) {
      return NextResponse.json(
        { error: "Banner é obrigatório para Filmes e Séries." },
        { status: 400 }
      );
    }
    if (banner.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Banner muito grande (máximo 8MB)." }, { status: 400 });
    }
  }

  try {
    const current = await getJsonFile<ProjectsData>(DATA_PATH);
    const creditos = readCreditos(form);

    if (categoria === "publicidade" && vincularA) {
      const parent = current.comerciais.find((c) => c.id === vincularA);
      if (!parent) {
        return NextResponse.json({ error: "Marca selecionada não encontrada." }, { status: 400 });
      }

      const existingExtraIds = current.comerciais.flatMap((c) =>
        (c.extras ?? []).map((e) => e.id)
      );
      const extraId = uniqueSlug(slugify(titulo), existingExtraIds);
      const novoExtra: ComercialExtra = { id: extraId, titulo, url: videoUrl!, ano };
      parent.extras = [...(parent.extras ?? []), novoExtra];

      const changes: FileChange[] = [
        {
          path: DATA_PATH,
          content: JSON.stringify(current, null, 2) + "\n",
          encoding: "utf-8",
        },
      ];

      const { commitSha } = await commitFiles(
        changes,
        `Admin: adiciona vídeo extra "${titulo}" à marca "${parent.titulo}"`
      );

      return NextResponse.json({ ok: true, id: extraId, commitSha });
    }

    const existingIds = [...current.comerciais, ...current.filmes].map((p) => p.id);
    const id = uniqueSlug(slugify(titulo), existingIds);

    const changes: FileChange[] = [];

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
        sub: creditos?.funcaoBruno ? `${creditos.funcaoBruno} · ${ano}` : `Comercial · ${ano}`,
        url: videoUrl!,
        ano,
        ...(creditos ? { creditos } : {}),
      };

      current.comerciais = [...current.comerciais, novoComercial];
    } else {
      const bannerFile = banner as File;
      const bannerExt = fileExtension(bannerFile);
      const bannerPath = `public/banners/${id}.${bannerExt}`;
      changes.push({
        path: bannerPath,
        content: await fileToBase64(bannerFile),
        encoding: "base64",
      });

      const novoFilme: Filme = {
        id,
        titulo,
        ano,
        tipo: creditos?.funcaoBruno ?? "Filme e Série",
        url: videoUrl!,
        banner: `/banners/${id}.${bannerExt}`,
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
