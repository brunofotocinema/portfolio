import { auth } from "@/lib/firebase";
import type { FichaFilme } from "@/lib/tmdb";

export type { FichaFilme };

/** Admin-side: asks our API to resolve an IMDb link into a ficha técnica. */
export async function buscarFichaImdb(imdbUrl: string): Promise<FichaFilme> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/admin/imdb?url=${encodeURIComponent(imdbUrl)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Não foi possível buscar no IMDb.");
  return json as FichaFilme;
}
