import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { commitFiles, getJsonFile, GithubCommitError, type FileChange } from "@/lib/github";
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

  if (categoria !== "publicidade" && categoria !== "filmes-series") {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
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

    const changes: FileChange[] = [
      ...assetPaths(project).map((path) => ({ path, delete: true as const })),
      {
        path: DATA_PATH,
        content: JSON.stringify(current, null, 2) + "\n",
        encoding: "utf-8" as const,
      },
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
