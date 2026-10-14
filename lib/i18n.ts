export type Lang = "pt" | "en";

export const translations: Record<Lang, Record<string, string>> = {
  pt: {
    "nav.trabalhos": "Comerciais",
    "nav.cinema": "Cinema",
    "nav.sobre": "Sobre",
    "nav.contato": "Contato",

    "section.comerciais": "Comerciais",
    "section.cinema": "Cinema",
    "section.galeria": "Galeria",

    "sobre.saiba_mais": "Saiba mais",
    "sobre.ver_menos": "Ver menos",

    "cinema.em_finalizacao": "Em finalização",
    "cinema.gravacao": "Filmagem",
    "cinema.direcao": "Direção",
    "cinema.dop": "DOP",

    "filme.direcao": "Direção",
    "filme.fotografia": "Direção de fotografia",
    "filme.produtora": "Produtora",
    "filme.longa": "Longa-metragem",
    "filme.curta": "Curta-metragem",
    "filme.imdb": "Ver no IMDb ↗",

    "contato.lead": "Próximo projeto?",

    "footer.tagline": "Gaffer · Chefe de elétrica",
    "footer.tmdb": "Este site usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.",

    "modal.close": "Fechar ✕",
  },
  en: {
    "nav.trabalhos": "Work",
    "nav.cinema": "Cinema",
    "nav.sobre": "About",
    "nav.contato": "Contact",

    "section.comerciais": "Commercials",
    "section.cinema": "Cinema",
    "section.galeria": "Gallery",

    "sobre.saiba_mais": "Learn more",
    "sobre.ver_menos": "Show less",

    "cinema.em_finalizacao": "In post-production",
    "cinema.gravacao": "filmed",
    "cinema.direcao": "Director",
    "cinema.dop": "DOP",

    "filme.direcao": "Director",
    "filme.fotografia": "Cinematographer",
    "filme.produtora": "Production",
    "filme.longa": "Feature film",
    "filme.curta": "Short film",
    "filme.imdb": "View on IMDb ↗",

    "contato.lead": "Next project?",

    "footer.tagline": "Gaffer · Head Electrician",
    "footer.tmdb": "This website uses the TMDB API but is not endorsed or certified by TMDB.",

    "modal.close": "Close ✕",
  },
};
