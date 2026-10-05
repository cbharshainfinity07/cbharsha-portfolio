#!/usr/bin/env node
/*
  Captures README screenshots of the live site with your installed Edge/Chrome (no browser download).
    npm run shots                      # uses https://cbharsha.vercel.app
    npm run shots -- http://localhost:5173
  Writes JPEGs to docs/.
*/
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const url = process.argv[2] || 'https://cbharsha.vercel.app'
const candidates = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
]
const executablePath = candidates.find((p) => existsSync(p))
if (!executablePath) throw new Error('No Edge/Chrome found')

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
})
const page = await browser.newPage()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
await wait(5000) // particle intro + text choreography

const scrollTo = async (selector, offset = 0) => {
  await page.evaluate(
    (sel, off) => {
      const el = sel ? document.querySelector(sel) : null
      const y = el ? el.getBoundingClientRect().top + window.scrollY + off : off
      window.scrollTo(0, y)
    },
    selector,
    offset,
  )
  await wait(3500) // let the camera / galaxy settle
}

const shot = async (name) => {
  await page.screenshot({ path: `docs/${name}.jpg`, type: 'jpeg', quality: 88 })
  console.log('saved docs/' + name + '.jpg')
}

await page.mouse.move(1180, 760)
await shot('hero')

await scrollTo('#about', 1050)
await shot('galaxy')

await scrollTo('#work', 60)
const row = await page.$('#work .row button')
if (row) {
  const b = await row.boundingBox()
  await page.mouse.move(b.x + 200, b.y + b.height / 2, { steps: 12 })
  await wait(1600)
}
await shot('work')

await scrollTo('#skills', 40)
await shot('skills')

await scrollTo('#contact', -20)
await wait(2000)
await shot('contact')

await browser.close()
