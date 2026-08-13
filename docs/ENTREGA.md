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
- **Variáveis de ambiente:** ficam configuradas no painel da Vercel (Project → Settings →
  Environment Variables) e, para rodar localmente, em um `.env.local` (nunca commitado — veja
  `.env.example` pra saber quais preencher). São duas famílias:
  - `NEXT_PUBLIC_FIREBASE_*` — config do Firebase Auth (pode ficar exposta no navegador).
  - `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BRANCH` — um *fine-grained
    personal access token* do GitHub, restrito a este repositório, com permissão "Contents:
    Read and write". É o que permite o painel commitar. **Nunca deve ser exposto ao cliente.**

## 3. Linguagens e stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, build com webpack) |
| Linguagem | TypeScript / React 19 |
| Estilos | CSS puro (sem Tailwind/CSS-in-JS) — `app/globals.css` (site) + `app/admin/admin.css` (painel) |
| Autenticação do painel | Firebase Authentication (SDK client) |
| Persistência de conteúdo | API REST do GitHub (Contents API) — sem banco de dados |
| Verificação de sessão no servidor | [`jose`](https://github.com/panva/jose) (valida o token do Firebase nas rotas `/api/admin/*`) |
| Deploy | Vercel |

> ⚠️ Aviso que já está no `AGENTS.md`/`CLAUDE.md` do repo: esta versão do Next.js pode ter
> diferenças em relação ao que você já conhece. Vale checar `node_modules/next/dist/docs/` antes de
> mudanças estruturais.

## 4. Estrutura do repositório

```
app/
  page.tsx                    → homepage pública (monta as seções na ordem do site)
  layout.tsx                  → fontes, metadata, idioma (html lang, etc.)
  globals.css                 → estilos do site público
  admin/
    page.tsx                  → painel administrativo (orquestra tudo, é "use client")
    admin.css                 → estilos exclusivos do painel
  api/admin/                  → rotas protegidas (todas exigem login Firebase)
    content/route.ts          → GET/PUT do conteúdo inteiro do site (Sobre + comerciais + filmes)
    projects/route.ts         → POST — adicionar projeto novo (comercial, filme ou imagem de galeria)
    projects/[id]/route.ts    → DELETE/PUT — imagens da galeria e "vídeos extra" de uma marca

components/                   → componentes do site público (Hero, Sobre, ComerciaisGrid, CinemaList,
                                 Galeria, Contato, Footer, LogoMark, etc.)
components/admin/              → componentes exclusivos do painel (ProjectForm, ProjectList, AboutForm,
                                 GaleriaList, SaveReviewModal, LoginForm, LogoUploader)

lib/
  data.ts                     → tipos (Comercial, Filme, ImagemGaleria) + leitura de data/site.json
  about.ts                    → tipos da seção Sobre + leitura de data/site.json
  i18n.ts                     → textos fixos em PT/EN (navegação, títulos de seção)
  language-context.tsx        → contexto de idioma (PT/EN) do site público
  firebase.ts                 → inicialização do Firebase (usado só pelo login do admin)
  auth-server.ts              → valida o token do Firebase nas rotas /api/admin/*
  github.ts                   → cliente da API do GitHub (ler e commitar arquivos)
  admin-types.ts, admin-server-utils.ts, admin-change-summary.ts, slugify.ts, video-utils.ts
                               → utilidades específicas do painel e de vídeo

data/
  site.json                   → ÚNICA fonte de conteúdo editável (Sobre, comerciais, filmes, galeria)

public/
  fotos/, logos/, banners/, posters/, galeria/, marca/, hero.mp4
                               → mídia usada pelo site e pelos projetos cadastrados
```

## 5. O painel administrativo (`/admin`)

### O que é

Uma página protegida por login (Firebase Auth) que é o único jeito de editar o conteúdo do site sem
mexer em código. Não existe banco de dados por trás — toda alteração vira um **commit real no
GitHub**, que dispara um deploy automático na Vercel (o site leva ~1–2 min pra refletir a mudança).

### Como funciona

O painel tem dois modelos de salvamento diferentes, por design:

1. **Adicionar projeto novo** (marca nova em Comerciais, filme/série ou imagem de galeria) —
   formulário no topo do painel. Cada envio **commita na hora**, um projeto por vez. Em Comerciais,
   esse formulário serve só pra criar marca nova (título, logo, ano, link) — acrescentar mais um
   vídeo a uma marca que já existe é outro fluxo (ver abaixo).
2. **Tudo o mais** (reordenar comerciais/filmes, editar título/ano/link/imagem de um projeto
   existente, gerenciar os vídeos de uma marca, remover um projeto, editar a seção Sobre) fica num
   **rascunho local no navegador**. Nada disso vai pro GitHub até o usuário clicar em "Revisar e
   salvar", conferir a lista de mudanças numa tela somente-leitura, e confirmar em **"Comitar"**
   (ou desistir em "Cancelar"). Isso garante que várias edições viram **um único commit**.

As seções aparecem no painel na mesma ordem em que aparecem no site: **Comerciais → Filmes e
Séries → Sobre → Galeria**.

### O que ele faz

- Adicionar marca nova em Comerciais, filme/série ou imagem de galeria (com upload de
  logo/banner/imagem).
- Cadastrar um filme/série ainda sem lançamento: um checkbox "Ainda sem lançamento (em
  finalização)" dispensa banner e link, pede só título e ano. No site público esses projetos
  aparecem sem pôster, com "Em finalização" no lugar do tipo e "(Filmagem)" ao lado do ano.
- Em cada card de marca já existente (ex.: "Arezzo"), gerenciar todos os vídeos dela juntos: o
  vídeo **Principal** (o que aparece no card do site) e os **secundários** (que aparecem como cards
  extras dentro do player, ao lado do vídeo, quando alguém clica na marca no site) — todos com
  título/ano/link editáveis. Um botão **"Tornar principal"** troca um vídeo secundário pelo
  principal, e **"+ Novo link"** acrescenta mais um vídeo à marca.
- Reordenar comerciais e filmes (setas ▲▼) — a ordem manual é o que o site público exibe.
- Editar título, ano, link do vídeo e trocar a imagem de um comercial/filme existente, direto na
  lista (sem abrir modal).
- Marcar um comercial/filme para remoção, com opção de desfazer antes de salvar.
- Editar os dois parágrafos (PT/EN) e a lista de destaques da seção Sobre — incluindo adicionar,
  remover e reordenar destaques. (Hoje os parágrafos e as fotos ficam ocultos no site público atrás
  de um botão "Saiba mais" — só a tabela de destaques fica sempre visível — mas continuam editáveis
  no painel normalmente.)
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
- **Não garante um único commit quando envolve trocar imagem.** A API do GitHub usada (Contents
  API, compatível com o token fine-grained deste repositório) só aceita **um arquivo por commit**.
  Então: mudanças de texto/ordem/data/vídeos de marca sempre viram exatamente 1 commit; se além
  disso uma imagem for trocada ou um projeto com imagem for removido, isso soma +1 commit por
  arquivo de imagem — tudo ainda sai de um único clique em "Comitar", só não é literalmente um
  commit no Git.
- **Não valida o conteúdo do vídeo** além de checar se os campos obrigatórios foram preenchidos.
  Vale conferir visualmente no site depois do deploy.

## 6. Fontes (tipografia)

Carregadas via [`next/font/google`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
em [`app/layout.tsx`](../app/layout.tsx) — o Next.js baixa e otimiza no build, não depende de CDN
externo nem de arquivos de fonte manuais.

| Uso no site | Fonte | Peso(s) carregados | Variável CSS | Onde é aplicada |
|---|---|---|---|---|
| Títulos e headings (h2 de seção, nomes de filme, títulos de card) | **Bricolage Grotesque** — display geométrico, traços marcados | 400, 600, 700 | `--font-display` | `app/globals.css` |
| Texto corrido (parágrafos, legendas, menu) | **Instrument Sans** — sans-serif neutra, alta legibilidade | 400, 500 | `--font-body` | `app/globals.css`, `body` |
| Logo/marca ("BRUNO HOMEM" animado no Hero) | **Montserrat** — geométrica, super condensada no peso mais pesado | 900 (black) | `--font-logo` | `components/LogoMark.tsx` |

Pra trocar peso/família de qualquer uma delas, é só mexer na declaração em `app/layout.tsx` (linhas
6–22) — as variáveis CSS (`--font-display`, `--font-body`, `--font-logo`) já se propagam pro resto
do site automaticamente.
