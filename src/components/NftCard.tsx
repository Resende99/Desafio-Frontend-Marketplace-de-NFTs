import { Link } from '@tanstack/react-router'
import { Heart, BadgeCheck } from 'lucide-react'
import { formatEth } from '../lib/utils'
import { NftImage } from './NftImage'
import type { Nft } from '../types/nft'
export function NftCard({ nft }: { nft: Nft }) {
  return <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-card">
    <div className="card-image-wrap">
      <NftImage className="card-image" src={nft.image} alt={nft.name} sizes="(max-width: 700px) 46vw, (max-width: 1100px) 30vw, 24vw"/>
      <span className="category-pill">{nft.category}</span>
      <span className="like-count"><Heart size={14}/> {nft.likes}</span>
    </div>
    <div className="card-copy">
      <div className="card-heading"><h3>{nft.name}</h3><span className="price">{formatEth(nft.price)}</span></div>
      <div className="creator">
        <NftImage src={nft.creator.avatar} alt="" sizes="22px"/>
        <span>{nft.creator.name}</span>
        {nft.creator.verified && <BadgeCheck size={15} className="verified"/>}
      </div>
    </div>
  </Link>
}
