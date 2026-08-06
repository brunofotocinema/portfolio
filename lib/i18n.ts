export type Lang = "pt" | "en";

export const translations: Record<Lang, Record<string, string>> = {
  pt: {
    "nav.trabalhos": "Trabalhos",
    "nav.cinema": "Cinema",
    "nav.sobre": "Sobre",
    "nav.contato": "Contato",

    "section.comerciais": "Comerciais",
    "section.cinema": "Cinema",
    "section.galeria": "Galeria",

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

    "contato.lead": "Next project?",

    "footer.tagline": "Gaffer · Head Electrician",

    "modal.close": "Close ✕",
  },
};
