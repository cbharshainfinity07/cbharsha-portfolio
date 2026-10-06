import githubData from './data/github.json'

/*
  Everything you need to personalise lives in this file.
  Projects, experience and links below are PLACEHOLDERS: replace them with your own.
*/

export const profile = {
  name: 'Harsha',
  fullName: 'C B Harshavardhan',
  // Rendered as particles in the hero. Keep it short (one word reads best).
  particleName: 'HARSHA',
  role: 'Software engineer, AI and full-stack',
  // Hero line. Short and specific beats clever. Max ~16 words.
  intro: 'I build interfaces that feel instant and AI tools that feel human.',
  // Shown under the intro, smaller.
  subIntro: 'B.Tech in AI and Data Science. Intern at Antmark, co-founder at Clover.',
  available: true,
  availability: 'Open to SDE and AI internships',
  email: 'harshacb1975@gmail.com',
  resume: '/resume.pdf',
  github: 'https://github.com/cbharshainfinity07',
  // Run `npm run github -- <username>` to pull your best repos into src/data/github.json.
  githubUser: 'cbharshainfinity07',
  linkedin: 'https://www.linkedin.com/in/c-b-harshavardhan-97a2b8375/',
  leetcode: 'https://leetcode.com/u/cbharshainfinity07/',
  codeforces: 'https://codeforces.com/profile/cbharshainfinity07',
  x: 'https://x.com/cbhinfinity0202',
}

export const manifesto =
  'Good software is a long exposure. Nothing shows up at once. You stack a thousand small decisions, the loading state, the empty state, the extra hundred milliseconds, until the picture comes into focus.'

export type Project = {
  slug: string
  title: string
  kind: string
  year: string
  blurb: string
  stack: string[]
  image: string
  // CSS object-position focal point for crops, e.g. 'center top'
  imagePosition?: string
  live?: string
  code?: string
  stars?: number
  forks?: number
  topics?: string[]
  updated?: string
  score?: number
}

const img = (seed: string) => `https://picsum.photos/seed/${seed}/1400/1000`

const placeholderProjects: Project[] = [
  {
    slug: 'stratus',
    title: 'Stratus',
    kind: 'AI writing assistant',
    year: '2026',
    blurb: 'An editor whose AI learns your voice from old drafts, then suggests edits that still sound like you. Every suggestion cites its source.',
    stack: ['Next.js', 'TypeScript', 'LangChain', 'Postgres'],
    stars: 128,
    image: img('stratus-editor-desk'),
    live: '#',
    code: '#',
  },
  {
    slug: 'kite',
    title: 'Kite',
    kind: 'Mobile app',
    year: '2026',
    blurb: 'Split trip expenses with friends, even with no signal. Snap a receipt, and it syncs when you are back online.',
    stack: ['React Native', 'Expo', 'Supabase'],
    stars: 41,
    image: img('kite-travel-mountains'),
    live: '#',
  },
  {
    slug: 'halo',
    title: 'Halo',
    kind: 'Realtime dashboard',
    year: '2025',
    blurb: 'Live air quality for 40 classrooms on one small server. It caught two ventilation failures in its first month.',
    stack: ['React', 'WebSockets', 'Go'],
    stars: 17,
    image: img('halo-sensors-night'),
    code: '#',
  },
  {
    slug: 'nimbus-ui',
    title: 'Nimbus UI',
    kind: 'Component library',
    year: '2025',
    blurb: 'The component kit I kept rebuilding, finally written once. Accessible by default, with motion built in.',
    stack: ['React', 'Radix', 'Tailwind'],
    stars: 64,
    image: img('nimbus-sky-texture'),
    live: '#',
    code: '#',
  },
]

/*
  Per-repo overrides, keyed by GitHub repo name. Anything you set here wins over GitHub data:
    'my-repo': { title: 'Nice Name', kind: 'AI agent', blurb: 'One great sentence.', image: '/work/my-repo.jpg', live: 'https://...' },
*/
export const projectOverrides: Record<string, Partial<Project>> = {
  Getchasma: {
    title: 'GetChasma',
    kind: 'Luxury eyewear commerce',
    blurb:
      'A luxury eyewear store with a 3D try-on studio, a live lens simulator, UPI checkout, and an admin command center that runs orders and returns end to end.',
    stack: ['React 19', 'Tailwind v4', 'Framer Motion', 'Node.js', 'Express 5'],
    image: '/work/getchasma-site.png',
    imagePosition: 'center 45%',
    live: 'https://getchasma.onrender.com/',
    score: 80,
  },
  'Vaani-Voice-Rag': {
    title: 'Vaani',
    kind: 'Multilingual voice AI',
    blurb:
      'Ask out loud in any of 14 Indian languages. Vaani transcribes, searches MSMARCO-XI, and answers with citations, or declines when the evidence is thin.',
    stack: ['Python', 'FastAPI', 'Qdrant', 'Sarvam STT', 'Ollama'],
    image: '/work/vaani.png',
    imagePosition: 'center top',
    score: 100,
  },
  'sentient-os-clone': {
    title: 'Sentient OS',
    kind: '3D product film',
    blurb:
      'A frame-perfect rebuild of sentient-os.ai. A 3D MacBook closes its lid as you scroll, and a live neural network lets you hover to look inside.',
    stack: ['React 19', 'TypeScript', 'Framer Motion', 'Tailwind v4'],
    image: '/work/sentient-hero.jpg',
    imagePosition: 'center 62%',
    live: 'https://sentient-clone.vercel.app',
    score: 90,
  },
  'Clover-agency': {
    title: 'Clover',
    kind: 'Studio website',
    blurb:
      'The site for Clover, the digital studio I co-founded. Hand-written HTML, CSS and JavaScript with no framework, so it loads before you finish blinking.',
    stack: ['HTML', 'CSS', 'Vanilla JS', 'Vercel'],
    image: '/work/clover.png',
    imagePosition: 'left top',
    score: 70,
  },
}

type GithubRepo = {
  name: string
  owner: string
  description: string
  url: string
  homepage: string
  stars: number
  forks: number
  language: string
  languages: { name: string; share: number }[]
  topics: string[]
  created: string
  pushed: string
  score: number
}

const pretty = (s: string) =>
  s
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bJs\b/g, 'JS')
    .replace(/\bUi\b/g, 'UI')
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bApi\b/g, 'API')

function fromGithub(r: GithubRepo): Project {
  const base: Project = {
    slug: r.name,
    title: pretty(r.name),
    kind: r.topics[0] ? pretty(r.topics[0]) : r.language ? `${r.language} project` : 'Project',
    year: r.created.slice(0, 4),
    blurb: r.description || 'Source on GitHub.',
    stack: [...r.languages.filter((l) => l.share > 0).map((l) => l.name), ...r.topics.slice(0, 3).map(pretty)].slice(0, 5),
    // GitHub renders a social preview card for every public repo
    image: `https://opengraph.githubassets.com/1/${r.owner}/${r.name}`,
    live: r.homepage || undefined,
    code: r.url,
    stars: r.stars,
    forks: r.forks,
    topics: r.topics,
    updated: r.pushed,
    score: r.score,
  }
  return { ...base, ...projectOverrides[r.name] }
}

// Real repos when the importer has run, otherwise the placeholders above.
export const projects: Project[] = (githubData as GithubRepo[]).length
  ? (githubData as GithubRepo[]).map(fromGithub)
  : placeholderProjects

export const experience = [
  { role: 'Web & App Developer Intern', org: 'Antmark', when: 'Aug 2026 - now', note: 'iOS and Android apps' },
  { role: 'Co-founder', org: 'Clover, digital studio', when: '2026 - now', note: 'Websites, apps, automations' },
  { role: 'Finalist', org: 'Makers Conclave 2026', when: '2026', note: 'NIAT flagship innovation showcase' },
  { role: 'B.Tech, AI and Data Science', org: 'Sanjay Ghodawat University', when: '2025 - 2029', note: 'CGPA 8.05 / 10' },
]

// Shown on the rotating 3D skill sphere.
export const skills = [
  'C++', 'Python', 'TypeScript', 'JavaScript', 'SQL', 'React', 'React Native', 'Expo',
  'Node.js', 'Express', 'FastAPI', 'MongoDB', 'SQLite', 'LangChain', 'RAG', 'Qdrant',
  'Ollama', 'Embeddings', 'AI Agents', 'Three.js', 'Framer Motion', 'Tailwind', 'AWS', 'Vercel',
]

// Section copy, in one place so the voice stays consistent.
export const copy = {
  hint: 'Move through the name. Click to scatter it.',
  hintTouch: 'Drag through the name. Tap to scatter it.',
  work: { title: 'Exposures.', sub: 'Things I shipped', note: 'Hover to preview. Click to open the full story.' },
  skills: {
    title: 'Instruments.',
    sub: 'What I build with',
    body: 'Drag the sphere to spin it. Below is where I have put these to use.',
  },
  contact: {
    title: 'Some things',
    sub: 'pull you in.',
    body: 'A role, a project, a half-formed idea. Send it over and I will reply within a day.',
    cta: 'Say hello',
  },
  footer: 'Hand-built with React, Three.js and a lot of GLSL.',
}

// Projects in your chosen order (highest score first), shared by the nav dropdown and the command menu.
export const rankedProjects = [...projects].sort((a, b) => (b.score ?? b.stars ?? 0) - (a.score ?? a.stars ?? 0))
