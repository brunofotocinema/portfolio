import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { commitFiles, getJsonFile, GithubCommitError, type FileChange } from "@/lib/github";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { fileExtension, fileToBase64, MAX_FILE_BYTES } from "@/lib/admin-server-utils";
import type { Comercial, ComercialExtra, Filme, SiteData } from "@/lib/data";
import type { Categoria } from "@/lib/admin-types";

const DATA_PATH = "data/site.json";

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

  if (
    categoria !== "publicidade" &&
    categoria !== "filmes-series" &&
    categoria !== "galeria"
  ) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  if (categoria === "galeria") {
    const imagem = form.get("imagem");
    const alt = (form.get("alt") as string | null)?.trim() || undefined;

    if (!(imagem instanceof File) || imagem.size === 0) {
      return NextResponse.json({ error: "Imagem é obrigatória para Galeria." }, { status: 400 });
    }
    if (imagem.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Imagem muito grande (máximo 8MB)." }, { status: 400 });
    }

    try {
      const current = await getJsonFile<SiteData>(DATA_PATH);
      const existingIds = current.galeria.map((g) => g.id);
      const id = uniqueSlug(slugify(alt || "imagem"), existingIds);
      const ext = fileExtension(imagem);
      const path = `public/galeria/${id}.${ext}`;

      const novaImagem = {
        id,
        src: `/galeria/${id}.${ext}`,
        ...(alt ? { alt } : {}),
      };
      current.galeria = [...current.galeria, novaImagem];

      const changes: FileChange[] = [
        { path, content: await fileToBase64(imagem), encoding: "base64" },
        {
          path: DATA_PATH,
          content: JSON.stringify(current, null, 2) + "\n",
          encoding: "utf-8",
        },
      ];

      const { commitSha } = await commitFiles(changes, `Admin: adiciona imagem à galeria`);

      return NextResponse.json({ ok: true, id, commitSha });
    } catch (err) {
      if (err instanceof GithubCommitError) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      console.error(err);
      return NextResponse.json({ error: "Erro inesperado ao salvar a imagem." }, { status: 500 });
    }
  }

  const titulo = (form.get("titulo") as string | null)?.trim();
  const anoRaw = form.get("ano") as string | null;
  const videoUrl = (form.get("videoUrl") as string | null)?.trim() || undefined;
  const vincularA = (form.get("vincularA") as string | null)?.trim() || undefined;
  const emFinalizacao = categoria === "filmes-series" && form.get("emFinalizacao") === "true";
  const banner = form.get("banner");
  const logo = form.get("logo");

  if (!titulo) {
    return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
  }
  const ano = Number(anoRaw);
  if (!anoRaw || Number.isNaN(ano)) {
    return NextResponse.json({ error: "Ano é obrigatório." }, { status: 400 });
  }
  if (!videoUrl && !emFinalizacao) {
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
  } else if (!emFinalizacao) {
    if (!(banner instanceof File) || banner.size === 0) {
      return NextResponse.json(
        { error: "Banner é obrigatório para Filmes e Séries." },
        { status: 400 }
      );
    }
    if (banner.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Banner muito grande (máximo 8MB)." }, { status: 400 });
    }
  } else if (banner instanceof File && banner.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Banner muito grande (máximo 8MB)." }, { status: 400 });
  }

  try {
    const current = await getJsonFile<SiteData>(DATA_PATH);

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
        sub: `Comercial · ${ano}`,
        url: videoUrl!,
        ano,
      };

      current.comerciais = [...current.comerciais, novoComercial];
    } else {
      let bannerPath: string | undefined;
      if (banner instanceof File && banner.size > 0) {
        const bannerExt = fileExtension(banner);
        bannerPath = `/banners/${id}.${bannerExt}`;
        changes.push({
          path: `public${bannerPath}`,
          content: await fileToBase64(banner),
          encoding: "base64",
        });
      }

      const novoFilme: Filme = {
        id,
        titulo,
        ano,
        tipo: emFinalizacao ? "Em finalização" : "Filme e Série",
        ...(videoUrl ? { url: videoUrl } : {}),
        ...(bannerPath ? { banner: bannerPath } : {}),
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
