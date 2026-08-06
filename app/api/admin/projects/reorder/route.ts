import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { commitFiles, getJsonFile, GithubCommitError, type FileChange } from "@/lib/github";
import type { Comercial, Filme, ImagemGaleria } from "@/lib/data";

const DATA_PATH = "data/projects.json";

interface ProjectsData {
  comerciais: Comercial[];
  filmes: Filme[];
  galeria: ImagemGaleria[];
}

function reorderList<T extends { id: string }>(list: T[], order: string[]): T[] | null {
  if (
    order.length !== list.length ||
    new Set(order).size !== order.length ||
    !order.every((id) => list.some((item) => item.id === id))
  ) {
    return null;
  }
  const byId = new Map(list.map((item) => [item.id, item]));
  return order.map((id) => byId.get(id)!);
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

  const body = await request.json().catch(() => null);
  const categoria = body?.categoria;
  const order = body?.order;

  if (categoria !== "publicidade" && categoria !== "filmes-series") {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }
  if (!Array.isArray(order) || !order.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "Ordem inválida." }, { status: 400 });
  }

  try {
    const current = await getJsonFile<ProjectsData>(DATA_PATH);

    if (categoria === "publicidade") {
      const reordered = reorderList(current.comerciais, order);
      if (!reordered) {
        return NextResponse.json(
          { error: "A ordem enviada não corresponde aos comerciais atuais." },
          { status: 400 }
        );
      }
      current.comerciais = reordered;
    } else {
      const reordered = reorderList(current.filmes, order);
      if (!reordered) {
        return NextResponse.json(
          { error: "A ordem enviada não corresponde aos filmes atuais." },
          { status: 400 }
        );
      }
      current.filmes = reordered;
    }

    const changes: FileChange[] = [
      {
        path: DATA_PATH,
        content: JSON.stringify(current, null, 2) + "\n",
        encoding: "utf-8",
      },
    ];

    const label = categoria === "publicidade" ? "comerciais" : "filmes";
    const { commitSha } = await commitFiles(changes, `Admin: reordena ${label}`);

    return NextResponse.json({ ok: true, commitSha });
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro inesperado ao reordenar." }, { status: 500 });
  }
}
