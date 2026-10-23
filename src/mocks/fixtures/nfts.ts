import type { Creator, Nft, NftCategory } from '../../types/nft'
import Decimal from 'decimal.js'
export const creators: Creator[] = [
  { id: 'u-1', name: 'Lia Costa', avatar: '/nfts/emerald-ape.jpg', verified: true },
  { id: 'u-2', name: 'Rafa Mello', avatar: '/nfts/sage-nomad.jpg', verified: false },
]
const categories: NftCategory[] = ['Arte', 'Colecionáveis', 'Música', 'Fotografia', 'Games']
const titles = ['Jardim suspenso','Memória líquida','Depois da chuva','Corpo celeste','Azul profundo','Entre mundos','Casa vazia','Luz de domingo','Maré alta','Pequeno infinito']
const images = ['emerald-ape','sage-nomad','neon-vessel','cosmic-bloom','violet-nomad','ivory-baron','golden-beat']
export const nfts: Nft[] = Array.from({ length: 50 }, (_, index) => ({
  id: `nft-${String(index + 1).padStart(3, '0')}`, name: `${titles[index % titles.length]} #${String(index + 1).padStart(2, '0')}`,
  description: 'Uma peça digital original que explora cor, forma e memória. Criada com cuidado e disponível como edição única.',
  image: `/nfts/${images[index % images.length]}.jpg`, category: categories[index % categories.length],
  price: new Decimal('0.12').plus(new Decimal((index * 17) % 350).div(100)).toFixed(2), creator: creators[index % creators.length], createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(), likes: 24 + ((index * 37) % 900),
}))
