import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { commitFiles, getJsonFile, GithubCommitError, type FileChange } from "@/lib/github";
import { fileExtension, fileToBase64, readCreditos, MAX_FILE_BYTES } from "@/lib/admin-server-utils";
import type { Comercial, Filme } from "@/lib/data";

const DATA_PATH = "data/projects.json";

interface ProjectsData {
  comerciais: Comercial[];
  filmes: Filme[];
}

function assetPaths(project: Comercial | Filme): string[] {
  const paths: string[] = [];
  if ("logo" in project && project.logo) paths.push(`public${project.logo}`);
  if ("poster" in project && project.poster) paths.push(`public${project.poster}`);
  if (project.banner) paths.push(`public${project.banner}`);
  return paths;
}

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

  if (categoria !== "publicidade" && categoria !== "filmes-series") {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  if (parentId) {
    try {
      const current = await getJsonFile<ProjectsData>(DATA_PATH);
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

  try {
    const current = await getJsonFile<ProjectsData>(DATA_PATH);
    const list = categoria === "publicidade" ? current.comerciais : current.filmes;
    const project = list.find((p) => p.id === id);

    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
    }

    if (categoria === "publicidade") {
      current.comerciais = current.comerciais.filter((p) => p.id !== id);
    } else {
      current.filmes = current.filmes.filter((p) => p.id !== id);
    }

    // Data file first so a project is never left referencing already-deleted
    // assets, then the (now unreferenced) image files.
    const changes: FileChange[] = [
      {
        path: DATA_PATH,
        content: JSON.stringify(current, null, 2) + "\n",
        encoding: "utf-8" as const,
      },
      ...assetPaths(project).map((path) => ({ path, delete: true as const })),
    ];

    const { commitSha } = await commitFiles(
      changes,
      `Admin: remove projeto "${project.titulo}"`
    );

    return NextResponse.json({ ok: true, commitSha });
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro inesperado ao remover o projeto." }, { status: 500 });
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

  if (categoria !== "publicidade" && categoria !== "filmes-series") {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const form = await request.formData();
  const titulo = (form.get("titulo") as string | null)?.trim();
  const anoRaw = form.get("ano") as string | null;
  const videoUrl = (form.get("videoUrl") as string | null)?.trim();
  const logo = form.get("logo");
  const banner = form.get("banner");

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
  if (logo instanceof File && logo.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Logo muito grande (máximo 8MB)." }, { status: 400 });
  }
  if (banner instanceof File && banner.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Banner muito grande (máximo 8MB)." }, { status: 400 });
  }

  try {
    const current = await getJsonFile<ProjectsData>(DATA_PATH);
    const list = categoria === "publicidade" ? current.comerciais : current.filmes;
    const project = list.find((p) => p.id === id);

    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
    }

    const creditos = readCreditos(form);
    project.titulo = titulo;
    project.ano = ano;
    project.url = videoUrl;
    if (creditos) project.creditos = creditos;
    else delete project.creditos;

    const changes: FileChange[] = [];
    let oldAssetToDelete: string | undefined;

    if (categoria === "publicidade") {
      const comercial = project as Comercial;
      comercial.alt = titulo;
      comercial.sub = creditos?.funcaoBruno
        ? `${creditos.funcaoBruno} · ${ano}`
        : `Publicidade · ${ano}`;

      if (logo instanceof File && logo.size > 0) {
        const ext = fileExtension(logo);
        const newPath = `public/logos/${id}.${ext}`;
        const oldPath = `public${comercial.logo}`;
        changes.push({ path: newPath, content: await fileToBase64(logo), encoding: "base64" });
        if (oldPath !== newPath) oldAssetToDelete = oldPath;
        comercial.logo = `/logos/${id}.${ext}`;
      }
    } else {
      const filme = project as Filme;
      filme.tipo = creditos?.funcaoBruno ?? "Filme e Série";

      if (banner instanceof File && banner.size > 0) {
        const ext = fileExtension(banner);
        const newPath = `public/banners/${id}.${ext}`;
        const oldPath = filme.banner ? `public${filme.banner}` : undefined;
        changes.push({ path: newPath, content: await fileToBase64(banner), encoding: "base64" });
        if (oldPath && oldPath !== newPath) oldAssetToDelete = oldPath;
        filme.banner = `/banners/${id}.${ext}`;
      }
    }

    changes.push({
      path: DATA_PATH,
      content: JSON.stringify(current, null, 2) + "\n",
      encoding: "utf-8",
    });
    if (oldAssetToDelete) changes.push({ path: oldAssetToDelete, delete: true });

    const { commitSha } = await commitFiles(changes, `Admin: edita projeto "${titulo}"`);

    return NextResponse.json({ ok: true, commitSha });
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro inesperado ao editar o projeto." }, { status: 500 });
  }
}
