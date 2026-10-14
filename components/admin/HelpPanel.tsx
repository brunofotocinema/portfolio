"use client";

import { useEffect, useState } from "react";

/**
 * "?" button in the admin header that opens a side panel with the playbook
 * for using the panel. Written for Bruno (the site owner), not developers.
 */
export default function HelpPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="admin-help-btn"
        aria-label="Ajuda"
        title="Como usar o painel"
        onClick={() => setOpen(true)}
      >
        ?
      </button>

      {open && (
        <div className="admin-help-overlay" onClick={() => setOpen(false)}>
          <aside
            className="admin-help"
            role="dialog"
            aria-label="Como usar o painel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-help-head">
              <h2>Como usar o painel</h2>
              <button type="button" className="admin-link" onClick={() => setOpen(false)}>
                Fechar ✕
              </button>
            </div>

            <p>
              O painel tem dois modos, no seletor do canto de cima: <strong>Adicionar</strong>, pra
              colocar coisa nova no site, e <strong>Editar</strong>, pra mexer no que já está lá.
              Toda mudança leva <strong>1 a 2 minutos</strong> pra aparecer no site.
            </p>

            <details open>
              <summary>Adicionar um filme ou série</summary>
              <ol>
                <li>Em Adicionar, clique em <strong>Filmes e Séries</strong>.</li>
                <li>
                  Responda se o filme <strong>já foi lançado</strong>.
                </li>
                <li>
                  <strong>Se já foi:</strong> cole o link da página do filme no IMDb (aquele que tem{" "}
                  <code>/title/tt…</code>) e clique em <strong>Buscar</strong>. Título, ano, direção,
                  fotografia, produtora e pôster aparecem preenchidos. Confira e corrija o que
                  precisar.
                </li>
                <li>
                  O link do vídeo é opcional. Com vídeo, o filme abre o player no site. Sem vídeo,
                  abre com o pôster e a ficha.
                </li>
                <li>
                  <strong>Se ainda não foi:</strong>{" "}só título, ano da filmagem e, se quiser, a
                  direção. No site ele aparece como &ldquo;Em finalização&rdquo; e não abre ao clicar.
                </li>
                <li>
                  Clique em <strong>Publicar</strong>.
                </li>
              </ol>
              <p className="admin-help-tip">
                O filme não está no IMDb? Use &ldquo;Preencher à mão&rdquo;. Aí o link do vídeo passa
                a ser obrigatório.
              </p>
            </details>

            <details>
              <summary>Adicionar um comercial</summary>
              <ol>
                <li>Em Adicionar, clique em <strong>Comerciais</strong>.</li>
                <li>
                  Responda se é uma <strong>marca nova</strong>.
                </li>
                <li>
                  <strong>Se a marca já está no site:</strong> escolha a marca na lista, dê um nome
                  ao vídeo (por exemplo, o nome da campanha) e preencha o ano de lançamento e o link
                  do vídeo (YouTube ou Vimeo). O vídeo aparece ao lado do player quando alguém clica
                  na marca.
                </li>
                <li>
                  <strong>Se é marca nova:</strong> preencha o nome da marca, o ano de lançamento, o
                  link do vídeo e a logo em PNG. Se a logo tiver fundo, dá pra remover ali mesmo antes
                  de confirmar.
                </li>
                <li>
                  Clique em <strong>Publicar</strong>.
                </li>
              </ol>
              <p className="admin-help-tip">
                Quer que um vídeo novo vire o principal da marca (o que aparece no card)? Depois de
                publicar, vá em <strong>Editar</strong>, ache o card da marca e use{" "}
                <strong>Tornar principal</strong>.
              </p>
            </details>

            <details>
              <summary>Adicionar uma foto na galeria</summary>
              <ol>
                <li>Em Adicionar, clique em <strong>Galeria</strong>.</li>
                <li>Escolha a imagem e, se quiser, escreva uma legenda.</li>
                <li>
                  Clique em <strong>Publicar</strong>.
                </li>
              </ol>
            </details>

            <details>
              <summary>Editar, reordenar ou remover</summary>
              <p>
                Em <strong>Editar</strong> ficam os comerciais, os filmes, a seção Sobre e a galeria,
                na mesma ordem do site.
              </p>
              <ul>
                <li>
                  <strong>▲ ▼</strong> mudam a ordem. A ordem do painel é a ordem do site.
                </li>
                <li>Título, ano, links e imagens dá pra mudar direto na lista.</li>
                <li>
                  <strong>Remover</strong> só marca o item. Dá pra desfazer até salvar.
                </li>
                <li>
                  Num comercial, o vídeo <strong>Principal</strong> é o do card do site. Os outros
                  aparecem ao lado do player. <strong>Tornar principal</strong> troca um pelo outro.
                </li>
                <li>
                  Num filme, colar o link do IMDb e clicar em <strong>Buscar</strong> atualiza a ficha
                  técnica e o pôster, sem mexer no título e no ano.
                </li>
              </ul>
            </details>

            <details>
              <summary>Salvar as edições</summary>
              <ol>
                <li>
                  As edições ficam guardadas só no navegador. O número na aba{" "}
                  <strong>Editar</strong> mostra quantas estão pendentes.
                </li>
                <li>
                  Clique em <strong>Revisar e salvar</strong>, confira a lista e confirme em{" "}
                  <strong>Comitar</strong>.
                </li>
                <li>
                  Mudou de ideia? <strong>Descartar</strong> volta tudo como estava.
                </li>
              </ol>
              <p className="admin-help-tip">
                Atenção: fechar ou recarregar a página antes de salvar perde as edições. A galeria é
                a exceção: remover ou editar uma foto vale na hora.
              </p>
            </details>

            <details>
              <summary>Quando um filme for lançado</summary>
              <p>
                Em <strong>Editar</strong>, ache o filme, cole o link do IMDb, clique em{" "}
                <strong>Buscar</strong> e salve. Ele deixa de aparecer como &ldquo;Em
                finalização&rdquo; e passa a abrir com a ficha. Se tiver trailer, cole também o link
                do vídeo.
              </p>
            </details>

            <details>
              <summary>Seção Sobre</summary>
              <p>
                Os textos têm versão em português e em inglês, e as duas precisam ser atualizadas.
                Uma linha em branco no meio do texto vira um novo parágrafo no site.
              </p>
            </details>

            <details>
              <summary>Algo deu errado?</summary>
              <ul>
                <li>
                  <strong>A mudança não apareceu:</strong> espere 2 minutos e recarregue o site.
                </li>
                <li>
                  <strong>A busca no IMDb deu erro:</strong> confira se o link é da página do filme
                  (<code>imdb.com/title/tt…</code>). Se o filme não estiver no TMDB, preencha à mão.
                </li>
                <li>
                  <strong>Pediu login de novo:</strong> a sessão expirou. Entre de novo. O que ainda
                  não tinha sido salvo se perde.
                </li>
                <li>
                  <strong>Publicou algo errado:</strong> corrija em Editar e salve. Não existe
                  &ldquo;desfazer&rdquo; depois de publicado.
                </li>
              </ul>
            </details>
          </aside>
        </div>
      )}
    </>
  );
}
