# KURIO — Marketplace de NFTs

Marketplace demonstrativo construído com React, TypeScript, Vite, TanStack Query e MSW. API, contas, pagamentos, carteira e tempo real são simulados no navegador; não há blockchain, backend persistente nem cobrança real.

## Requisitos e setup

- Node.js 20.19+ ou 22.12+.
- npm (o lockfile é versionado).

```bash
npm ci
npm run dev
```

Abra a URL informada pelo Vite. Os mocks REST e Socket.IO iniciam automaticamente em desenvolvimento. O banco fica no `localStorage` do navegador e é independente por perfil/origem.

### Variáveis de ambiente

Nenhuma variável é necessária para desenvolvimento, build demo ou deploy na Vercel. O `vercel.json` usa `npm run build:demo`, que ativa `VITE_ENABLE_MOCKS=true` durante o build.

`VITE_ENABLE_MOCKS=true` é opcional para quem quiser executar manualmente o build padrão com os mocks habilitados. Sem essa variável, `npm run build` gera a versão sem mocks.

## Contas e dados fictícios

As duas contas são criadas automaticamente no banco local simulado:

| Usuário | E-mail | Senha |
|---|---|---|
| Colecionador Demo | `colecionador@kurio.demo` | `Colecionador#2026` |
| Artista Demo | `artista@kurio.demo` | `Artista#2026` |

O cupom de demonstração é `KURIO10` (10% de desconto). As senhas são fictícias e armazenadas no mock somente como SHA-256; nunca use dados ou senhas reais. Cada navegador mantém seu próprio estado local.

## Cenários de mock e reprodução de falhas

Os exemplos abaixo devem ser executados no Console do DevTools da própria aplicação (local ou publicada). Primeiro, defina este helper:

```js
const kurioScenario = (value = {}) =>
  fetch('/api/mock/scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
```

| Cenário | Como selecionar e reproduzir |
|---|---|
| Lentidão | `await kurioScenario({ delayMs: 700 })`, depois recarregue a home ou detalhe. Todas as rotas que participam dos cenários aguardam esse atraso. |
| Timeout de API | `await kurioScenario({ delayMs: 9000, failNext: 'nfts' })` e recarregue a home. A consulta Axios vence em 8 s. Limpe o cenário antes de tentar novamente. |
| Resposta 4xx / 5xx | `await kurioScenario({ failNext: 'nfts', failStatus: 422 })` (ou `503`) e recarregue a home. A falha é de uso único; `failNext` também aceita `nft-detail`, `favorites`, `quote`, `orders` e `settle`. |
| Sessão expirada | Entre em uma conta, abra `/profile` e execute `localStorage.setItem('kurio.session.expiresAt', '1'); location.reload()`. A sessão será apagada e a rota protegida pedirá login. |
| Cupom inválido | Adicione uma obra ao carrinho, digite `INVALIDO` no campo Cupom e escolha Aplicar. Para o caminho válido, use `KURIO10`. |
| Preço alterado | Em uma sessão autenticada com o detalhe de `nft-005` aberto, execute `fetch('/api/mock/nfts/nft-005/update', { method: 'POST' })`. O preço sobe 0,10 ETH e `nft.updated` é emitido; no carrinho, o checkout pede revisão da cotação. |
| Edição esgotada | Execute `fetch('/api/mock/nfts/nft-005/unavailable', { method: 'POST' })`. A obra fica indisponível no banco local, emite `nft.updated` e não pode ser adicionada/comprada. |
| Pagamento recusado | Adicione uma obra, entre, avance ao pagamento e confirme. No recibo pendente, escolha **Simular pagamento recusado**; o pedido fica recusado e o carrinho é preservado. |
| Timeout após criar pedido | Crie um pedido até ver **Pagamento pendente**. Execute `await kurioScenario({ delayMs: 9000, failNext: 'settle' })` e clique **Simular confirmação do pagamento**. A chamada de liquidação vence o timeout de 8 s; o pedido continua pendente. Limpe o cenário e tente a confirmação novamente. |

Para limpar apenas a simulação de falha sem apagar o restante estado, execute `await kurioScenario({})`.

### Reset para o estado conhecido

No Console do DevTools, na origem do app, execute:

```js
await kurioScenario({})
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Isso remove sessão, pedidos, carrinho, preços/edições simulados e dados de perfil; ao recarregar, as duas contas demo são semeadas novamente. Também é possível limpar os dados do site pelo navegador. O reset afeta somente o navegador atual.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Desenvolvimento com API e Socket.IO simulados |
| `npm run build` | Typecheck e build sem mocks |
| `npm run build:demo` | Typecheck e build de demonstração com mocks |
| `npm run preview` | Servir localmente `dist` |
| `npm run typecheck` | Verificar TypeScript |
| `npm run lint` | Executar ESLint |
| `npm run test` | Suíte Playwright em Chromium desktop e mobile |
| `npm run test:production` | Build demo e suíte contra o preview de produção |
| `npm run test:update` | Atualizar snapshots visuais (somente após revisar as diferenças) |
| `npm run test:report` | Abrir relatório HTML do Playwright |
| `npm run lighthouse` | Três medições Lighthouse por rota e perfil; calcula medianas |

Playwright grava o relatório HTML em `playwright-report/` e resultados/traces de falhas em `test-results/`. Lighthouse grava os relatórios HTML/JSON e resumos em `reports/lighthouse/`. `LIGHTHOUSE_URL` pode apontar a auditoria para um servidor já iniciado; caso contrário, o script inicia o preview local.

## Medianas Lighthouse de produção

Build demo local servido por Vite Preview, três execuções independentes por combinação, medidas em 22/10/2026. Os detalhes de ferramenta, ambiente e relatórios por execução estão em `reports/lighthouse/final/`; baseline e comparação estão em `reports/lighthouse/phase1/`.

| Tela | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Início | Mobile | 97 | 100 | 96 | 92 | 2.343 | 0 | 28 |
| Início | Desktop | 74 | 100 | 96 | 92 | 3.080 | 0 | 41 |
| Detalhe | Mobile | 94 | 100 | 96 | 92 | 3.004 | 0 | 45 |
| Detalhe | Desktop | 74 | 100 | 96 | 92 | 3.004 | 0 | 48 |

LCP abaixo de 2,5 s foi atingido somente na home mobile. No desktop e no detalhe, o diagnóstico atribui o atraso principalmente à renderização/montagem da rota, não à transferência da imagem. A justificativa completa, medições antes/depois e limitações estão em [ARCHITECTURE.md](./ARCHITECTURE.md).

## Publicação

O deploy Vercel deve usar a raiz do repositório, sem variáveis obrigatórias: [vercel.json](./vercel.json) seleciona `npm run build:demo`, `dist` e fallback SPA para rotas diretas/refresh. Para validar o mesmo build localmente, use `npm run test:production`.

## Escopo e limitações

Os frames e requisitos de referência estão em `design/` e [DESAFIO.md](./DESAFIO.md). A camada de demonstração roda no navegador: sessões, carrinhos e pedidos não sincronizam entre dispositivos; não há pagamento real, carteira conectada, blockchain ou API persistente. Os fluxos e decisões técnicas, contratos REST/Socket.IO, limitações e desvios visuais conhecidos estão registrados em [ARCHITECTURE.md](./ARCHITECTURE.md).
