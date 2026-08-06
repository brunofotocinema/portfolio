import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { commitFiles, getJsonFile, GithubCommitError, type FileChange } from "@/lib/github";
import type { AboutContent, Bilingual } from "@/lib/about";

const DATA_PATH = "data/about.json";

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
    const current = await getJsonFile<AboutContent>(DATA_PATH);
    return NextResponse.json(current);
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao carregar a seção Sobre." }, { status: 500 });
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

  const body = await request.json().catch(() => null);

  if (
    !body ||
    !isBilingual(body.p1) ||
    !isBilingual(body.p2) ||
    !Array.isArray(body.expertise) ||
    body.expertise.length === 0 ||
    !body.expertise.every(isExpertiseItem)
  ) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const next: AboutContent = {
    p1: { pt: body.p1.pt.trim(), en: body.p1.en.trim() },
    p2: { pt: body.p2.pt.trim(), en: body.p2.en.trim() },
    expertise: body.expertise.map((item: { title: Bilingual; sub: Bilingual }) => ({
      title: { pt: item.title.pt.trim(), en: item.title.en.trim() },
      sub: { pt: item.sub.pt.trim(), en: item.sub.en.trim() },
    })),
  };

  try {
    const changes: FileChange[] = [
      {
        path: DATA_PATH,
        content: JSON.stringify(next, null, 2) + "\n",
        encoding: "utf-8",
      },
    ];

    const { commitSha } = await commitFiles(changes, "Admin: edita seção Sobre");

    return NextResponse.json({ ok: true, commitSha });
  } catch (err) {
    if (err instanceof GithubCommitError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro inesperado ao salvar a seção Sobre." }, { status: 500 });
  }
}
