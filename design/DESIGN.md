# KURIO — referência visual

Fonte: arquivo Figma "Frontend Challenge". Imagens em `design/telas/`, ícones em `design/icones/`, visão geral em `design/figma-completo.png`.

## Tokens (amostrados do PNG; confirme no Figma quando possível)
| Token | Valor | Uso |
|---|---|---|
| background | #140D0A | fundo das páginas |
| surface | #241612 | cards, painéis, barra lateral |
| accent | #D28A4C | links ativos, preços, botões, ícones |
| text | quase branco / bege claro | textos principais |
| text-muted | tom bege/marrom | textos secundários, preço antigo riscado |
| font | monoespaçada (parece Roboto Mono) | todo o site |

## Padrões
- Tema escuro, títulos em CAIXA ALTA.
- Botão principal: fundo laranja, texto escuro, cantos pouco arredondados.
- Imagens dos NFTs com cantos bem arredondados.
- Header: logo KURIO, menu (Início, Mercado, Criadores, Aprenda), busca, carrinho com contador, botão "Entrar".
- Início: hero, barra lateral "Coleções" com contagens, abas (Todos os NFTs, Novos lançamentos, Em alta), ordenação, grade de cards com preço em ETH (alguns com preço antigo riscado), paginação, bloco "NFT em destaque", "Diário do Colecionador", rodapé.

## Mapa das telas
| Arquivo | Tela |
|---|---|
| desktop-01-inicio | Início |
| desktop-02-detalhe-nft | Detalhe do NFT |
| desktop-03-carrinho | Carrinho |
| desktop-04-pagamento | Pagamento |
| desktop-05-confirmacao-pedido | Confirmação (modal) |
| desktop-06-inicio-modal-entrar | Login (modal sobre o Início) |
| desktop-07-inicio-modal-criar-conta | Cadastro (modal sobre o Início) |
| desktop-08-perfil | Perfil do colecionador |
| desktop-09-carteiras | Carteiras |
| mobile-01..06 | Início, Detalhe, Carrinho, Pagamento, Login, Cadastro |

Sem frame mobile: Perfil, Carteiras e Confirmação. Adaptar seguindo o mesmo padrão visual.

## Pendências de asset
- As imagens dos NFTs (macacos) só existem dentro dos PNGs das telas. Exportar do Figma (PNG/WebP) para `public/nfts/` ou recortar das telas.
- Confirmar fonte e tamanhos exatos no Figma (Dev Mode).
