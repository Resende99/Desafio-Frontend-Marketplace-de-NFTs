import { expect, test, type Page } from '@playwright/test'

async function fresh(page: Page, path = '/') {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__section9_initialized') !== 'yes') {
      localStorage.clear()
      sessionStorage.clear()
      sessionStorage.setItem('__section9_initialized', 'yes')
    }
  })
  await page.goto(path)
}

async function register(page: Page, returnTo = '/profile') {
  const email = `e2e-${crypto.randomUUID()}@example.test`
  await page.goto(`/register?returnTo=${encodeURIComponent(returnTo)}`)
  await page.getByLabel('Nome completo').fill('Pessoa de Teste')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill('SenhaSegura123')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await page.waitForURL(url => url.pathname === returnTo)
  return email
}

async function addToCart(page: Page, nftId = 'nft-001') {
  await page.goto(`/nft/${nftId}`)
  await expect(page.locator('.detail-copy h1')).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page).toHaveURL(/\/cart$/)
}

async function checkout(page: Page, walletChar = 'a') {
  await page.getByRole('link', { name: /Continuar para pagamento/ }).click()
  await page.getByLabel('Endereço da carteira').fill(`0x${walletChar.repeat(40)}`)
}

async function setScenario(page: Page, scenario: { failNext?: string; failCount?: number; delayMs?: number; failStatus?: number }) {
  await page.evaluate(async value => {
    await fetch('/api/mock/scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) })
  }, scenario)
}

test('seção 9.1 filtros combinados, ordenação, paginação e histórico do navegador', async ({ page }) => {
  await fresh(page)
  await page.getByRole('button', { name: /Próxima/ }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.locator('.nft-card').first()).toContainText('13')
  await page.goBack()
  await expect(page).toHaveURL(/page=1/)
  await page.getByLabel('Buscar obras').fill('Azul')
  await page.getByRole('button', { name: 'Games', exact: true }).click()
  await page.getByLabel('Ordenação').selectOption('price-desc')
  await expect(page).toHaveURL(/q=Azul/)
  await expect(page).toHaveURL(/category=Games/)
  await expect(page).toHaveURL(/sort=price-desc/)
  await expect(page.locator('.nft-card')).toHaveCount(5)
  const firstPrice = await page.locator('.price').first().textContent()
  await page.goBack()
  await expect(page).toHaveURL(/category=Games/)
  await page.goForward()
  await expect(page).toHaveURL(/sort=price-desc/)
  await expect(page.locator('.price').first()).toHaveText(firstPrice!)
})

test('seção 9.2 detalhe inexistente informa indisponibilidade', async ({ page }) => {
  await fresh(page, '/nft/nft-999')
  await expect(page.getByText('Esta obra não está disponível')).toBeVisible()
})

test('seção 9.3 logout e novo cadastro não compartilham a conta anterior', async ({ page }) => {
  await fresh(page)
  const first = await register(page)
  await expect(page.getByRole('heading', { name: 'Seu perfil' })).toBeVisible()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  await page.waitForFunction(() => localStorage.getItem('kurio.session') === null)
  await page.goto('/register')
  await page.getByLabel('Nome completo').fill('Outra Pessoa')
  await page.getByLabel('E-mail').fill(`outra-${crypto.randomUUID()}@example.test`)
  await page.getByLabel('Senha').fill('SenhaSegura456')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Seu perfil' })).toBeVisible()
  await expect(page.locator('input[readonly]')).not.toHaveValue(first)
})

test('contas demo pré-configuradas aceitam login e mantêm perfis independentes', async ({ page }) => {
  await fresh(page)
  for (const account of [
    { email: 'colecionador@kurio.demo', password: 'Colecionador#2026', name: 'Colecionador Demo' },
    { email: 'artista@kurio.demo', password: 'Artista#2026', name: 'Artista Demo' },
  ]) {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(account.email)
    await page.getByLabel('Senha').fill(account.password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(account.name)
    if (account.email !== 'artista@kurio.demo') {
      await page.getByRole('button', { name: 'Sair da conta' }).click()
      await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    }
  }
})

test('cenários de mock permitem simular respostas 4xx e 5xx', async ({ page }) => {
  await fresh(page)
  await expect(page.locator('.nft-card')).toHaveCount(12)
  const statuses = await page.evaluate(async () => {
    const configure = (status: number) => fetch('/api/mock/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ failNext: 'nfts', failStatus: status }),
    })
    await configure(422)
    const clientError = (await fetch('/api/nfts')).status
    await configure(503)
    const serverError = (await fetch('/api/nfts')).status
    return [clientError, serverError]
  })
  expect(statuses).toEqual([422, 503])
})

test('seção 9.4 erro ao salvar favorito restaura o estado anterior', async ({ page }) => {
  await fresh(page, '/nft/nft-004')
  await register(page, '/nft/nft-004')
  await expect(page.getByRole('button', { name: /favoritos/ })).toHaveAttribute('aria-pressed', 'false')
  await setScenario(page, { failNext: 'favorites' })
  await page.getByRole('button', { name: /favoritos/ }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: /favoritos/ })).not.toHaveAttribute('aria-pressed', 'true')
})

test('seção 9.5 remove item, aplica cupom e mantém carrinho após refresh', async ({ page }) => {
  await fresh(page)
  await addToCart(page, 'nft-002')
  await page.getByRole('button', { name: 'Remover Memória líquida #02' }).click()
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  await addToCart(page, 'nft-003')
  await page.getByRole('button', { name: 'Aumentar quantidade Depois da chuva #03' }).click()
  await expect(page.locator('.cart-item output')).toHaveText('2')
  await page.getByLabel('Cupom').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Cupom KURIO10 aplicado')).toBeVisible()
  await page.reload()
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await expect(page.locator('.cart-item output')).toHaveText('2')
  await expect(page.getByText('Cupom KURIO10 aplicado')).toBeVisible()
})

test('seção 9.6 compra confirma recibo e remove apenas os NFTs comprados', async ({ page }) => {
  const messages: string[] = []
  page.on('console', message => messages.push(message.text()))
  await fresh(page)
  await page.locator('.nft-card').first().click()
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await register(page, '/cart')
  await checkout(page, 'b')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Pagamento pendente')).toBeVisible()
  await expect.poll(() => messages.filter(message => message.includes('order.updated received')).length).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Simular confirmação do pagamento' }).click()
  await expect(page.getByText('Compra confirmada')).toBeVisible()
  await expect.poll(() => messages.filter(message => message.includes('order.updated received')).length).toBeGreaterThan(1)
  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})

test('seção 9.7 falha recuperável de pagamento preserva pedido e itens', async ({ page }) => {
  await fresh(page)
  await addToCart(page, 'nft-009')
  await register(page, '/cart')
  await checkout(page, 'c')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Pagamento pendente')).toBeVisible()
  await page.clock.install()
  await setScenario(page, { delayMs: 9_000, failNext: 'settle', failCount: 1 })
  await page.getByRole('button', { name: 'Simular confirmação do pagamento' }).click()
  await page.clock.fastForward(8_100)
  await expect(page.getByRole('alert')).toContainText('A confirmação excedeu o tempo esperado.', { timeout: 10_000 })
  await expect(page.getByText('Pagamento pendente')).toBeVisible()
  await page.clock.fastForward(1_000)
  await setScenario(page, {})
  await page.getByRole('button', { name: 'Simular confirmação do pagamento' }).click()
  await expect(page.getByText('Compra confirmada')).toBeVisible()
})

test('seção 9.7 clique repetido durante criação gera apenas um pedido', async ({ page }) => {
  await fresh(page)
  await addToCart(page, 'nft-009')
  await register(page, '/cart')
  await checkout(page, 'c')
  await setScenario(page, { delayMs: 700 })
  let orderRequests = 0
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/api/orders')) orderRequests += 1 })
  const confirm = page.locator('.summary-card button.checkout-link')
  await confirm.click()
  await expect(confirm).toBeDisabled()
  await confirm.evaluate(button => (button as HTMLButtonElement).click())
  await expect(page.getByText('Pagamento pendente')).toBeVisible()
  expect(orderRequests).toBe(1)
})

test('seção 9.8 perfil aceita avatar válido e mostra erro da senha atual', async ({ page }) => {
  await fresh(page)
  await register(page)
  await page.getByLabel('URL do avatar').fill('https://example.test/avatar.png')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByRole('status')).toHaveText('Perfil atualizado.')
  await page.getByLabel('Senha atual').fill('senha-errada')
  await page.getByLabel('Nova senha').fill('NovaSenha123')
  await page.getByRole('button', { name: 'Atualizar senha' }).click()
  await expect(page.getByRole('alert')).toContainText('A senha atual não confere')
})

test('seção 9.9 evento de preço via Socket.IO recebido durante checkout bloqueia compra', async ({ page }) => {
  const messages: string[] = []
  page.on('console', message => messages.push(message.text()))
  await fresh(page)
  await addToCart(page, 'nft-005')
  await register(page, '/cart')
  await expect.poll(() => messages.some(message => message.includes('[Socket client] session.ready'))).toBe(true)
  await page.evaluate(async () => {
    const token = localStorage.getItem('kurio.session')
    await fetch('/api/mock/nfts/nft-005/update', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  })
  await expect.poll(() => messages.some(message => message.includes('nft.updated received'))).toBe(true)
  await checkout(page, 'd')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert')).toContainText('O preço de uma obra mudou')
})

test('seção 9.9 indisponibilidade via Socket.IO bloqueia checkout', async ({ page }) => {
  const messages: string[] = []
  page.on('console', message => messages.push(message.text()))
  await fresh(page)
  await addToCart(page, 'nft-005')
  await register(page, '/cart')
  await expect.poll(() => messages.some(message => message.includes('[Socket client] session.ready'))).toBe(true)
  await checkout(page, 'd')
  await page.evaluate(async () => {
    await fetch('/api/mock/nfts/nft-005/unavailable', { method: 'POST' })
  })
  await expect.poll(() => messages.some(message => message.includes('nft.updated received'))).toBe(true)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert')).toContainText('Uma obra não está mais disponível')
})

test('seção 9.10 cliente ignora eventos Socket.IO duplicados e antigos', async ({ page }) => {
  const messages: string[] = []
  page.on('console', message => messages.push(message.text()))
  await fresh(page)
  await register(page)
  await expect.poll(() => messages.some(message => message.includes('[Socket client] session.ready'))).toBe(true)
  await page.evaluate(async () => {
    await fetch('/api/mock/socket/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [
        { id: 'e2e:nft-001:v2', resource: { id: 'nft-001', version: 2, nft: { id: 'nft-001' } } },
        { id: 'e2e:nft-001:v2', resource: { id: 'nft-001', version: 2, nft: { id: 'nft-001' } } },
        { id: 'e2e:nft-001:v1-old', resource: { id: 'nft-001', version: 1, nft: { id: 'nft-001' } } },
      ] }),
    })
  })
  await expect.poll(() => messages.some(message => message.includes('duplicate event ignored'))).toBe(true)
  await expect.poll(() => messages.some(message => message.includes('stale version ignored'))).toBe(true)
})

test('seção 9.10 socket retoma conexão após desconexão simulada', async ({ page }) => {
  const connects: string[] = []
  page.on('console', message => { if (message.text().includes('connected; sending authenticated handshake')) connects.push(message.text()) })
  await fresh(page)
  await register(page)
  await expect.poll(() => connects.length).toBeGreaterThan(0)
  await page.evaluate(() => fetch('/api/mock/socket/disconnect', { method: 'POST' }))
  await expect.poll(() => connects.length, { timeout: 10_000 }).toBeGreaterThan(1)
})

test('seção 9.11 formulários permitem teclado e preservam foco', async ({ page }) => {
  await fresh(page, '/login')
  for (let index = 0; index < 12; index += 1) {
    if (await page.getByLabel('E-mail').evaluate(element => element === document.activeElement)) break
    await page.keyboard.press('Tab')
  }
  await expect(page.getByLabel('E-mail')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Senha')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect.poll(() => page.getByLabel('E-mail').evaluate(input => (input as HTMLInputElement).validity.valueMissing)).toBe(true)
})

test('seção 9.11 menu mobile mantém foco no diálogo e devolve ao acionador ao fechar', async ({ page }) => {
  await fresh(page)
  const trigger = page.getByRole('button', { name: 'Abrir menu' })
  test.skip(!(await trigger.isVisible()), 'menu de diálogo só é exibido no layout mobile')
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Menu' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Fechar menu' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('seção 9.12 falha de catálogo oferece nova tentativa', async ({ page }) => {
  await fresh(page)
  await expect(page.locator('.nft-card')).toHaveCount(12)
  await setScenario(page, { failNext: 'nfts', failCount: 2 })
  await page.getByRole('button', { name: 'Games', exact: true }).click()
  await expect(page.getByText('Não foi possível carregar as obras')).toBeVisible()
  await setScenario(page, {})
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.locator('.nft-card')).toHaveCount(10)
})

test('latência controlada mantém skeleton até o catálogo concluir', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.nft-card')).toHaveCount(12)
  await setScenario(page, { delayMs: 700 })
  await page.getByLabel('Buscar obras').fill('Azul')
  await expect(page.locator('.skeleton-card')).toHaveCount(8)
  await expect(page.locator('.nft-card')).toHaveCount(5)
})

test('seção 9.12 skeleton do detalhe preserva a geometria do conteúdo final', async ({ page }) => {
  await fresh(page)
  await expect(page.locator('.nft-card')).toHaveCount(12)
  await setScenario(page, { delayMs: 3000 })
  await page.goto('/nft/nft-001')
  await expect(page.locator('.detail-skeleton')).toBeVisible()
  const skeletonGeometry = await page.locator('.detail-skeleton').evaluate(element => {
    const image = element.querySelector('.detail-skeleton-image')
    const copy = element.querySelector('.detail-skeleton-copy')
    if (!image || !copy) throw new Error('A geometria do skeleton de detalhe está incompleta.')
    return [element, image, copy].map(node => {
      const { x, y, width, height } = node.getBoundingClientRect()
      return { x, y, width, height }
    })
  })
  await expect(page.locator('.detail-layout')).toBeVisible()
  const contentGeometry = await page.locator('.detail-layout').evaluate(element => {
    const image = element.querySelector('.detail-image')
    const copy = element.querySelector('.detail-copy')
    if (!image || !copy) throw new Error('A geometria do detalhe carregado está incompleta.')
    return [element, image, copy].map(node => {
      const { x, y, width, height } = node.getBoundingClientRect()
      return { x, y, width, height }
    })
  })
  for (const [index, skeleton] of skeletonGeometry.entries()) {
    const content = contentGeometry[index]
    expect(Math.abs(skeleton.x - content.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(skeleton.y - content.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(skeleton.width - content.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(skeleton.height - content.height)).toBeLessThanOrEqual(1)
  }
})
