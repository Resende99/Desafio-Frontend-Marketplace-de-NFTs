import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Trash2 } from 'lucide-react'
import Decimal from 'decimal.js'
import { SiteHeader } from '../components/SiteHeader'
import { useCart } from '../hooks/useCart'
import { formatEth } from '../lib/utils'
import { api } from '../lib/api'

export function CartPage() {
  const { cart, change, isLoading } = useCart()
  const [coupon, setCoupon] = useState('')
  const [error, setError] = useState('')

  return <>
    <SiteHeader />
    <main className="section-shell cart-page">
      <span className="eyebrow muted">SUA SELEÇÃO</span>
      <h1 className="page-title">Carrinho</h1>
      {isLoading ? <div className="state-panel">Carregando carrinho…</div> : !cart?.items.length ? <div className="state-panel">
        <h2>Seu carrinho está vazio</h2>
        <p>Descubra uma obra que combine com você.</p>
        <Link to="/" search={{ q: undefined, category: undefined, sort: 'recent', page: 1 }} className="text-button">Explorar coleção</Link>
      </div> : <div className="cart-layout">
        <div className="cart-items">
          <div className="cart-table-header" aria-hidden="true">
            <span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span><span />
          </div>
          {cart.items.map(item => <article className="cart-item" key={item.nftId}>
            <img src={item.nft.image} alt={item.nft.name} />
            <div className="cart-item-info">
              <Link to="/nft/$nftId" params={{ nftId: item.nftId }}>{item.nft.name}</Link>
              <span>{item.nft.creator.name}</span>
              <small>Token ID: {item.nftId}</small>
            </div>
            <span className="cart-item-price">{formatEth(item.price)}</span>
            <div className="quantity-control">
              <button aria-label={`Diminuir quantidade ${item.nft.name}`} disabled={item.quantity <= 1} onClick={() => void change({ type: 'quantity', nftId: item.nftId, quantity: item.quantity - 1 })}>−</button>
              <output aria-label={`Quantidade ${item.nft.name}`}>{item.quantity}</output>
              <button aria-label={`Aumentar quantidade ${item.nft.name}`} onClick={() => void change({ type: 'quantity', nftId: item.nftId, quantity: item.quantity + 1 })}>+</button>
            </div>
            <strong className="cart-item-total">{formatEth(new Decimal(item.price).mul(item.quantity).toFixed(2))}</strong>
            <button aria-label={`Remover ${item.nft.name}`} className="remove-button" onClick={() => void change({ type: 'remove', nftId: item.nftId })}><Trash2 size={17} /></button>
          </article>)}
          <button className="text-button" onClick={async () => {
            try {
              await api.post(`/mock/nfts/${cart.items[0].nftId}/update`)
              setError('Preço de demonstração alterado. O checkout será bloqueado até revisar o carrinho.')
            } catch {
              setError('Não foi possível alterar o preço.')
            }
          }}>Simular alteração de preço</button>
        </div>
        <aside className="summary-card">
          <h2>Resumo do pedido</h2>
          <div className="summary-line"><span>Subtotal</span><strong>{formatEth(cart.subtotal)}</strong></div>
          <div className="coupon-row">
            <input aria-label="Cupom" placeholder="Código do cupom" value={coupon} onChange={event => setCoupon(event.target.value)} />
            <button onClick={() => void change({ type: 'coupon', code: coupon }).then(() => setError('')).catch(error => setError(error.response?.data?.message ?? 'Cupom inválido.'))}>Aplicar</button>
          </div>
          {cart.coupon && <p className="coupon-success">Cupom {cart.coupon} aplicado</p>}
          {error && <p className="form-error">{error}</p>}
          <div className="summary-line"><span>Desconto</span><strong>− {formatEth(cart.discount)}</strong></div>
          <div className="summary-line"><span>Taxa de serviço</span><strong>{formatEth(cart.fee)}</strong></div>
          <div className="summary-line total"><span>Total</span><strong>{formatEth(cart.total)}</strong></div>
          <Link to="/checkout" className="connect-button checkout-link">Continuar para pagamento <ArrowRight size={16} /></Link>
          <small className="summary-note">A cotação será revisada antes da confirmação.</small>
        </aside>
      </div>}
    </main>
  </>
}
