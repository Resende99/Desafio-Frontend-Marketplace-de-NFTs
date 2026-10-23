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

Em desenvolvimento, `socket.io-client` conecta ao WebSocket interceptado via `@mswjs/socket.io-binding`. O cliente autentica com o token e recebe `session.ready`; `nft.updated` e `order.updated` carregam ID estável, recurso e versão. O cliente descarta duplicados/versões antigas e invalida queries REST após evento ou reconexão. A assinatura de pedido é autorizada pelo dono da sessão. Cleanup desconecta o socket e remove listeners ao desmontar a ponte. O evento não escreve diretamente no cache: REST continua sendo a fonte de reconciliação.

O endpoint de demonstração `POST /api/mock/nfts/:id/update` aumenta o preço para exercitar o bloqueio de checkout. Esse endpoint deve ser removido de qualquer backend real.

## Cobertura e limitações

Playwright roda em Chromium desktop (1440 px) e mobile (390 px), com cenários de sessão, coleção, favoritos, carrinho, checkout, pedidos, perfil, preço em tempo real e snapshots visuais. Lighthouse mede mobile e desktop três vezes e registra mediana. A configuração de servidor SPA da Vercel fica em `vercel.json`.

O pacote KURIO foi recebido como arquivo ZIP e seus frames e enunciado agora estão em `design/` e `DESAFIO.md`. As cores, tipografia monoespaçada e composição da página inicial foram aproximadas dos exports. Como o ZIP não inclui os assets originais de NFT, sete imagens foram recortadas do frame desktop de início e salvas em `public/nfts/`. Detalhe, carrinho, checkout, confirmação, modais de auth, perfil e carteiras ainda precisam de revisão visual contra os frames correspondentes.

Diagnóstico do evento de preço (teste Playwright original, sem alterar passos nem assertivas):

1. O handler MSW aceita a conexão e registra o handshake com token válido.
2. O mock emite `nft.updated` com ID estável, obra e versão incrementada.
3. `socket.io-client` recebe o evento no listener.
4. O listener descarta IDs/versões antigos e invalida as queries `['nfts']`, `['nft', id]` e `['cart', userId]`; REST refaz a leitura e reconcilia o cache.
5. O detalhe mostra o novo preço.
6. O teste chama `POST /api/mock/nfts/:id/update` (handler MSW) e usa a espera automática do Playwright pela UI.

A causa foi dupla: o import estático de `socket.io-client` avaliava o Engine.IO antes de `enableMocks()` instalar o interceptor WebSocket do MSW; e o mock ouvia/enviava pelo wrapper `server` de `@mswjs/socket.io-binding`, embora no par MSW o endpoint duplex que recebe frames do cliente e responde seja `client`. A ponte agora carrega o cliente Socket.IO dinamicamente depois da inicialização do MSW, e o mock usa o endpoint duplex correto. O teste original passou 10 vezes seguidas em desktop e 10 em mobile (20/20).

Os 12 itens da seção 9 têm cobertura E2E: catálogo e histórico, detalhe inexistente, sessão/expiração/troca de usuário, rollback de favorito, quantidade/cupom/persistência do carrinho, compra e recuperação de pedido, perfil/carteiras, preço e disponibilidade via Socket.IO, eventos duplicados/antigos, reconexão, teclado/foco e carregamento lento/erro/retry. A suíte final executou 74 casos em Chromium desktop e mobile: 73 passaram e 1 foi ignorado intencionalmente no projeto desktop porque o diálogo de menu só existe no layout mobile; o correspondente mobile passou. O relatório HTML está em `playwright-report/`. Não houve falhas na execução final, portanto ela não produziu traces de falha. O MSW persiste só no navegador local e não há integração blockchain, provedor de pagamento, backend ou sincronização entre dispositivos; deploy público e documentação de reset/cenários também faltam.

## Lighthouse de produção (2026-10-22)

O baseline da Fase 1 (`reports/lighthouse/phase1/`) e a rodada final (`reports/lighthouse/final/`) medem o build otimizado com `VITE_ENABLE_MOCKS=true`, servido por `vite preview`, em `/` e `/nft/nft-001`. Cada combinação de rota e perfil foi executada três vezes em Chromium novo; a tabela mostra medianas. A configuração versionada é `1.0.1`. Ambiente final: Windows 10 22H2 x64, Node 24.15.0, Vite 7.3.7, Playwright 1.64.1, Lighthouse 13.5.0 e Chromium 156.0.0.0. Os HTML/JSON individuais e os resumos completos estão em `reports/lighthouse/phase1/` e `reports/lighthouse/final/`.

| Rota/perfil | Performance antes/depois | A11y antes/depois | BP antes/depois | SEO antes/depois | LCP ms antes/depois | CLS antes/depois | TBT ms antes/depois |
|---|---:|---:|---:|---:|---:|---:|---:|
| Início · mobile | 91 / 97 | 100 / 100 | 96 / 96 | 92 / 92 | 3.200 / 2.343 | 0 / 0 | 58 / 28 |
| Início · desktop | 72 / 74 | 100 / 100 | 96 / 96 | 92 / 92 | 3.081 / 3.080 | 0 / 0 | 37 / 41 |
| Detalhe · mobile | 92 / 94 | 100 / 100 | 96 / 96 | 92 / 92 | 3.028 / 3.004 | 0 / 0 | 56 / 45 |
| Detalhe · desktop | 72 / 74 | 100 / 100 | 96 / 96 | 92 / 92 | 3.027 / 3.004 | 0 / 0 | 49 / 48 |

### Diagnóstico e decisões

- **Elemento LCP:** imagem do hero local na home mobile; primeiro card de NFT na home desktop; imagem da obra no detalhe em ambos os perfis. O preload e o audit Lighthouse confirmam `fetchpriority=high`, descoberta no documento inicial e carregamento eager (sem `loading=lazy`). O detalhe ainda só insere a imagem final após a resposta REST, embora o arquivo correspondente esteja pré-carregado.
- **Causa residual do LCP:** na rodada final, TTFB ficou em aproximadamente 6–8 ms, o atraso de requisição em 4–9 ms e o download da imagem em 7–11 ms; o `elementRenderDelay` ficou entre ~403 e 539 ms. O worker MSW e o código da rota participam do bootstrap; o primeiro card desktop e o detalhe dependem dos dados da rota antes de inserir o elemento final. Isso aponta para renderização/montagem, não para servidor ou transferência. A mediana melhorou 857 ms na home mobile e 23–24 ms no detalhe; a home desktop praticamente não mudou.
- **Ajustes de carregamento:** o shell/skeleton monta antes do MSW; as consultas aguardam `mocksReady` para não escapar do interceptor. Iniciar o worker logo no primeiro frame foi medido e revertido: atrasou o LCP mobile da home em ~770 ms. As rotas usam chunks separados; a leitura redundante do carrinho não inicia no detalhe. O build padrão sem `VITE_ENABLE_MOCKS` não emite o chunk `browser` do MSW (verificado com `npm run build`); o build específico de Lighthouse inclui esse worker para medir a experiência funcional com mocks.
- **Imagens:** o HTML pré-carrega `emerald-ape.webp`; `NftImage` declara dimensões, `srcset`/`sizes`, WebP com fallback JPEG e prioridade adequada. Imagens prioritárias usam `decoding="sync"`; as medições comparativas registraram TBT final de 28–48 ms e notas Performance melhores, sem regressão material no LCP. Os assets originais extraídos dos frames têm 250×250 px e não há fontes de resolução maior no material recebido; não foram ampliados artificialmente. Na medição desktop de detalhe, a imagem de 250 px ocupa cerca de 665×650 px, limitação de nitidez que só pode ser corrigida com um original maior. A entrega não usa lazy loading na imagem LCP.
- **CLS:** a comparação de caixas do skeleton e conteúdo final do detalhe passa em desktop e mobile com tolerância de 1 px. O CLS final é 0 nas quatro combinações Lighthouse. Isso valida a correção de largura e dos espaçamentos responsivos; relatórios intermediários mais antigos que registraram CLS não-zero foram superados por essa validação.
- **Fontes:** não há arquivos de fonte no pacote fornecido, e o audit não registrou requisições de fonte nem achados de `font-display`. O CSS cai para pilhas de sistema quando DM Sans, Playfair Display ou Roboto Mono não estão instaladas. Não adicionamos uma fonte remota sem asset/licença disponível; o preload/subset de uma fonte real permanece condicionado ao recebimento desse arquivo.
- **Metas:** LCP < 2,5 s foi atingido na home mobile (2.343 ms), mas não na home desktop nem no detalhe (~3,0–3,1 s). Performance desktop ainda fica abaixo de 90 (74); mobile fica em 97 na home e 94 no detalhe. A11y (100), Best Practices (96) e SEO (92) atingem as metas. Mantivemos recursos e mocks; não substituímos as obras por placeholders para mascarar o atraso. Para atingir LCP também no desktop/detalhe, falta reduzir o tempo de renderização da rota/imagem real sem enfraquecer a fidelidade ou as funcionalidades.

O teste de geometria do skeleton usa resposta de detalhe atrasada de forma determinística. O script Lighthouse (`scripts/lighthouse.mjs`) usa configuração 1.0.1 e porta 4181, separada do Playwright em 4180; registra ferramentas e ambiente, além dos relatórios HTML/JSON e medianas. Para reproduzir: `VITE_ENABLE_MOCKS=true npm run build` e `npm run lighthouse`.