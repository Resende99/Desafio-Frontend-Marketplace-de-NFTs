export const mocksEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true'

export async function enableMocks() {
  if (mocksEnabled) {
    const { worker } = await import('./browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

function waitForFirstContentfulPaint() {
  if (typeof window === 'undefined') return Promise.resolve()
  return new Promise<void>((resolve) => {
    let settled = false
    let observer: PerformanceObserver | undefined

    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      observer?.disconnect()
      resolve()
    }

    const timeout = window.setTimeout(finish, 1500)

    if (PerformanceObserver.supportedEntryTypes?.includes('paint')) {
      observer = new PerformanceObserver((list) => {
        if (list.getEntries().some((entry) => entry.name === 'first-contentful-paint')) finish()
      })
      observer.observe({ type: 'paint', buffered: true })
      return
    }

    requestAnimationFrame(() => requestAnimationFrame(finish))
  })
}

// Keep mock startup off the main thread until the shell or route skeleton paints.
export const mocksReady = mocksEnabled
  ? (import.meta.env.PROD ? waitForFirstContentfulPaint() : new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))).then(enableMocks)
  : Promise.resolve()
