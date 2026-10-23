import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, BadgeCheck, Heart, Share2 } from 'lucide-react'
import Decimal from 'decimal.js'
import { SiteHeader } from '../components/SiteHeader'
import { NftImage } from '../components/NftImage'
import { DetailSkeleton } from '../components/DetailSkeleton'
import { useNft } from '../hooks/useNfts'
import { useFavorite } from '../hooks/useFavorite'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../state/useAuth'
import { formatEth } from '../lib/utils'

export function NftPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const navigate = useNavigate()
  const { data, isLoading, isError } = useNft(nftId)
  const { user } = useAuth()
  const favorite = useFavorite(nftId)
  const cart = useCart({ enabled: false })
  const addToCart = () => void cart.change({ type: 'add', nftId }).then(async () => {
    await navigate({ to: '/cart', resetScroll: true })
    window.scrollTo(0, 0)
  })

  return <>
    <SiteHeader />
    <main className="detail-page">
      <Link to="/" search={{ q: undefined, category: undefined, sort: 'recent', page: 1 }} className="back-link"><ArrowLeft size={16} /> Voltar para explorar</Link>
      {isLoading ? <DetailSkeleton /> : isError || !data ? <div className="state-panel">
        <h2>Esta obra não está disponível</h2>
        <p>O link pode estar incorreto ou a peça foi removida.</p>
        <Link to="/" search={{ q: undefined, category: undefined, sort: 'recent', page: 1 }} className="text-button">Voltar à coleção</Link>
      </div> : <>
        <div className="detail-layout">
          <div className="detail-image">
            <NftImage src={data.image} alt={data.name} sizes="(max-width: 700px) 92vw, 55vw" loading="eager" priority />
            <span>{data.category}</span>
          </div>
          <div className="detail-copy">
            <span className="eyebrow muted">OBRA DIGITAL · {data.id.toUpperCase()}</span>
            <h1>{data.name}</h1>
            <div className="detail-creator">
              <NftImage src={data.creator.avatar} alt="" sizes="32px"/>
              <div><small>Criado por</small><strong>{data.creator.name} {data.creator.verified && <BadgeCheck size={16} className="verified" />}</strong></div>
            </div>
            <p className="detail-description">{data.description}</p>
            <div className="detail-price">
              <small>Preço atual</small>
              <strong>{formatEth(data.price)}</strong>
              <span>≈ R$ {new Decimal(data.price).mul(18500).toFixed(2).replace('.', ',')}</span>
            </div>
            <button className="connect-button buy-button" onClick={addToCart}>Adicionar ao carrinho</button>
            <div className="detail-actions">
              <button aria-pressed={favorite.favorite} onClick={() => { if (user) favorite.toggle(!favorite.favorite); else window.location.assign(`/login?returnTo=${encodeURIComponent(`/nft/${nftId}`)}`) }}>
                <Heart size={17} fill={favorite.favorite ? 'currentColor' : 'none'} /> {favorite.favorite ? 'Salvo nos favoritos' : `${data.likes} favoritos`}
              </button>
              <button onClick={() => void navigator.clipboard?.writeText(window.location.href)}><Share2 size={17} /> Compartilhar</button>
            </div>
            {favorite.error && <p role="alert" className="form-error">{favorite.error}</p>}
            <div className="detail-meta"><span>Rede</span><strong>Ethereum</strong><span>Padrão</span><strong>ERC-721</strong><span>Token ID</span><strong>{data.id}</strong></div>
          </div>
        </div>
        <div className="mobile-purchase-bar">
          <span><small>Preço atual</small><strong>{formatEth(data.price)}</strong></span>
          <button className="connect-button" onClick={addToCart}>Comprar NFT</button>
        </div>
      </>}
    </main>
  </>
}
