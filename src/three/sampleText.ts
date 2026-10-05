// Rasterise text to a canvas and sample N points from its filled pixels (centered, world units).
export function sampleText(text: string, count: number, worldWidth = 56) {
  const W = 1400
  const H = 360
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 300
  ctx.font = `800 ${size}px "Bricolage Grotesque Variable", sans-serif`
  while (ctx.measureText(text).width > W * 0.92 && size > 40) {
    size -= 10
    ctx.font = `800 ${size}px "Bricolage Grotesque Variable", sans-serif`
  }
  ctx.fillText(text, W / 2, H / 2)
  const data = ctx.getImageData(0, 0, W, H).data
  const filled: number[] = []
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) filled.push(x, y)
  const out = new Float32Array(count * 3)
  const scale = worldWidth / W
  const n = filled.length / 2
  for (let i = 0; i < count; i++) {
    const k = Math.floor(Math.random() * n) * 2
    out[i * 3] = (filled[k] - W / 2 + Math.random() * 2) * scale
    out[i * 3 + 1] = -(filled[k + 1] - H / 2 + Math.random() * 2) * scale
    out[i * 3 + 2] = (Math.random() - 0.5) * 1.6
  }
  return out
}
