export function DetailSkeleton() {
  return <div className="detail-skeleton">
    <div className="shimmer detail-skeleton-image" aria-hidden="true"/>
    <div className="detail-skeleton-copy" aria-hidden="true">
      <div className="shimmer skeleton-line"/>
      <div className="shimmer skeleton-line short"/>
      <div className="shimmer skeleton-line"/>
      <div className="shimmer skeleton-line short"/>
      <div className="shimmer skeleton-line"/>
    </div>
  </div>
}
