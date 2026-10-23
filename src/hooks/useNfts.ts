import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Nft, NftSearch } from '../types/nft'
interface NftList { items: Nft[]; total: number; page: number; pages: number }
export function useNfts(search: NftSearch) { return useQuery({ queryKey: ['nfts', search], queryFn: async () => (await api.get<NftList>('/nfts', { params: search })).data }) }
export function useNft(id: string) { return useQuery({ queryKey: ['nft', id], queryFn: async () => (await api.get<Nft>(`/nfts/${id}`)).data }) }
