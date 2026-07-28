export interface Comercial {
  logo: string;
  alt: string;
  titulo: string;
  sub: string;
  url: string;
  zoom?: number;
}

export interface Filme {
  titulo: string;
  ano: number;
  tipo: string;
  url: string;
}

export const comerciais: Comercial[] = [
  {
    logo: "/logos/tomford.png",
    alt: "Tom Ford",
    titulo: "SS24",
    sub: "Moda · 2024",
    url: "https://player.vimeo.com/video/924696462?autoplay=1&loop=1&controls=1&muted=0",
  },
  {
    // thumb com tarja preta — compensada com zoom
    logo: "/logos/heineken.png",
    alt: "Heineken",
    titulo: "Campanha",
    sub: "Comercial",
    url: "https://www.youtube.com/watch?v=E0fSp_YdvwQ",
    zoom: 1.35,
  },
  {
    // thumb com tarja preta — compensada com zoom
    logo: "/logos/itau.webp",
    alt: "Itaú",
    titulo: "Comercial",
    sub: "Publicidade",
    url: "https://www.youtube.com/watch?v=BXdRo9fCL-I",
    zoom: 1.5,
  },
  {
    // placeholder — aguardando link real da Natura
    logo: "/logos/natura.png",
    alt: "Natura",
    titulo: "Taís Araújo",
    sub: "Comercial",
    url: "https://www.youtube.com/watch?v=ZqzhNZJse2I",
  },
];

export const filmes: Filme[] = [
  {
    titulo: "Perrengue Fashion",
    ano: 2025,
    tipo: "Longa · Amazon MGM",
    url: "https://www.youtube.com/watch?v=QMdLVfBOlpQ",
  },
  {
    titulo: "Furnas Fundas",
    ano: 2023,
    tipo: "Longa · Terror",
    url: "https://www.youtube.com/watch?v=0HsBvqQpQoA",
  },
];
