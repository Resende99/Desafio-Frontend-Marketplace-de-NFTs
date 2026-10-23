type NftImageProps = {
  src: string
  alt: string
  sizes: string
  loading?: 'eager' | 'lazy'
  priority?: boolean
  className?: string
}

export function NftImage({ src, alt, sizes, loading = 'lazy', priority = false, className }: NftImageProps) {
  const webp = src.replace(/\.jpe?g$/i, '.webp')
  return <picture>
    <source type="image/webp" srcSet={`${webp.replace(/\.webp$/, '-180.webp')} 180w, ${webp} 250w`} sizes={sizes}/>
    <img className={className} src={src} srcSet={`${src} 250w`} sizes={sizes} width={250} height={250}
      alt={alt} loading={loading} fetchPriority={priority ? 'high' : 'auto'} decoding={priority ? 'sync' : 'async'}/>
  </picture>
}
