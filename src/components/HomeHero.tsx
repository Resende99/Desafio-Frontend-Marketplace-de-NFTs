import { ArrowRight, Sparkles } from 'lucide-react'
import { NftImage } from './NftImage'

export function HomeHero() {
  return <section className="hero"><div className="hero-inner"><div className="hero-copy"><span className="eyebrow"><Sparkles size={14}/> BEM-VINDO À KURIO</span><h1>SEJA DONO DO FUTURO<br/>DA ARTE DIGITAL</h1><p>Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.</p><a className="hero-cta" href="#explorar">EXPLORAR <ArrowRight size={17}/></a></div><div className="hero-art"><NftImage src="/nfts/emerald-ape.jpg" alt="NFT de macaco com jaqueta verde" sizes="(max-width: 700px) 94vw, 40vw" loading="eager" priority/><div className="hero-dots" aria-hidden="true"><i/><i/><i/></div></div></div></section>
}
