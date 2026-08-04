import projectsJson from "@/data/projects.json";

export interface Creditos {
  produtora?: string;
  direcao?: string;
  funcaoBruno?: string;
}

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
  creditos?: Creditos;
  extras?: ComercialExtra[];
}

export interface Filme {
  id: string;
  titulo: string;
  ano: number;
  tipo: string;
  url: string;
  poster?: string;
  banner?: string;
  creditos?: Creditos;
}

export interface ImagemGaleria {
  id: string;
  src: string;
  alt?: string;
}

interface ProjectsData {
  comerciais: Comercial[];
  filmes: Filme[];
  galeria: ImagemGaleria[];
}

const data = projectsJson as ProjectsData;

export const comerciais: Comercial[] = data.comerciais;
export const filmes: Filme[] = data.filmes;
export const galeria: ImagemGaleria[] = data.galeria ?? [];
