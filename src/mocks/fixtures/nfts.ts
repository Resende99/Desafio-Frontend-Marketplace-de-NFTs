import type { Creator, Nft, NftCategory } from '../../types/nft'
import Decimal from 'decimal.js'
export const creators: Creator[] = [
  { id: 'u-1', name: 'Lia Costa', avatar: '/nfts/8459204731e6eba9d474cbc8ebc37071360d3ba5.png', verified: true },
  { id: 'u-2', name: 'Rafa Mello', avatar: '/nfts/2986a7cb16d09de8970824d2dd58bf0bb021702c.png', verified: false },
]
const categories: NftCategory[] = ['Arte', 'Colecionáveis', 'Música', 'Fotografia', 'Games']
const titles = ['Jardim suspenso','Memória líquida','Depois da chuva','Corpo celeste','Azul profundo','Entre mundos','Casa vazia','Luz de domingo','Maré alta','Pequeno infinito']
const images = [
  '/nfts/8459204731e6eba9d474cbc8ebc37071360d3ba5.png',
  '/nfts/2986a7cb16d09de8970824d2dd58bf0bb021702c.png',
  '/nfts/9df2ff42dd27ba657621c304557d1a855a4be6a5.png',
  '/nfts/2986a7cb16d09de8970824d2dd58bf0bb021702c.png',
  '/nfts/2986a7cb16d09de8970824d2dd58bf0bb021702c.png',
  '/nfts/9df2ff42dd27ba657621c304557d1a855a4be6a5.png',
  '/nfts/87580f2def9af0ce13f4b6f6ce17bb2449bcfc16.png',
]
export const nfts: Nft[] = Array.from({ length: 50 }, (_, index) => ({
  id: `nft-${String(index + 1).padStart(3, '0')}`, name: `${titles[index % titles.length]} #${String(index + 1).padStart(2, '0')}`,
  description: 'Uma peça digital original que explora cor, forma e memória. Criada com cuidado e disponível como edição única.',
  image: images[index % images.length], category: categories[index % categories.length],
  price: new Decimal('0.12').plus(new Decimal((index * 17) % 350).div(100)).toFixed(2), creator: creators[index % creators.length], createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(), likes: 24 + ((index * 37) % 900),
}))
