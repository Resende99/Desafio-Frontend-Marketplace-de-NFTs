import type { Nft } from './nft'
export interface User { id: string; name: string; email: string; avatar: string; wallets: Wallet[] }
export interface Wallet { id: string; address: string; network: 'Ethereum' | 'Polygon'; primary: boolean }
export interface CartItem { nftId: string; quantity: number; price: string; nft: Nft; priceVersion: number }
export interface Cart { items: CartItem[]; coupon?: string; discount: string; fee: string; subtotal: string; total: string }
export interface Order { id: string; ownerId: string; status: 'pending'|'confirmed'|'rejected'; items: CartItem[]; total: string; wallet: string; network: string; createdAt: string; version: number; idempotencyKey: string; contentFingerprint:string }
