import { Link } from '@tanstack/react-router'
import { NftSkeleton } from './Skeleton'
import { SiteHeader } from './SiteHeader'
import { HomeHero } from './HomeHero'
import { DetailSkeleton } from './DetailSkeleton'

export function RoutePending() {
  const path = window.location.pathname
  if (path === '/') return <><SiteHeader/><main><HomeHero/><section className="collection section-shell"><div className="nft-grid">{Array.from({ length: 8 }, (_, index) => <NftSkeleton key={index}/>)}</div></section></main></>
  if (path.startsWith('/nft/')) return <><SiteHeader/><main className="detail-page"><Link to="/" search={{ q: undefined, category: undefined, sort: 'recent', page: 1 }} className="back-link">← Voltar para explorar</Link><DetailSkeleton/></main></>
  return <><SiteHeader/><main className="detail-page"><div className="shimmer skeleton-line"/><div className="shimmer skeleton-line short"/></main></>
}
