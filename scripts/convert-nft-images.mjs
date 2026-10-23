import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const directory = path.resolve('public/nfts')
const files = (await readdir(directory)).filter(file => file.endsWith('.jpg'))
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  for (const file of files) {
    const source = (await readFile(path.join(directory, file))).toString('base64')
    const webp = await page.evaluate(async base64 => {
      const image = new Image()
      image.src = `data:image/jpeg;base64,${base64}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d').drawImage(image, 0, 0)
      return canvas.toDataURL('image/webp', 0.82).split(',')[1]
    }, source)
    const output = Buffer.from(webp, 'base64')
    await writeFile(path.join(directory, file.replace(/\.jpg$/, '.webp')), output)
    const small = await page.evaluate(async base64 => {
      const image = new Image()
      image.src = `data:image/jpeg;base64,${base64}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = 180
      canvas.height = 180
      canvas.getContext('2d').drawImage(image, 0, 0, 180, 180)
      return canvas.toDataURL('image/webp', 0.8).split(',')[1]
    }, source)
    const smallOutput = Buffer.from(small, 'base64')
    await writeFile(path.join(directory, file.replace(/\.jpg$/, '-180.webp')), smallOutput)
    process.stdout.write(`${file}: ${(await readFile(path.join(directory, file))).length} -> ${output.length} bytes WebP; 180px -> ${smallOutput.length} bytes\n`)
  }
} finally {
  await browser.close()
}
