import siteJson from "@/data/site.json";
import type { AboutContent } from "@/lib/about";

export interface ComercialExtra {
  id: string;
  titulo: string;
  url: string;
  ano?: number;
}

export interface Comercial {
  id: string;
  logo: string;
  alt: string;
  titulo: string;
  sub: string;
  url: string;
  ano: number;
  zoom?: number;
  banner?: string;
  extras?: ComercialExtra[];
}

export interface Filme {
  id: string;
  titulo: string;
  ano: number;
  tipo: string;
  url?: string;
  poster?: string;
  banner?: string;
  // ficha técnica — preenchida pela busca do IMDb (via TMDB) no admin,
  // editável à mão; filmes ainda não lançados costumam ter só direcao
  imdb?: string;
  direcao?: string;
  fotografia?: string;
  produtora?: string;
  /** minutos; só serve pra dizer se é longa ou curta */
  duracao?: number;
}

/** Lançado = tem vídeo ou página no IMDb; só esses abrem o modal. */
export function filmeLancado(f: Filme): boolean {
  return !!(f.url?.trim() || f.imdb?.trim());
}

/** Corte da Academia: até 40 min é curta. */
export function formatoFilme(f: Filme): "longa" | "curta" | null {
  if (!f.duracao) return null;
  return f.duracao > 40 ? "longa" : "curta";
}

export interface ImagemGaleria {
  id: string;
  src: string;
  alt?: string;
}

export interface SiteData {
  about: AboutContent;
  comerciais: Comercial[];
  filmes: Filme[];
  galeria: ImagemGaleria[];
}

const data = siteJson as SiteData;

export const comerciais: Comercial[] = data.comerciais;
export const filmes: Filme[] = data.filmes;
export const galeria: ImagemGaleria[] = data.galeria ?? [];
