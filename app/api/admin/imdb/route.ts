import { NextResponse } from "next/server";
import { requireFirebaseUser, UnauthorizedError } from "@/lib/auth-server";
import { fichaPorImdb, TmdbError } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    await requireFirebaseUser(request);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const url = new URL(request.url).searchParams.get("url") ?? "";

  try {
    return NextResponse.json(await fichaPorImdb(url));
  } catch (err) {
    if (err instanceof TmdbError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro inesperado ao buscar no TMDB." }, { status: 500 });
  }
}
