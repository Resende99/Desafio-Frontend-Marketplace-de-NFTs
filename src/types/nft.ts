export type NftCategory = 'Arte' | 'Colecionáveis' | 'Música' | 'Fotografia' | 'Games'
export interface Creator { id: string; name: string; avatar: string; verified: boolean }
export interface Nft { id: string; name: string; description: string; image: string; category: NftCategory; price: string; creator: Creator; createdAt: string; likes: number; available?: boolean }
export interface NftSearch { q?: string; category?: string; sort?: string; page?: number }
