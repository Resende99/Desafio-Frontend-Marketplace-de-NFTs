import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const dir = process.argv[2] ?? 'reports/lighthouse'
const files = (await readdir(dir)).filter(file => file.endsWith('.json') && file !== 'summary.json')
const groups = {}
let environment = {}
for (const file of files) {
  const lhr = JSON.parse(await readFile(path.join(dir, file), 'utf8'))
  environment = {
    node: process.version,
    lighthouse: lhr.lighthouseVersion,
    chromium: lhr.userAgent?.match(/HeadlessChrome\/([\d.]+)/)?.[1] ?? 'unknown',
  }
  const key = file.replace(/-\d\.json$/, '')
  const audit = id => lhr.audits[id]
  const numeric = id => audit(id)?.numericValue
  const categories = Object.fromEntries(Object.entries(lhr.categories).map(([name, category]) => [name, Math.round((category.score ?? 0) * 100)]))
  const cls = numeric('cumulative-layout-shift')
  const sample = {
    run: Number(file.match(/-(\d)\.json$/)?.[1]),
    categories,
    metrics: { lcpMs: Math.round(numeric('largest-contentful-paint')), cls: Number.isFinite(cls) ? Math.round(cls * 1000) / 1000 : null, tbtMs: Math.round(numeric('total-blocking-time')) },
    causes: {
      lcpElement: audit('lcp-discovery-insight')?.details?.items?.find(item => item.type === 'node')?.snippet ?? null,
      lcpDiscovery: audit('lcp-discovery-insight')?.displayValue ?? null,
      renderBlocking: audit('render-blocking-resources')?.details?.items?.slice(0, 8) ?? [],
      imageDelivery: audit('image-delivery-insight')?.details?.items?.slice(0, 8) ?? [],
      unusedJavaScript: audit('unused-javascript')?.details?.items?.slice(0, 8) ?? [],
      bootup: audit('bootup-time')?.details?.items?.slice(0, 8) ?? [],
      fontDisplay: audit('font-display')?.details?.items?.slice(0, 8) ?? [],
    },
  }
  ;(groups[key] ??= []).push(sample)
}
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const measurements = Object.fromEntries(Object.entries(groups).map(([key, runs]) => [key, {
  runs,
  median: {
    categories: Object.fromEntries(Object.keys(runs[0].categories).map(name => [name, median(runs.map(run => run.categories[name]))])),
    metrics: Object.fromEntries(Object.keys(runs[0].metrics).map(name => [name, median(runs.map(run => run.metrics[name]))])),
  },
}]))
const summary = { measuredAt: new Date().toISOString(), environment: { ...environment, runs: 3 }, measurements }
await writeFile(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2))
const rows = Object.entries(measurements).map(([key, value]) => `| ${key} | ${value.median.categories.performance} | ${value.median.categories.accessibility} | ${value.median.categories['best-practices']} | ${value.median.categories.seo} | ${value.median.metrics.lcpMs} | ${value.median.metrics.cls} | ${value.median.metrics.tbtMs} |`)
await writeFile(path.join(dir, 'summary.md'), ['# Lighthouse — medianas', '', `Medição: ${summary.measuredAt}`, `Ambiente: Node ${environment.node}, Lighthouse ${environment.lighthouse}, Chromium ${environment.chromium}.`, '', '| Perfil/página | Perf. | A11y | BP | SEO | LCP ms | CLS | TBT ms |', '|---|---:|---:|---:|---:|---:|---:|---:|', ...rows, ''].join('\n'))
