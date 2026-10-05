#!/usr/bin/env node
/*
  Pulls your public GitHub repos, scores them, and writes the best ones to src/data/github.json.

    npm run github -- <username>            # top 6
    npm run github -- <username> 8          # top 8
    GITHUB_TOKEN=... npm run github -- you   # optional, avoids the 60 req/hour anonymous limit

  Scoring favours what other people valued (stars, forks), things that are finished enough to
  have a description / homepage / topics, and recent activity. Forks, archived repos and your
  profile README repo are skipped. Re-run any time; edit per-project copy in src/content.ts.
*/
import { writeFile } from 'node:fs/promises'

const [user, countArg] = process.argv.slice(2)
if (!user) {
  console.error('Usage: npm run github -- <github-username> [count]')
  process.exit(1)
}
const COUNT = Number(countArg) || 6
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-importer' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`)
  return res.json()
}

const repos = await gh(`/users/${user}/repos?per_page=100&type=owner&sort=pushed`)
const now = Date.now()
const days = (iso) => (now - new Date(iso).getTime()) / 864e5

const score = (r) =>
  r.stargazers_count * 4 +
  r.forks_count * 3 +
  (r.homepage ? 3 : 0) +
  (r.description ? 2 : 0) +
  Math.min(4, (r.topics ?? []).length) +
  (days(r.pushed_at) < 180 ? 4 : days(r.pushed_at) < 365 ? 2 : 0) +
  Math.min(3, Math.log10(Math.max(1, r.size)))

const candidates = repos
  .filter((r) => !r.fork && !r.archived && r.name.toLowerCase() !== user.toLowerCase())
  .filter((r) => r.description || r.stargazers_count > 0 || r.size > 200)
  .map((r) => ({ r, s: score(r) }))
  .sort((a, b) => b.s - a.s)
  .slice(0, COUNT)

const out = []
for (const { r, s } of candidates) {
  let languages = []
  try {
    const langs = await gh(`/repos/${r.owner.login}/${r.name}/languages`)
    const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1
    languages = Object.entries(langs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, bytes]) => ({ name, share: Math.round((bytes / total) * 100) }))
  } catch {
    /* languages are optional */
  }
  out.push({
    name: r.name,
    owner: r.owner.login,
    description: r.description ?? '',
    url: r.html_url,
    homepage: r.homepage || '',
    stars: r.stargazers_count,
    forks: r.forks_count,
    language: r.language ?? '',
    languages,
    topics: r.topics ?? [],
    created: r.created_at,
    pushed: r.pushed_at,
    score: Math.round(s * 10) / 10,
  })
}

await writeFile(new URL('../src/data/github.json', import.meta.url), JSON.stringify(out, null, 2) + '\n')
console.log(`Saved ${out.length} of ${repos.length} repos for ${user}:`)
for (const p of out) console.log(`  ${String(p.score).padStart(5)}  ${p.name}  (${p.stars}★, ${p.language || 'n/a'})`)
