import type { ErrorComponentProps } from '@tanstack/react-router'

export function AppError({ reset }: ErrorComponentProps) {
  const retry = () => {
    reset()
    window.location.reload()
  }
  const resetDemo = () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.assign('/')
  }

  return (
    <main className="detail-page">
      <section className="state-panel" role="alert">
        <span className="eyebrow muted">KURIO · DEMONSTRAÇÃO</span>
        <h1>Não foi possível carregar esta tela</h1>
        <p>Os dados podem estar temporariamente indisponíveis ou desatualizados.</p>
        <button className="connect-button" onClick={retry}>Tentar novamente</button>
        <button className="text-button" onClick={resetDemo}>Resetar demonstração</button>
      </section>
    </main>
  )
}
