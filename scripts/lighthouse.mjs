import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'
import { chromium } from 'playwright'

const port = Number(process.env.LIGHTHOUSE_PORT ?? 4181)
const baseUrl = process.env.LIGHTHOUSE_URL ?? `http://127.0.0.1:${port}`
const reportDir = process.env.LIGHTHOUSE_REPORT_DIR ?? 'reports/lighthouse'
const vitePackage = JSON.parse(await readFile(new URL('../node_modules/vite/package.json', import.meta.url), 'utf8'))
const playwrightPackage = JSON.parse(await readFile(new URL('../node_modules/playwright/package.json', import.meta.url), 'utf8'))
const configuration = {
  version: '1.0.1',
  buildCommand: 'VITE_ENABLE_MOCKS=true npm run build',
  server: 'vite preview',
  routes: ['/','/nft/nft-001'],
  profiles: [
    { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 1 },
    { name: 'desktop', width: 1440, height: 960, deviceScaleFactor: 1 },
  ],
  categories: ['performance', 'accessibility', 'best-practices', 'seo'],
  runsPerCombination: Number(process.env.LIGHTHOUSE_RUNS ?? 3),
}
const routes = [
  { name: 'home', path: '/' },
  { name: 'detail', path: '/nft/nft-001' },
]
const devices = [
  { name: 'mobile', formFactor: 'mobile', screen: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false } },
  { name: 'desktop', formFactor: 'desktop', screen: { mobile: false, width: 1440, height: 960, deviceScaleFactor: 1, disabled: false } },
]
const runs = Number(process.env.LIGHTHOUSE_RUNS ?? 3)
await mkdir(reportDir, { recursive: true })
let server
try {
  await fetch(baseUrl)
} catch {
  const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
  server = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { await fetch(baseUrl); break } catch { await delay(1000) }
  }
}

const measurements = {}
let measuredLighthouseVersion
let measuredChromiumVersion
try {
  for (const route of routes) {
    for (const device of devices) {
      const samples = []
      for (let run = 1; run <= runs; run += 1) {
        const chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'] })
        try {
          const result = await lighthouse(`${baseUrl}${route.path}`, {
            port: chrome.port,
            output: ['html', 'json'],
            logLevel: 'error',
            formFactor: device.formFactor,
            screenEmulation: device.screen,
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          })
          const [html, json] = result.report
          const lhr = JSON.parse(json)
          measuredLighthouseVersion ??= lhr.lighthouseVersion
          measuredChromiumVersion ??= lhr.userAgent?.match(/HeadlessChrome\/([\d.]+)/)?.[1] ?? 'unknown'
          const label = `${device.name}-${route.name}-${run}`
          await writeFile(`${reportDir}/${label}.html`, html)
          await writeFile(`${reportDir}/${label}.json`, json)
          const audit = name => lhr.audits[name]
          const metric = (id, divisor = 1) => {
            const value = audit(id)?.numericValue
            return Number.isFinite(value) ? Math.round(value / divisor) : null
          }
          const lcpInsightItems = audit('lcp-discovery-insight')?.details?.items ?? []
          const lcpNode = lcpInsightItems.find(item => item.type === 'node')
          const lcpChecklist = lcpInsightItems.find(item => item.type === 'checklist')?.items
          const legacyLcpElement = audit('largest-contentful-paint-element')?.details?.items?.[0]
          const causes = {
            lcpElement: lcpNode
              ? { snippet: lcpNode.snippet, selector: lcpNode.selector, url: lcpNode.url }
              : legacyLcpElement
                ? { snippet: legacyLcpElement.node?.snippet, selector: legacyLcpElement.node?.selector, url: legacyLcpElement.url }
                : null,
            lcpDiscovery: lcpChecklist
              ? Object.fromEntries(Object.entries(lcpChecklist).map(([key, check]) => [key, check.value]))
              : audit('lcp-discovery-insight')?.displayValue ?? null,
            lcpBreakdown: audit('lcp-breakdown-insight')?.details?.items?.find(item => item.type === 'table')?.items?.map(item => ({ subpart: item.subpart, durationMs: item.duration })) ?? [],
            renderBlocking: audit('render-blocking-resources')?.details?.items?.slice(0, 8).map(item => ({ url: item.url, wastedMs: item.wastedMs })) ?? [],
            imageDelivery: audit('image-delivery-insight')?.details?.items?.slice(0, 8).map(item => ({ url: item.url, wastedBytes: item.wastedBytes })) ?? [],
            unusedJavaScript: audit('unused-javascript')?.details?.items?.slice(0, 8).map(item => ({ url: item.url, wastedBytes: item.wastedBytes })) ?? [],
            bootup: audit('bootup-time')?.details?.items?.slice(0, 8).map(item => ({ url: item.url, totalMs: item.total, scriptingMs: item.scripting })) ?? [],
            fontDisplay: audit('font-display')?.details?.items?.slice(0, 8).map(item => ({ url: item.url, wastedMs: item.wastedMs })) ?? [],
          }
          const categories = Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, Math.round((value.score ?? 0) * 100)]))
          const clsValue = audit('cumulative-layout-shift')?.numericValue
          const sample = {
            run,
            categories,
            metrics: { lcpMs: metric('largest-contentful-paint'), cls: Number.isFinite(clsValue) ? Math.round(clsValue * 1000) / 1000 : null, tbtMs: metric('total-blocking-time') },
            causes,
          }
          samples.push(sample)
          process.stdout.write(`${device.name} ${route.name} ${run}/${runs} ${JSON.stringify({ ...categories, ...sample.metrics })}\n`)
        } finally {
          await chrome.kill()
        }
      }
      const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
      const categoryNames = Object.keys(samples[0]?.categories ?? {})
      measurements[`${device.name}-${route.name}`] = {
        url: `${baseUrl}${route.path}`,
        runs: samples,
        median: {
          categories: Object.fromEntries(categoryNames.map(key => [key, median(samples.map(sample => sample.categories[key]))])),
          metrics: Object.fromEntries(Object.keys(samples[0]?.metrics ?? {}).map(key => [key, median(samples.map(sample => sample.metrics[key]))])),
        },
      }
    }
  }
  const summary = {
    measuredAt: new Date().toISOString(),
    configuration,
    environment: { node: process.version, os: `${os.type()} ${os.release()} ${os.arch()}`, vite: vitePackage.version, playwright: playwrightPackage.version, lighthouse: measuredLighthouseVersion, chromium: measuredChromiumVersion, runs, baseUrl },
    measurements,
  }
  await writeFile(`${reportDir}/summary.json`, JSON.stringify(summary, null, 2))
  const rows = Object.entries(measurements).map(([key, value]) => `| ${key} | ${value.median.categories.performance} | ${value.median.categories.accessibility} | ${value.median.categories['best-practices']} | ${value.median.categories.seo} | ${value.median.metrics.lcpMs} | ${value.median.metrics.cls} | ${value.median.metrics.tbtMs} |`)
  await writeFile(`${reportDir}/summary.md`, ['# Lighthouse — medianas', '', `Medição: ${summary.measuredAt}`, `Ambiente: ${summary.environment.os}, Node ${summary.environment.node}, Vite ${summary.environment.vite}, Playwright ${summary.environment.playwright}, Lighthouse ${summary.environment.lighthouse}, Chromium ${summary.environment.chromium}.`, `Execuções por página/perfil: ${runs}.`, '', '| Perfil/página | Perf. | A11y | BP | SEO | LCP ms | CLS | TBT ms |', '|---|---:|---:|---:|---:|---:|---:|---:|', ...rows, ''].join('\n'))
} finally {
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = new Promise(resolve => server.once('exit', resolve))
    server.kill()
    await exited
  }
}
