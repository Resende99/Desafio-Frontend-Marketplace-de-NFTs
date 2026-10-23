import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { QueryErrorState } from '../components/QueryErrorState'
import { SiteHeader } from '../components/SiteHeader'
import { useProtected } from '../hooks/useProtected'
import { useCart } from '../hooks/useCart'
import type { Order, Wallet } from '../types/domain'
import { formatEth } from '../lib/utils'

export function CheckoutPage() {
  const auth = useProtected()
  const navigate = useNavigate()
  const cartQuery = useCart()
  const { cart } = cartQuery
  const [address, setAddress] = useState('')
  const [network, setNetwork] = useState<'Ethereum' | 'Polygon'>('Ethereum')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const wallets = useQuery({
    queryKey: ['wallets', auth.user?.id],
    queryFn: async () => (await api.get<Wallet[]>('/wallets')).data,
    enabled: !!auth.user,
  })

  if (!auth.ready || !auth.user) return <SiteHeader />
  if (cartQuery.isError) return <><SiteHeader /><main className="detail-page"><QueryErrorState onRetry={() => void cartQuery.refetch()} /></main></>
  if (wallets.isError) return <><SiteHeader /><main className="detail-page"><QueryErrorState onRetry={() => void wallets.refetch()} /></main></>
  if (cartQuery.isLoading) return <><SiteHeader /><main className="detail-page"><div className="state-panel">Carregando carrinho…</div></main></>
  if (!cart || !Array.isArray(cart.items)) return <><SiteHeader /><main className="detail-page"><QueryErrorState onRetry={() => void cartQuery.refetch()} /></main></>

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const quote = (await api.get<{ versions: Record<string, number>; availability: Record<string, boolean>; expiresAt: number }>('/quote')).data
      if (quote.expiresAt < Date.now()) throw new Error('A cotação expirou. Atualize e tente novamente.')
      if (cart.items.some(item => quote.availability[item.nftId] === false)) throw new Error('Uma obra não está mais disponível. Remova-a do carrinho para continuar.')
      if (cart.items.some(item => quote.versions[item.nftId] !== item.priceVersion)) throw new Error('O preço de uma obra mudou. Volte ao carrinho para revisar os valores.')
      const key = sessionStorage.getItem('kurio.order.key') ?? crypto.randomUUID()
      sessionStorage.setItem('kurio.order.key', key)
      const contentFingerprint = JSON.stringify({
        items: cart.items.map(item => [item.nftId, item.price, item.quantity]),
        coupon: cart.coupon,
        total: cart.total,
        wallet: address,
        network,
        versions: quote.versions,
      })
      const order = (await api.post<Order>('/orders', { wallet: address, network, versions: quote.versions, contentFingerprint }, {
        headers: { 'Idempotency-Key': key },
      })).data
      localStorage.setItem('kurio.pendingOrder', order.id)
      await navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    } catch (cause) {
      setError((cause as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ?? (cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return <><SiteHeader /><main className="detail-page">
    <span className="eyebrow muted">ETAPA 2 DE 2</span>
    <h1 className="page-title">Pagamento</h1>
    {cart.items.length === 0 ? <div className="state-panel"><h2>Carrinho vazio</h2><a href="/">Voltar à coleção</a></div> : <div className="checkout-layout">
      <section className="checkout-panel">
        <h2>Carteira e rede</h2>
        <p>Escolha a carteira que receberá suas obras.</p>
        <div className="network-options">{(['Ethereum', 'Polygon'] as const).map(value => <button key={value} className={network === value ? 'selected' : ''} onClick={() => setNetwork(value)}>{value}</button>)}</div>
        {Array.isArray(wallets.data) && wallets.data.map(wallet => <label key={wallet.id} className="wallet-option">
          <input type="radio" name="wallet" checked={address === wallet.address} onChange={() => setAddress(wallet.address)} />
          <span><strong>{wallet.address.slice(0, 8)}…{wallet.address.slice(-5)}</strong><small>{wallet.network}{wallet.primary ? ' · Principal' : ''}</small></span>
        </label>)}
        <label className="field-label">Endereço da carteira<input placeholder="0x…" value={address} onChange={event => setAddress(event.target.value)} /></label>
        <p className="muted small-copy">Gerencie sua carteira no <a href="/profile">perfil</a>.</p>
      </section>
      <aside className="summary-card">
        <h2>Revisão</h2>
        {cart.items.map(item => <div className="summary-line" key={item.nftId}><span>{item.nft.name}</span><strong>{formatEth(item.price)}</strong></div>)}
        <div className="summary-line"><span>Taxas incluídas</span><strong>{formatEth(cart.fee)}</strong></div>
        <div className="summary-line total"><span>Total</span><strong>{formatEth(cart.total)}</strong></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="connect-button checkout-link" disabled={busy || !address} onClick={() => void submit()}>{busy ? 'Revalidando cotação…' : 'Confirmar compra'}</button>
        <p className="summary-note">A confirmação pode levar alguns instantes. O carrinho só será atualizado após confirmação.</p>
      </aside>
    </div>}
  </main></>
}
