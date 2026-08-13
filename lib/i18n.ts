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
    "cinema.gravacao": "gravação",

    "contato.lead": "Próximo projeto?",

    "footer.tagline": "Gaffer · Chefe de elétrica",

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

    "contato.lead": "Next project?",

    "footer.tagline": "Gaffer · Head Electrician",

    "modal.close": "Close ✕",
  },
};
