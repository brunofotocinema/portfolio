import aboutJson from "@/data/about.json";

export interface Bilingual {
  pt: string;
  en: string;
}

export interface ExpertiseItem {
  title: Bilingual;
  sub: Bilingual;
}

export interface AboutContent {
  p1: Bilingual;
  p2: Bilingual;
  expertise: ExpertiseItem[];
}

export const about: AboutContent = aboutJson as AboutContent;
