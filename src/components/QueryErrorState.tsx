export function QueryErrorState({ onRetry, message = 'Não foi possível carregar os dados agora.' }: { onRetry: () => void; message?: string }) {
  return (
    <section className="state-panel" role="alert">
      <h2>Não foi possível carregar</h2>
      <p>{message}</p>
      <button className="text-button" onClick={onRetry}>Tentar novamente</button>
    </section>
  )
}
