# Forma — Marketplace de NFTs

Marketplace demonstrativo construído com React, TypeScript, Vite e MSW. Os dados e operações de API são simulados no navegador; não há conexão com blockchain nem backend persistente.

## Rodar localmente

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

O MSW é iniciado automaticamente em desenvolvimento. O banco de demonstração fica no `localStorage` do navegador. Para recomeçar, limpe os dados do site.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Vite com API e WebSocket mockados |
| `npm run build` | Typecheck e build de produção |
| `npm run build:demo` | Build de produção com os mocks necessários para a demonstração |
| `npm run preview` | Servir o build localmente |
| `npm run typecheck` | Verificar TypeScript |
| `npm run lint` | Executar ESLint |
| `npm run test` | Playwright em Chromium desktop e mobile |
| `npm run test:production` | Build de demonstração e suíte Playwright contra o preview de produção |
| `npm run test:update` | Atualizar snapshots visuais aprovados |
| `npm run test:report` | Abrir relatório HTML do Playwright |
| `npm run lighthouse` | Três medições Lighthouse mobile/desktop e mediana |

Playwright guarda relatório e traces em `playwright-report/` e `test-results/`. Lighthouse grava HTML por medição e resumo em `reports/lighthouse/`. Para apontar Lighthouse a um servidor já iniciado, defina `LIGHTHOUSE_URL`.

Última mediana Lighthouse (6 medições, 21/10/2026):

| Dispositivo | Performance | Acessibilidade | Boas práticas | SEO |
|---|---:|---:|---:|---:|
| Mobile | 51 | 100 | 96 | 92 |
| Desktop | 47 | 100 | 96 | 92 |

## Fluxos implementados

- Coleção com busca, categorias, ordenação e paginação refletidas na URL; detalhe de obra.
- Cadastro, login/logout, sessão recuperada após refresh e expiração simulada em 30 minutos; rotas protegidas preservam o retorno.
- Favoritos otimistas; carrinho de visitante mesclado ao entrar, cupom `FORMA10`, valores calculados com Decimal.js.
- Checkout com cotação/versionamento, carteira e rede, chave idempotente, conflito de conteúdo, estados pendente/confirmado/recusado e recibo com snapshot.
- Perfil, avatar, senha e carteiras; 404 e acesso direto às rotas.
- Socket.IO de desenvolvimento ligado ao MSW, com eventos de obra e pedido e reconciliação por invalidação REST.

## Deploy

O `vercel.json` define `npm run build:demo` e diretório de saída `dist`, além de encaminhar as rotas da SPA para `index.html`. Esse build ativa o MSW e os fluxos demonstrativos no próprio comando; não depende de variável de ambiente configurada no painel. Para validar localmente o build publicado, execute `npm run test:production`.

## Limitações e referências

O pacote de referência recebido foi incluído em `DESAFIO.md` e `design/`. A paleta e os principais elementos da tela inicial foram alinhados ao export do Figma; as obras usadas no catálogo foram recortadas dos frames fornecidos, pois o pacote não inclui os assets originais em separado. Consulte [ARCHITECTURE.md](ARCHITECTURE.md) para medições, cobertura e limitações visuais conhecidas. Auth, pagamentos, carteira, API e persistência são demonstrações simuladas no navegador: não há backend persistente, blockchain, pagamento real nem sincronização entre dispositivos. O deploy público deve ser feito na conta Vercel do proprietário do projeto.
