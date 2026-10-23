# Arquitetura

## Stack e organização

- Vite + React + TypeScript estrito. TanStack Router define rotas; estado de coleção fica na query string.
- TanStack Query mantém cache de leitura e Axios centraliza chamadas REST.
- MSW intercepta `/api/*` e o endpoint WebSocket em desenvolvimento. Fixtures e banco simulado ficam em `src/mocks`.
- Tailwind CSS v4 e componentes compatíveis com o padrão shadcn/ui ficam em `src/styles.css` e `src/components/ui`.
- Preços ETH são strings decimais e cálculos financeiros usam Decimal.js.

## REST simulado

| Área | Contratos |
|---|---|
| Obras | `GET /api/nfts?q=&category=&sort=&page=`, `GET /api/nfts/:id` |
| Autenticação | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Perfil | `PATCH /api/profile`, `POST /api/profile/password` |
| Carrinho | `GET /api/cart`, `POST/DELETE /api/cart/items`, `POST /api/cart/merge`, `POST/DELETE /api/cart/coupon` |
| Favoritos | `GET /api/favorites`, `PUT /api/favorites/:id` |
| Checkout | `GET /api/quote`, `POST /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/settle`, `POST /api/orders/:id/reject` |
| Carteiras | `GET/PUT /api/wallets`, `PATCH /api/wallets/:id/primary` |

Pedidos recebem `Idempotency-Key` e fingerprint de conteúdo. Repetir a chave com o mesmo conteúdo devolve o pedido existente; conteúdo diferente retorna 409. A cotação inclui versões das obras e o checkout rejeita preços desatualizados. O pedido guarda itens e total como snapshot. Confirmar remove do carrinho somente os itens comprados; recusar mantém os itens.

## Sessão e cache

O token de demonstração fica no `localStorage`; sua expiração é de 30 minutos e `/api/auth/me` recupera a sessão após refresh. A senha é convertida em SHA-256 no cliente antes do envio e o mock guarda apenas o hash. Isso serve apenas para simular o requisito: não substitui autenticação, transporte ou armazenamento seguro em backend real. Usuários, sessões, pedidos, favoritos e carrinhos simulados também ficam no `localStorage`.

As chaves privadas do TanStack Query incluem o ID da conta. Logout remove sessão e limpa o cache. Visitantes usam um identificador local para o carrinho; o endpoint de merge combina itens sem duplicar NFTs.

## Tempo real e reconciliação

Com mocks habilitados (desenvolvimento ou build de demonstração), `socket.io-client` conecta ao WebSocket interceptado via `@mswjs/socket.io-binding`. A ponte espera `mocksReady` antes de importar o cliente, evitando corrida com o início do MSW em produção. O cliente autentica com o token e recebe `session.ready`; `nft.updated` e `order.updated` carregam ID estável, recurso e versão. O cliente descarta duplicados/versões antigas e invalida queries REST após evento ou reconexão. A assinatura de pedido é autorizada pelo dono da sessão. Cleanup desconecta o socket e remove listeners ao desmontar a ponte. O evento não escreve diretamente no cache: REST continua sendo a fonte de reconciliação.

O endpoint de demonstração `POST /api/mock/nfts/:id/update` aumenta o preço para exercitar o bloqueio de checkout. Esse endpoint deve ser removido de qualquer backend real.

## Cobertura e limitações

Playwright roda em Chromium desktop (1440 px) e mobile (390 px), com cenários de sessão, coleção, favoritos, carrinho, checkout, pedidos, perfil, preço em tempo real e snapshots visuais. `npm run test:production` reconstrói a demonstração com mocks e executa a mesma suíte contra `vite preview`. A última execução teve 82 testes aprovados e 2 falhas exclusivamente nos snapshots de início/detalhe/carrinho/pagamento, que diferem após a troca das imagens; as imagens de comparação estão em `test-results/` e o relatório HTML em `playwright-report/`. As baselines não foram atualizadas. Uma corrida real no logout foi corrigida removendo a navegação duplicada entre a tela de perfil e o guard de rota; os fluxos de logout e troca de contas passaram nos testes desktop e mobile. Lighthouse mede mobile e desktop três vezes e registra mediana. `vercel.json` escolhe `npm run build:demo`, que ativa os mocks e o Socket.IO de demonstração sem exigir uma variável no dashboard da Vercel.

O pacote KURIO foi recebido como arquivo ZIP e seus frames e enunciado agora estão em `design/` e `DESAFIO.md`. As cores, tipografia monoespaçada e composição da página inicial foram aproximadas dos exports. As 50 obras compartilham quatro imagens fornecidas (originais 1254×1254), com variantes WebP de 320, 640 e 960 px, qualidade 84, `srcset`, `sizes` e dimensões intrínsecas; nomes, preços e demais dados permanecem variados. Detalhe, carrinho, checkout, confirmação, modais de auth, perfil e carteiras ainda precisam de revisão visual contra os frames correspondentes.

Diagnóstico do evento de preço (teste Playwright original, sem alterar passos nem assertivas):

1. O handler MSW aceita a conexão e registra o handshake com token válido.
2. O mock emite `nft.updated` com ID estável, obra e versão incrementada.
3. `socket.io-client` recebe o evento no listener.
4. O listener descarta IDs/versões antigos e invalida as queries `['nfts']`, `['nft', id]` e `['cart', userId]`; REST refaz a leitura e reconcilia o cache.
5. O detalhe mostra o novo preço.
6. O teste chama `POST /api/mock/nfts/:id/update` (handler MSW) e usa a espera automática do Playwright pela UI.

A causa foi dupla: o import estático de `socket.io-client` avaliava o Engine.IO antes de `enableMocks()` instalar o interceptor WebSocket do MSW; e o mock ouvia/enviava pelo wrapper `server` de `@mswjs/socket.io-binding`, embora no par MSW o endpoint duplex que recebe frames do cliente e responde seja `client`. A ponte agora carrega o cliente Socket.IO dinamicamente depois da inicialização do MSW, e o mock usa o endpoint duplex correto. O teste original passou 10 vezes seguidas em desktop e 10 em mobile (20/20).

Os 12 itens da seção 9 têm cobertura E2E: catálogo e histórico, detalhe inexistente, sessão/expiração/troca de usuário, rollback de favorito, quantidade/cupom/persistência do carrinho, compra e recuperação de pedido, perfil/carteiras, preço e disponibilidade via Socket.IO, eventos duplicados/antigos, reconexão, teclado/foco e carregamento lento/erro/retry. Na última execução de produção em Chromium desktop e mobile, 82 testes passaram e somente os 2 snapshots visuais falharam após a troca das imagens; os diffs e traces estão disponíveis em `test-results/`, e o relatório HTML em `playwright-report/`. O MSW persiste só no navegador local e não há integração blockchain, provedor de pagamento, backend ou sincronização entre dispositivos. O deploy na Vercel ainda precisa ser disparado pelo proprietário da conta.

## Lighthouse de produção (2026-10-23)

O baseline da Fase 1 (`reports/lighthouse/phase1/`) e a rodada atual (`reports/lighthouse/final/`) medem a demonstração com mocks servida por `vite preview`, em `/` e `/nft/nft-001`. Cada combinação foi executada três vezes em Chromium novo; a tabela compara medianas da Fase 1 com as medições atuais após a migração para quatro imagens. Configuração 1.0.1. Ambiente: Windows 10 22H2 x64, Node 24.15.0, Vite 7.3.7, Playwright 1.64.1, Lighthouse 13.5.0 e Chromium 156.0.0.0. Os HTML/JSON individuais e resumos estão em `reports/lighthouse/phase1/` e `reports/lighthouse/final/`; a rodada atual foi registrada em 2026-10-23.

| Rota/perfil | Performance base/atual | A11y base/atual | BP base/atual | SEO base/atual | LCP ms base/atual | CLS base/atual | TBT ms base/atual |
|---|---:|---:|---:|---:|---:|---:|---:|
| Início · mobile | 91 / 96 | 100 / 100 | 96 / 96 | 92 / 92 | 3.200 / 2.632 | 0 / 0 | 58 / 57 |
| Início · desktop | 72 / 77 | 100 / 100 | 96 / 96 | 92 / 92 | 3.081 / 2.560 | 0 / 0 | 37 / 46 |
| Detalhe · mobile | 92 / 93 | 100 / 100 | 96 / 96 | 92 / 92 | 3.028 / 3.079 | 0 / 0 | 56 / 39 |
| Detalhe · desktop | 72 / 75 | 100 / 100 | 96 / 96 | 92 / 92 | 3.027 / 2.996 | 0 / 0 | 49 / 41 |

### Diagnóstico e decisões

- **Elemento LCP:** a imagem local do hero (`/nfts/8459204731e6eba9d474cbc8ebc37071360d3ba5-*.webp`) foi o LCP da home em mobile e desktop; a imagem da obra `Jardim suspenso #01` foi o LCP do detalhe nos dois perfis. O audit confirma `fetchpriority=high` e `loading="eager"` nas imagens LCP. A página inicial inclui preload responsivo do hero.
- **Causa residual do LCP:** na rodada atual, a home teve TTFB ~7 ms, atraso da imagem ~10 ms, transferência ~8–9 ms e renderização do elemento ~389–395 ms. No detalhe, TTFB ficou ~7 ms, o atraso de requisição ~324–344 ms, transferência ~22–27 ms e renderização ~119–261 ms. O detalhe busca dados antes de inserir a imagem, contribuindo para o atraso de descoberta. Comparada à rodada final anterior à troca das imagens, a mediana mudou +289 ms na home mobile, -520 ms na home desktop, +75 ms no detalhe mobile e -8 ms no detalhe desktop; os números confirmam que o LCP residual não é explicado pelo tamanho transferido isoladamente.
- **Ajustes de carregamento:** o shell/skeleton monta antes do MSW; as consultas aguardam `mocksReady` para não escapar do interceptor. Iniciar o worker logo no primeiro frame foi medido e revertido: atrasou o LCP mobile da home em ~770 ms. As rotas usam chunks separados; a leitura redundante do carrinho não inicia no detalhe. O build padrão sem `VITE_ENABLE_MOCKS` não emite o chunk `browser` do MSW (verificado com `npm run build`); o build específico de Lighthouse inclui esse worker para medir a experiência funcional com mocks.
- **Imagens:** o HTML pré-carrega o hero com `imagesrcset`; as quatro fontes em `public/nfts/` têm 1254×1254 px. `NftImage` declara `srcset`, `sizes`, `width`/`height`, e fornece variantes WebP 320/640/960, qualidade 84. Imagens abaixo da dobra usam lazy loading; apenas a imagem LCP recebe alta prioridade. Os relatórios atuais confirmam que o navegador seleciona variantes WebP adequadas ao viewport.
- **CLS:** a comparação de caixas do skeleton e conteúdo final do detalhe passa em desktop e mobile com tolerância de 1 px. O CLS final é 0 nas quatro combinações Lighthouse. Isso valida a correção de largura e dos espaçamentos responsivos; relatórios intermediários mais antigos que registraram CLS não-zero foram superados por essa validação.
- **Fontes:** não há arquivos de fonte no pacote fornecido, e o audit não registrou requisições de fonte nem achados de `font-display`. O CSS cai para pilhas de sistema quando DM Sans, Playfair Display ou Roboto Mono não estão instaladas. Não adicionamos uma fonte remota sem asset/licença disponível; o preload/subset de uma fonte real permanece condicionado ao recebimento desse arquivo.
- **Metas:** LCP < 2,5 s não foi atingido na rodada atual: a home mobile ficou em 2.632 ms, home desktop em 2.560 ms e detalhe em 2.996–3.079 ms. Performance desktop (75–77) e SEO (92) permanecem abaixo de 90/100; acessibilidade (100) e boas práticas (96) estão altas. CLS permaneceu 0 nas quatro combinações. Mantivemos imagens, conteúdo e funcionalidades; os próximos ganhos exigem reduzir o atraso de descoberta/renderização da imagem real sem recorrer a placeholders.

O teste de geometria do skeleton usa resposta de detalhe atrasada de forma determinística. O script Lighthouse (`scripts/lighthouse.mjs`) usa configuração 1.0.1 e porta 4181, separada do Playwright em 4180; registra ferramentas e ambiente, além dos relatórios HTML/JSON e medianas. Para reproduzir: `VITE_ENABLE_MOCKS=true npm run build` e `npm run lighthouse`.