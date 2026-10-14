// Server-only: turns an IMDb link into a film's ficha técnica.
// IMDb has no free API and blocks page scraping, so this goes through TMDB,
// which accepts IMDb ids directly. TMDB_API_KEY may be either the v3 "API
// key" or the v4 "read access token" (the long one starting with "eyJ").

const TMDB_API = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export interface FichaFilme {
  imdb: string;
  titulo: string;
  ano?: number;
  direcao?: string;
  fotografia?: string;
  produtora?: string;
  duracao?: number;
  poster?: string;
}

export class TmdbError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export function parseImdbId(input: string): string | null {
  return input.match(/tt\d{6,}/)?.[0] ?? null;
}

interface CrewMember {
  name: string;
  job?: string;
  jobs?: { job: string }[];
}

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new TmdbError("Chave do TMDB não configurada (TMDB_API_KEY no .env).", 503);
  }
  const url = new URL(TMDB_API + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);

  const res = await fetch(url, { headers, cache: "no-store" });
  if (res.status === 401) throw new TmdbError("Chave do TMDB inválida.", 502);
  if (!res.ok) throw new TmdbError(`TMDB respondeu ${res.status}.`, 502);
  return res.json() as Promise<T>;
}

function names(list: { name: string }[] | undefined, max = 3): string | undefined {
  const unique = [...new Set((list ?? []).map((x) => x.name))].slice(0, max);
  return unique.length ? unique.join(", ") : undefined;
}

function crewWithJob(crew: CrewMember[] | undefined, job: string) {
  return (crew ?? []).filter((c) => c.job === job || c.jobs?.some((j) => j.job === job));
}

function yearOf(date: string | undefined): number | undefined {
  const y = Number(date?.slice(0, 4));
  return y || undefined;
}

export async function fichaPorImdb(input: string): Promise<FichaFilme> {
  const imdbId = parseImdbId(input);
  if (!imdbId) throw new TmdbError("Link do IMDb inválido (esperado algo como imdb.com/title/tt1234567).", 400);
  const imdb = `https://www.imdb.com/title/${imdbId}/`;

  const found = await tmdb<{ movie_results: { id: number }[]; tv_results: { id: number }[] }>(
    `/find/${imdbId}`,
    { external_source: "imdb_id" }
  );

  // The same IMDb id can be attached to more than one TMDB record (e.g. an
  // empty stub "movie" plus the real series), so fetch every candidate and
  // keep the one with the most ficha filled in.
  const candidatos = await Promise.all([
    ...found.movie_results.slice(0, 1).map((m) => fichaDeFilme(m.id, imdb)),
    ...found.tv_results.slice(0, 1).map((t) => fichaDeSerie(t.id, imdb)),
  ]);
  if (candidatos.length) {
    return candidatos.reduce((melhor, c) => (camposPreenchidos(c) > camposPreenchidos(melhor) ? c : melhor));
  }

  throw new TmdbError("Não encontrado no TMDB. Preencha a ficha à mão.", 404);
}

function camposPreenchidos(f: FichaFilme): number {
  return [f.ano, f.direcao, f.fotografia, f.produtora, f.duracao, f.poster].filter(Boolean).length;
}

async function fichaDeFilme(id: number, imdb: string): Promise<FichaFilme> {
  const m = await tmdb<{
    title: string;
    release_date?: string;
    runtime?: number;
    poster_path?: string | null;
    production_companies?: { name: string }[];
    credits?: { crew?: CrewMember[] };
  }>(`/movie/${id}`, { language: "pt-BR", append_to_response: "credits" });
  return {
    imdb,
    titulo: m.title,
    ano: yearOf(m.release_date),
    direcao: names(crewWithJob(m.credits?.crew, "Director")),
    fotografia: names(crewWithJob(m.credits?.crew, "Director of Photography")),
    produtora: names(m.production_companies),
    duracao: m.runtime || undefined,
    poster: m.poster_path ? POSTER_BASE + m.poster_path : undefined,
  };
}

async function fichaDeSerie(id: number, imdb: string): Promise<FichaFilme> {
  const s = await tmdb<{
    name: string;
    first_air_date?: string;
    episode_run_time?: number[];
    poster_path?: string | null;
    production_companies?: { name: string }[];
    created_by?: { name: string }[];
    aggregate_credits?: { crew?: CrewMember[] };
  }>(`/tv/${id}`, { language: "pt-BR", append_to_response: "aggregate_credits" });
  const directors = crewWithJob(s.aggregate_credits?.crew, "Director");
  return {
    imdb,
    titulo: s.name,
    ano: yearOf(s.first_air_date),
    // series often have no per-episode directors on TMDB; the creator is the closest
    direcao: names(directors.length ? directors : s.created_by),
    fotografia: names(crewWithJob(s.aggregate_credits?.crew, "Director of Photography")),
    produtora: names(s.production_companies),
    duracao: s.episode_run_time?.[0] || undefined,
    poster: s.poster_path ? POSTER_BASE + s.poster_path : undefined,
  };
}
