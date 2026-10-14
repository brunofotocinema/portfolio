# Documento de Entrega — Site Bruno Homem

Visão geral do projeto para quem for mexer nele depois. Não é uma referência exaustiva de código
(o próprio código é a fonte da verdade) — é um mapa pra se orientar rápido: o que é isso, como está
hospedado, como está organizado, e como funciona o painel administrativo.

## 1. O que é

Site de portfólio de Bruno Homem (gaffer / chefe de elétrica): comerciais, filmes/séries, galeria de
fotos e uma seção "Sobre". Site público em PT/EN, com um painel administrativo em `/admin` para editar
o conteúdo sem precisar mexer em código.

## 2. Infraestrutura e hospedagem

- **Hospedagem:** [Vercel](https://vercel.com), com deploy automático a cada push na branch `main`
  do repositório GitHub (`brunofotocinema/portfolio`). Um deploy leva cerca de 1–2 minutos.
- **Domínio:** configurado direto no painel da Vercel (Project → Domains). Não há nada de domínio ou
  DNS no código — é 100% gerenciado pela Vercel.
- **Banco de dados:** não existe. Todo o conteúdo editável (comerciais, filmes, galeria, seção Sobre)
  vive em um único arquivo, [`data/site.json`](../data/site.json), dentro do próprio repositório
  Git. O painel administrativo edita esse arquivo via commits na API do GitHub.
- **Autenticação do painel:** [Firebase Authentication](https://firebase.google.com/products/auth)
  (e-mail/senha). Só serve para controlar quem consegue entrar em `/admin` — o site público não usa
  Firebase pra nada.
- **Dados de filmes:** a ficha técnica dos filmes (direção, fotografia, produtora, duração, pôster)
  vem da API do [TMDB](https://www.themoviedb.org), consultada só pelo painel a partir do link do
  IMDb. O site público não consulta o TMDB (ver seção 6).
- **Variáveis de ambiente:** ficam configuradas no painel da Vercel (Project → Settings →
  Environment Variables) e, para rodar localmente, em um `.env.local` (nunca commitado — veja
  `.env.example` pra saber quais preencher). São três famílias:
  - `NEXT_PUBLIC_FIREBASE_*` — config do Firebase Auth (pode ficar exposta no navegador).
  - `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BRANCH` — um *fine-grained
    personal access token* do GitHub, restrito a este repositório, com permissão "Contents:
    Read and write". É o que permite o painel commitar. **Nunca deve ser exposto ao cliente.**
  - `TMDB_API_KEY` — chave da API do TMDB (aceita a "API key" v3 ou o "Read Access Token" v4).
    Só usada no servidor. Sem ela, o botão "Buscar" do painel avisa que a chave não está
    configurada; o resto do site funciona normalmente. Depois de criar ou trocar a variável na
    Vercel, é preciso um redeploy para ela valer.

## 3. Linguagens e stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, build com webpack) |
| Linguagem | TypeScript / React 19 |
| Estilos | CSS puro (sem Tailwind/CSS-in-JS) — `app/globals.css` (site) + `app/admin/admin.css` (painel) |
| Autenticação do painel | Firebase Authentication (SDK client) |
| Persistência de conteúdo | API REST do GitHub (Contents API) — sem banco de dados |
| Verificação de sessão no servidor | [`jose`](https://github.com/panva/jose) (valida o token do Firebase nas rotas `/api/admin/*`) |
| Ficha técnica dos filmes | API do TMDB (v3), chamada só pela rota `/api/admin/imdb` |
| Deploy | Vercel |

> ⚠️ Aviso que já está no `AGENTS.md`/`CLAUDE.md` do repo: esta versão do Next.js pode ter
> diferenças em relação ao que você já conhece. Vale checar `node_modules/next/dist/docs/` antes de
> mudanças estruturais.

## 4. Estrutura do repositório

```
app/
  page.tsx                    → homepage pública (monta as seções na ordem do site)
  layout.tsx                  → fontes, metadata, idioma; injeta o script de ancoragem do logo
  globals.css                 → estilos do site público
  admin/
    page.tsx                  → painel administrativo (orquestra tudo, é "use client")
    admin.css                 → estilos exclusivos do painel
  api/admin/                  → rotas protegidas (todas exigem login Firebase)
    content/route.ts          → GET/PUT do conteúdo inteiro do site (Sobre + comerciais + filmes)
    projects/route.ts         → POST — adicionar projeto novo (comercial, vídeo de marca existente,
                                 filme ou imagem de galeria)
    projects/[id]/route.ts    → DELETE/PUT — imagens da galeria
    imdb/route.ts             → GET — recebe um link do IMDb e devolve a ficha técnica (via TMDB)

components/                   → componentes do site público (Hero, Sobre, ComerciaisGrid, CinemaList,
                                 Galeria, Contato, Footer, LogoMark, VideoModal, etc.)
components/admin/              → componentes exclusivos do painel (ProjectForm, ProjectList, AboutForm,
                                 GaleriaList, SaveReviewModal, LoginForm, LogoUploader, HelpPanel)

lib/
  data.ts                     → tipos (Comercial, Filme, ImagemGaleria) + leitura de data/site.json
  about.ts                    → tipos da seção Sobre + leitura de data/site.json
  i18n.ts                     → textos fixos em PT/EN (navegação, títulos, rótulos da ficha)
  language-context.tsx        → contexto de idioma (PT/EN) do site público
  firebase.ts                 → inicialização do Firebase (usado só pelo login do admin)
  auth-server.ts              → valida o token do Firebase nas rotas /api/admin/*
  github.ts                   → cliente da API do GitHub (ler e commitar arquivos)
  tmdb.ts                     → (servidor) link do IMDb → ficha técnica, via API do TMDB
  imdb-client.ts              → (painel) chama /api/admin/imdb com o token do usuário
  logo-anchor.ts              → script que prende o logo da abertura ao vídeo (ver seção 7)
  admin-types.ts, admin-server-utils.ts, admin-change-summary.ts, slugify.ts, video-utils.ts
                               → utilidades específicas do painel e de vídeo

data/
  site.json                   → ÚNICA fonte de conteúdo editável (Sobre, comerciais, filmes, galeria)

public/
  fotos/, logos/, banners/, posters/, galeria/, marca/, hero.mp4, tmdb.svg
                               → mídia usada pelo site e pelos projetos cadastrados
```

## 5. O painel administrativo (`/admin`)

### O que é

Uma página protegida por login (Firebase Auth) que é o único jeito de editar o conteúdo do site sem
mexer em código. Não existe banco de dados por trás — toda alteração vira um **commit real no
GitHub**, que dispara um deploy automático na Vercel (o site leva ~1–2 min pra refletir a mudança).

### Como funciona

O painel tem dois modos, escolhidos num seletor **Adicionar | Editar** no canto superior direito. Ao
lado dele, um botão **?** abre um guia de uso escrito para o Bruno (`components/admin/HelpPanel.tsx`)
— é o lugar a atualizar quando o fluxo do painel mudar.

1. **Adicionar** (abre por padrão) — formulário guiado. Primeiro escolhe-se o tipo (Comerciais,
   Filmes e Séries ou Galeria); cada campo seguinte só aparece quando o anterior foi preenchido.
   Cada envio, no botão **Publicar**, **commita na hora**, um projeto por vez.
   - **Comercial:** o formulário pergunta se é marca nova.
     - *Marca nova:* nome da marca → ano de lançamento → link do vídeo → logo (PNG, com remoção de
       fundo opcional no próprio navegador). Cria um card novo.
     - *Marca que já está no site:* escolhe a marca numa lista → nome do vídeo → ano de lançamento
       → link. Entra como mais um vídeo (secundário) da marca, sem card novo.
   - **Filme ou série:** o formulário pergunta se já foi lançado.
     - *Lançado:* cola-se o link do IMDb e clica-se em **Buscar**; título, ano, direção, direção
       de fotografia, produtora, duração e pôster vêm preenchidos e continuam editáveis. Vídeo é
       opcional; banner é opcional quando há pôster. Se o filme não estiver no IMDb, "Preencher à
       mão" libera a ficha vazia — nesse caso o link do vídeo passa a ser obrigatório.
     - *Ainda não lançado (em finalização):* título, ano da filmagem e direção (opcional).
   - **Galeria:** imagem → legenda opcional.
2. **Editar** — tudo o que já existe (reordenar comerciais/filmes, editar campos, gerenciar os
   vídeos de uma marca, remover, seção Sobre, galeria). Fica num **rascunho local no navegador**.
   Nada disso vai pro GitHub até o usuário clicar em "Revisar e salvar", conferir a lista de
   mudanças numa tela somente-leitura, e confirmar em **"Comitar"** (ou desistir em "Cancelar").
   Isso garante que várias edições viram **um único commit**. A aba "Editar" mostra um contador com
   o número de alterações pendentes.

No modo Editar, as seções aparecem na mesma ordem em que aparecem no site: **Comerciais → Filmes e
Séries → Sobre → Galeria**.

### O que ele faz

- Adicionar marca nova em Comerciais, filme/série ou imagem de galeria (com upload de
  logo/banner/imagem).
- Preencher a ficha técnica de um filme a partir do link do IMDb (ver seção 6), tanto ao adicionar
  quanto, no modo Editar, num filme que já existe — nesse caso a busca atualiza ficha e pôster mas
  mantém o título e o ano como estão.
- Cadastrar um filme/série ainda sem lançamento. No site público esses projetos aparecem com
  "Em finalização" no lugar do tipo, "(Filmagem)" ao lado do ano, e não abrem ao clicar. Quando o
  filme for lançado, basta colar o link do IMDb nele (modo Editar), buscar e salvar.
- Em cada card de marca já existente (ex.: "Arezzo"), gerenciar todos os vídeos dela juntos: o
  vídeo **Principal** (o que aparece no card do site) e os **secundários** (que aparecem como cards
  extras dentro do player, ao lado do vídeo, quando alguém clica na marca no site) — todos com
  título/ano/link editáveis. Um botão **"Tornar principal"** troca um vídeo secundário pelo
  principal, e **"+ Novo link"** acrescenta mais um vídeo à marca.
- Reordenar comerciais e filmes (setas ▲▼) — a ordem manual é o que o site público exibe.
- Editar título, ano, link do vídeo, ficha técnica e trocar a imagem de um comercial/filme
  existente, direto na lista (sem abrir modal).
- Marcar um comercial/filme para remoção, com opção de desfazer antes de salvar.
- Editar os dois blocos de texto (PT/EN) e a lista de destaques da seção Sobre — incluindo
  adicionar, remover e reordenar destaques. Dentro de cada bloco, uma linha em branco vira um novo
  parágrafo no site. (Os textos e as fotos ficam atrás de um botão "Saiba mais" no site público —
  só a tabela de destaques fica sempre visível — mas continuam editáveis no painel normalmente.)
- Editar/remover imagens da galeria (esse é o único conteúdo que ainda tem ação imediata, fora do
  rascunho).
- Revisar, num único lugar, tudo que vai ser commitado antes de confirmar.

### O que ele **não** faz

- **Não tem histórico/undo depois de commitado.** Reverter um commit indesejado significa mexer
  direto no Git (ou reverter pelo próprio GitHub).
- **Não garante upload de vídeo** — só aceita um link (YouTube/Vimeo). O vídeo em si vive na
  plataforma externa, o painel só guarda a URL.
- **Não gerencia usuários.** Quem pode entrar em `/admin` é definido direto no console do Firebase
  Authentication — não existe tela de cadastro/convite no site.
- **Não guarda o rascunho do modo Editar** se a página for fechada/recarregada ou a sessão expirar
  antes de salvar.
- **Não garante um único commit quando envolve trocar imagem.** A API do GitHub usada (Contents
  API, compatível com o token fine-grained deste repositório) só aceita **um arquivo por commit**.
  Então: mudanças de texto/ordem/data/vídeos de marca sempre viram exatamente 1 commit; se além
  disso uma imagem for trocada ou um projeto com imagem for removido, isso soma +1 commit por
  arquivo de imagem — tudo ainda sai de um único clique em "Comitar", só não é literalmente um
  commit no Git.
- **Não valida o conteúdo do vídeo** além de checar se os campos obrigatórios foram preenchidos.
  Vale conferir visualmente no site depois do deploy.

## 6. Ficha técnica dos filmes (IMDb → TMDB)

O IMDb não tem API pública gratuita e bloqueia leitura automática das páginas, então a busca passa
pelo TMDB, que aceita o código do IMDb (`tt…`) diretamente.

- **Fluxo:** o painel envia o link do IMDb para `/api/admin/imdb` (exige login) → `lib/tmdb.ts`
  extrai o código `tt…`, pergunta ao TMDB qual filme (ou série) tem esse código e busca os
  detalhes em pt-BR, com os créditos → devolve título, ano, direção, direção de fotografia,
  produtoras (até 3), duração e pôster.
- **Onde os dados ficam:** ao salvar, tudo é copiado para o filme em `data/site.json` (campos
  `imdb`, `direcao`, `fotografia`, `produtora`, `duracao`, `poster`). O site público não consulta o
  TMDB; se o TMDB sair do ar, nada muda no site.
- **Pôster:** é guardado como link para `image.tmdb.org`, não como arquivo no repositório. Se um
  dia o TMDB trocar a imagem, o pôster quebra; nesse caso, basta enviar um banner pelo painel. Ao
  remover um filme, o painel só apaga do repositório imagens que são arquivos locais.
- **No site:** a lista mostra direção e DOP (direção de fotografia) na coluna da direita (filme não
  lançado e sem esses dados mostra "Em finalização"). Só abrem ao clicar os filmes com vídeo ou link do IMDb. O modal mostra o player (ou o pôster, se não houver vídeo) e a ficha: título, ano,
  "Longa-metragem" ou "Curta-metragem" (até 40 min é curta), direção, direção de fotografia,
  produtora e "Ver no IMDb".
- **Crédito obrigatório:** os termos de uso da API do TMDB exigem atribuição. Está no rodapé do
  site (logo em `public/tmdb.svg` + aviso em PT/EN). Não remover enquanto a integração existir.
- **Mais de um cadastro por código:** o mesmo código do IMDb às vezes está ligado a mais de um
  registro no TMDB (por exemplo, um "filme" vazio e a série de verdade). A busca consulta todos e
  fica com o que tiver mais campos preenchidos. Em série sem diretores cadastrados, o campo
  direção recebe quem criou a série.
- **Qualidade dos dados:** o TMDB é colaborativo. Em produções menores pode faltar a direção de
  fotografia ou a produtora. Por isso os campos ficam editáveis antes de salvar.

## 7. Animação do logo na abertura

O logo começa grande no centro do vídeo e, depois de ~3 s, encolhe até o canto superior esquerdo,
onde fica fixo enquanto a página rola. Os quadros-chave estão em `app/globals.css` (`logoStage`,
`logoIcon`, `logoBruno`, `logoHomem`); os tamanhos inicial e final são as variáveis
`--logo-big-w` e `--logo-small-w`.

O detalhe não óbvio é a âncora. Durante a pausa inicial, o logo faz parte do vídeo e rola junto com
ele; no fim, fica fixo na tela. Isso é feito assim:

- A camada do logo começa `position:absolute` dentro do hero, então o navegador a rola junto com o
  vídeo sem nenhum JavaScript.
- `lib/logo-anchor.ts` é um script comum injetado no início do `<body>` (em `app/layout.tsx`). Quando
  o logo começa a encolher, ele troca a camada para `position:fixed` e, a cada quadro, compensa a
  rolagem na proporção de quanto falta para o logo chegar ao canto. Ao fim da animação, para de
  rodar.
- **Não trocar esse script por `next/script`**, nem pelo `strategy="beforeInteractive"`: o Next
  coloca esses scripts numa fila que só roda depois que o JavaScript dele carrega, e o logo volta a
  ficar preso à tela no primeiro segundo.

## 8. Fontes (tipografia)

Carregadas via [`next/font/google`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
em [`app/layout.tsx`](../app/layout.tsx) — o Next.js baixa e otimiza no build, não depende de CDN
externo nem de arquivos de fonte manuais.

| Uso no site | Fonte | Peso(s) carregados | Variável CSS | Onde é aplicada |
|---|---|---|---|---|
| Títulos e headings (h2 de seção, nomes de filme, títulos de card) | **Bricolage Grotesque** — display geométrico, traços marcados | 400, 600, 700 | `--font-display` | `app/globals.css` |
| Texto corrido (parágrafos, legendas, menu) | **Instrument Sans** — sans-serif neutra, alta legibilidade | 400, 500 | `--font-body` | `app/globals.css`, `body` |
| Logo/marca ("BRUNO HOMEM" animado no Hero) | **Montserrat** — geométrica, super condensada no peso mais pesado | 900 (black) | `--font-logo` | `components/LogoMark.tsx` |

Pra trocar peso/família de qualquer uma delas, é só mexer na declaração em `app/layout.tsx` —
as variáveis CSS (`--font-display`, `--font-body`, `--font-logo`) já se propagam pro resto do site
automaticamente.
