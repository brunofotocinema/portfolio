import { comerciais, filmes } from "@/lib/data";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ComerciaisGrid from "@/components/ComerciaisGrid";
import CinemaList from "@/components/CinemaList";
import Sobre from "@/components/Sobre";
import Contato from "@/components/Contato";
import Footer from "@/components/Footer";
import ModalProvider from "@/components/ModalProvider";

export default function Home() {
  return (
    <ModalProvider>
      <Header />
      <Hero />

      <section id="trabalhos">
        <div className="sec-head">
          <h2>Comerciais</h2>
          <span className="idx">{String(comerciais.length).padStart(2, "0")}</span>
        </div>
        <ComerciaisGrid items={comerciais} />
      </section>

      <section id="cinema">
        <div className="sec-head">
          <h2>Cinema</h2>
          <span className="idx">{String(filmes.length).padStart(2, "0")}</span>
        </div>
        <CinemaList items={filmes} />
      </section>

      <Sobre />
      <Contato />
      <Footer />
    </ModalProvider>
  );
}
