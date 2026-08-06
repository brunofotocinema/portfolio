import siteJson from "@/data/site.json";

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

interface SiteData {
  about: AboutContent;
}

export const about: AboutContent = (siteJson as SiteData).about;
