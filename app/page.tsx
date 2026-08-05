import { comerciais, filmes, galeria } from "@/lib/data";
import Hero from "@/components/Hero";
import ComerciaisGrid from "@/components/ComerciaisGrid";
import CinemaList from "@/components/CinemaList";
import Galeria from "@/components/Galeria";
import Sobre from "@/components/Sobre";
import Contato from "@/components/Contato";
import Footer from "@/components/Footer";
import ModalProvider from "@/components/ModalProvider";
import SectionHeading from "@/components/SectionHeading";

export default function Home() {
  return (
    <ModalProvider>
      <Hero />

      <section id="trabalhos">
        <div className="sec-head">
          <SectionHeading i18nKey="section.comerciais" />
        </div>
        <ComerciaisGrid items={comerciais} />
      </section>

      <section id="cinema">
        <div className="sec-head">
          <SectionHeading i18nKey="section.cinema" />
        </div>
        <CinemaList items={filmes} />
      </section>

      <Sobre />
      <Galeria items={galeria} />
      <Contato />
      <Footer />
    </ModalProvider>
  );
}
