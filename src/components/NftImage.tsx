type NftImageProps = {
  src: string
  alt: string
  sizes: string
  loading?: 'eager' | 'lazy'
  priority?: boolean
  className?: string
}

export function NftImage({ src, alt, sizes, loading = 'lazy', priority = false, className }: NftImageProps) {
  const webpBase = src.replace(/\.(?:jpe?g|png)$/i, '')
  const webpSrcSet = [320, 640, 960].map(width => `${webpBase}-${width}.webp ${width}w`).join(', ')
  return <picture>
    <source type="image/webp" srcSet={webpSrcSet} sizes={sizes}/>
    <img className={className} src={src} srcSet={`${src} 1254w`} sizes={sizes} width={1254} height={1254}
      alt={alt} loading={loading} fetchPriority={priority ? 'high' : 'auto'} decoding={priority ? 'sync' : 'async'}/>
  </picture>
}
