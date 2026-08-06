import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { commitFiles, getJsonFile, GithubCommitError, type FileChange } from "@/lib/github";
import { fileExtension, fileToBase64, MAX_FILE_BYTES } from "@/lib/admin-server-utils";
import type { SiteData } from "@/lib/data";

const DATA_PATH = "data/site.json";

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/admin/projects/[id]">
) {
  try {
    await requireFirebaseUser(request);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");
  const parentId = searchParams.get("parentId") || undefined;

  if (categoria !== "publicidade" && categoria !== "filmes-series" && categoria !== "galeria") {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  if (categoria === "galeria") {
    try {
      const current = await getJsonFile<SiteData>(DATA_PATH);
      const image = current.galeria.find((g) => g.id === id);
      if (!image) {
        return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
      }
      current.galeria = current.galeria.filter((g) => g.id !== id);

      const changes: FileChange[] = [
        {
          path: DATA_PATH,
          content: JSON.stringify(current, null, 2) + "\n",
          encoding: "utf-8" as const,
        },
        { path: `public${image.src}`, delete: true as const },
      ];

      const { commitSha } = await commitFiles(changes, `Admin: remove imagem da galeria`);

      return NextResponse.json({ ok: true, commitSha });
    } catch (err) {
      if (err instanceof GithubCommitError) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      console.error(err);
      return NextResponse.json({ error: "Erro inesperado ao remover a imagem." }, { status: 500 });
    }
  }

  if (!parentId) {
    return NextResponse.json(
      { error: "Remover comerciais e filmes agora acontece pelo salvamento geral da página." },
      { status: 400 }
    );
  }

  try {
    const current = await getJsonFile<SiteData>(DATA_PATH);
    const parent = current.comerciais.find((c) => c.id === parentId);
    if (!parent) {
      return NextResponse.json({ error: "Marca não encontrada." }, { status: 404 });
    }
    const extra = parent.extras?.find((e) => e.id === id);
    if (!extra) {
      return NextResponse.json({ error: "Vídeo extra não encontrado." }, { status: 404 });
    }
    parent.extras = parent.extras!.filter((e) => e.id !== id);

    const { commitSha } = await commitFiles(
      [
        {
          path: DATA_PATH,
          content: JSON.stringify(current, null, 2) + "\n",
          encoding: "utf-8" as const,
        },
      ],
      `Admin: remove vídeo extra "${extra.titulo}" da marca "${parent.titulo}"`
    );

    return NextResponse.json({ ok: true, commitSha });
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Erro inesperado ao remover o vídeo extra." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/admin/projects/[id]">) {
  try {
    await requireFirebaseUser(request);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");

  if (categoria !== "galeria") {
    return NextResponse.json(
      { error: "Editar comerciais e filmes agora acontece pelo salvamento geral da página." },
      { status: 400 }
    );
  }

  const form = await request.formData();
  const alt = (form.get("alt") as string | null)?.trim() || undefined;
  const imagem = form.get("imagem");

  if (imagem instanceof File && imagem.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Imagem muito grande (máximo 8MB)." }, { status: 400 });
  }

  try {
    const current = await getJsonFile<SiteData>(DATA_PATH);
    const image = current.galeria.find((g) => g.id === id);
    if (!image) {
      return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
    }

    if (alt) image.alt = alt;
    else delete image.alt;

    const changes: FileChange[] = [];
    let oldAssetToDelete: string | undefined;

    if (imagem instanceof File && imagem.size > 0) {
      const ext = fileExtension(imagem);
      const newPath = `public/galeria/${id}.${ext}`;
      const oldPath = `public${image.src}`;
      changes.push({ path: newPath, content: await fileToBase64(imagem), encoding: "base64" });
      if (oldPath !== newPath) oldAssetToDelete = oldPath;
      image.src = `/galeria/${id}.${ext}`;
    }

    changes.push({
      path: DATA_PATH,
      content: JSON.stringify(current, null, 2) + "\n",
      encoding: "utf-8",
    });
    if (oldAssetToDelete) changes.push({ path: oldAssetToDelete, delete: true });

    const { commitSha } = await commitFiles(changes, `Admin: edita imagem da galeria`);

    return NextResponse.json({ ok: true, commitSha });
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro inesperado ao editar a imagem." }, { status: 500 });
  }
}
