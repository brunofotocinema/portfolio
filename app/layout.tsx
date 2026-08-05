import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Montserrat } from "next/font/google";
import LanguageProvider from "@/lib/language-context";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  title: "Bruno Homem — Gaffer",
  description:
    "Bruno Homem — gaffer / chefe de elétrica. Cinema, comerciais e séries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolage.variable} ${instrumentSans.variable} ${montserrat.variable}`}
    >
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
