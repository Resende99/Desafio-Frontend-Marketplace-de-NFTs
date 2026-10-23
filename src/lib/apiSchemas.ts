import { z } from 'zod'

const creatorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  avatar: z.string().min(1),
  verified: z.boolean(),
})

export const nftSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  image: z.string().min(1),
  category: z.enum(['Arte', 'Colecionáveis', 'Música', 'Fotografia', 'Games']),
  price: z.string(),
  creator: creatorSchema,
  createdAt: z.string(),
  likes: z.number().int().nonnegative(),
  available: z.boolean().optional(),
  version: z.number().int().positive().optional(),
})

const cartItemSchema = z.object({
  nftId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  price: z.string(),
  nft: nftSchema,
  priceVersion: z.number().int().positive(),
})

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  coupon: z.string().optional(),
  discount: z.string(),
  fee: z.string(),
  subtotal: z.string(),
  total: z.string(),
})

const walletSchema = z.object({
  id: z.string().min(1),
  address: z.string().min(1),
  network: z.enum(['Ethereum', 'Polygon']),
  primary: z.boolean(),
})

export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  avatar: z.string().min(1),
  wallets: z.array(walletSchema),
})

export const orderSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  status: z.enum(['pending', 'confirmed', 'rejected']),
  items: z.array(cartItemSchema).min(1),
  total: z.string(),
  wallet: z.string().min(1),
  network: z.string().min(1),
  createdAt: z.string(),
  version: z.number().int().positive(),
  idempotencyKey: z.string().min(1),
  contentFingerprint: z.string(),
})

const nftListSchema = z.object({
  items: z.array(nftSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pages: z.number().int().positive(),
})

const quoteSchema = z.object({
  cart: cartSchema,
  versions: z.record(z.string(), z.number().int().positive()),
  availability: z.record(z.string(), z.boolean()),
  network: z.string().min(1),
  expiresAt: z.number().positive(),
})

const emptyResultSchema = z.object({ ok: z.boolean() })
const tokenSchema = z.object({ token: z.string().min(1) })
const registerSchema = tokenSchema.extend({ user: userSchema })
const favoritesSchema = z.array(z.string())
const favoriteResultSchema = z.object({ favorite: z.boolean() })
const walletsSchema = z.array(walletSchema)
const nftUnavailableSchema = z.object({ id: z.string().min(1), available: z.boolean(), version: z.number().int().positive() })
const eventResultSchema = z.object({ emitted: z.number().int().nonnegative() })
const disconnectedSchema = z.object({ disconnected: z.boolean() })

export function responseSchema(method: string, path: string) {
  if (method === 'GET' && path === '/nfts') return nftListSchema
  if (method === 'GET' && /^\/nfts\/[^/]+$/.test(path)) return nftSchema
  if (method === 'GET' && path === '/auth/me') return userSchema
  if (method === 'POST' && path === '/auth/login') return tokenSchema
  if (method === 'POST' && path === '/auth/register') return registerSchema
  if (method === 'PATCH' && path === '/profile') return userSchema
  if (method === 'GET' && path === '/cart') return cartSchema
  if (['POST', 'DELETE', 'PATCH'].includes(method) && /^\/cart\/(?:items(?:\/[^/]+)?|merge|coupon)$/.test(path)) return cartSchema
  if (method === 'GET' && path === '/favorites') return favoritesSchema
  if (method === 'PUT' && /^\/favorites\/[^/]+$/.test(path)) return favoriteResultSchema
  if (method === 'GET' && path === '/quote') return quoteSchema
  if (['GET', 'PUT'].includes(method) && path === '/wallets') return walletsSchema
  if (method === 'PATCH' && /^\/wallets\/[^/]+\/primary$/.test(path)) return walletsSchema
  if (method === 'POST' && path === '/orders') return orderSchema
  if (['GET', 'POST'].includes(method) && /^\/orders\/[^/]+(?:\/(?:settle|reject))?$/.test(path)) return orderSchema
  if (method === 'POST' && path === '/mock/scenario') return emptyResultSchema
  if (method === 'POST' && path === '/mock/socket/events') return eventResultSchema
  if (method === 'POST' && path === '/mock/socket/disconnect') return disconnectedSchema
  if (method === 'POST' && /^\/mock\/nfts\/[^/]+\/update$/.test(path)) return nftSchema
  if (method === 'POST' && /^\/mock\/nfts\/[^/]+\/unavailable$/.test(path)) return nftUnavailableSchema
  return undefined
}
