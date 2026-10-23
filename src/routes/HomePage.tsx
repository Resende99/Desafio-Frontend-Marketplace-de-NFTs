import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowDownUp, ArrowRight, Search } from 'lucide-react'
import { NftCard } from '../components/NftCard'
import { NftImage } from '../components/NftImage'
import { HomeHero } from '../components/HomeHero'
import { NftSkeleton } from '../components/Skeleton'
import { SiteHeader } from '../components/SiteHeader'
import { useNfts } from '../hooks/useNfts'
import type { NftSearch } from '../types/nft'

const categories = ['Arte','Colecionáveis','Música','Fotografia','Games']

export function HomePage() {
  const search = useSearch({ from: '/' }) as NftSearch
  const navigate = useNavigate({ from: '/' })
  const [query, setQuery] = useState(search.q ?? '')
  const { data, isLoading, isError, refetch } = useNfts(search)
  const update = (next: Partial<NftSearch>) => navigate({ search: (prev: NftSearch) => ({ ...prev, ...next, page: next.page ?? 1 }) })

  return <><SiteHeader/><main>
    <HomeHero/>
    <section className="collection section-shell" id="explorar"><div className="market-layout"><aside className="collection-sidebar"><h2>Coleções</h2>{categories.map(category=><button key={category} className={`sidebar-category ${(search.category??'')===category?'active':''}`} onClick={()=>update({category:(search.category??'')===category?undefined:category})}>{category}</button>)}<div className="sidebar-network"><h3>Rede</h3><span>Ethereum</span><span>Polygon</span><span>Solana</span></div><div className="sidebar-feature"><span className="eyebrow">NFT EM DESTAQUE</span><NftImage src="/nfts/sage-nomad.jpg" alt="NFT Sage Nomad" sizes="177px"/><strong>Sage Nomad #009</strong><b>1.69 ETH</b></div></aside>
    <div className="market-results"><div className="section-heading"><div><span className="eyebrow muted">COLEÇÃO KURIO</span><h2>Arte digital <em>selecionada</em></h2></div><span className="result-count">{data?.total ?? '—'} NFTs</span></div><div className="toolbar"><label className="search-box"><Search size={18}/><input aria-label="Buscar obras" placeholder="Explorar coleções" value={query} onChange={(e)=>{setQuery(e.target.value);update({q:e.target.value||undefined})}}/><kbd>⌘ K</kbd></label><label className="select-wrap sort-select"><ArrowDownUp size={16}/><span>Ordenar por:</span><select aria-label="Ordenação" value={search.sort??'recent'} onChange={(e)=>update({sort:e.target.value})}><option value="recent">Listados recentemente</option><option value="popular">Mais populares</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></label></div><div className="category-row">{['Todos os NFTs','Novos lançamentos','Em alta'].map((tab,index)=><button key={tab} className={`category-tab ${index===0?'active':''}`} onClick={()=>{if(index===0)update({sort:'recent'});else update({sort:index===1?'recent':'popular'})}}>{tab}</button>)}</div>
      {isError?<div className="state-panel"><h3>Não foi possível carregar as obras</h3><p>Confira sua conexão e tente novamente.</p><button className="text-button" onClick={()=>void refetch()}>Tentar novamente</button></div>:isLoading?<div className="nft-grid">{Array.from({length:8},(_,i)=><NftSkeleton key={i}/>)}</div>:data?.items.length?<div className="nft-grid">{data.items.map((nft,index)=><NftCard key={nft.id} nft={nft} priority={index < 4}/>)}</div>:<div className="state-panel"><h3>Nenhuma obra encontrada</h3><p>Tente outra busca ou escolha uma categoria diferente.</p><button className="text-button" onClick={()=>{setQuery('');void update({q:undefined,category:undefined})}}>Limpar filtros</button></div>}
      {data&&data.pages>1&&<div className="pagination"><button disabled={data.page<=1} onClick={()=>update({page:data.page-1})}>Anterior</button><span>Página {data.page} de {data.pages}</span><button disabled={data.page>=data.pages} onClick={()=>update({page:data.page+1})}>Próxima <ArrowRight size={15}/></button></div>}</div></div></section>
  </main><footer className="site-footer"><span className="brand">KURIO</span><span>Feito para colecionadores, criadores e cultura.</span><span>© 2026 Kurio. Propriedade digital para todos.</span></footer></>
}
