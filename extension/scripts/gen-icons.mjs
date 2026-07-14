// Generates the extension's toolbar icons (coral pin) as PNGs — no deps, uses
// Node's built-in zlib. Chrome requires raster icons for the toolbar/action.
// Run: node scripts/gen-icons.mjs   (outputs public/icon{16,32,48,128}.png)
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const CORAL = [227, 64, 31]   // #e3401f  (oklch 0.610 0.205 33)
const WHITE = [255, 254, 254] // #fffefe

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) { raw[y * (stride + 1)] = 0; for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = rgba[y * stride + x] }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

function render(size) {
  const ss = 4, S = size * ss
  const buf = new Float64Array(S * S * 4)
  const pad = S * 0.05, rad = S * 0.18
  const cx = S / 2, headCy = S * 0.41, headR = S * 0.205, dotR = S * 0.078, tipY = S * 0.74
  const inRoundRect = (x, y) => {
    const min = pad, max = S - pad, r = rad
    if (x < min || y < min || x > max || y > max) return false
    const dx = x < min + r ? min + r - x : x > max - r ? x - (max - r) : 0
    const dy = y < min + r ? min + r - y : y > max - r ? y - (max - r) : 0
    return dx * dx + dy * dy <= r * r
  }
  const inPin = (x, y) => {
    const dx = x - cx, dy = y - headCy
    if (dx * dx + dy * dy <= headR * headR) return true
    if (y >= headCy && y <= tipY) { const t = (y - headCy) / (tipY - headCy); return Math.abs(x - cx) <= headR * 0.92 * (1 - t) }
    return false
  }
  const inDot = (x, y) => { const dx = x - cx, dy = y - headCy; return dx * dx + dy * dy <= dotR * dotR }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let col = null
    if (inRoundRect(x + 0.5, y + 0.5)) col = inPin(x + 0.5, y + 0.5) && !inDot(x + 0.5, y + 0.5) ? WHITE : CORAL
    const i = (y * S + x) * 4
    if (col) { buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; buf[i + 3] = 255 }
  }
  // box downsample with un-premultiply so edges antialias cleanly
  const out = new Uint8ClampedArray(size * size * 4), n = ss * ss
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0
    for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
      const i = ((y * ss + sy) * S + (x * ss + sx)) * 4
      r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3]
    }
    const alpha = a / n, o = (y * size + x) * 4
    const cov = alpha / 255
    out[o] = cov > 0 ? (r / n) / cov : 0
    out[o + 1] = cov > 0 ? (g / n) / cov : 0
    out[o + 2] = cov > 0 ? (b / n) / cov : 0
    out[o + 3] = alpha
  }
  return Buffer.from(out.buffer)
}

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(dir, { recursive: true })
for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(dir, `icon${size}.png`), encodePNG(size, render(size)))
  console.log(`wrote public/icon${size}.png`)
}
