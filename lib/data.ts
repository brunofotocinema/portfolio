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
