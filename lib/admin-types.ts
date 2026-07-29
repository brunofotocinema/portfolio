export type Categoria = "publicidade" | "filmes-series";

export interface CreditosInput {
  produtora?: string;
  direcao?: string;
  funcaoBruno?: string;
}

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  publicidade: "Publicidade",
  "filmes-series": "Filmes e Séries",
};
