/**
 * Generate all icon assets from public/logo_white.svg using sharp + to-ico.
 * The logo is composited onto a #171717 (Passbolt chinese-black) background.
 * Run: bun scripts/generate-icons.mjs  (or: bun run generate-icons)
 */
import sharp from 'sharp'
import toIco from 'to-ico'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const logoSvg = readFileSync(join(root, 'public', 'logo_white.svg'))

// Ensure app/ directory exists
mkdirSync(join(root, 'app'), { recursive: true })

// Helper: composite logo_white.svg centred on a #171717 background at given size.
// The logo has a 160:30 aspect ratio — scale to fit within (size - padding*2) wide.
async function logoOnDark(size, paddingFraction = 0.15) {
  const padding = Math.round(size * paddingFraction)
  const logoWidth = size - padding * 2
  // height proportional to 160x30 viewBox
  const logoHeight = Math.round(logoWidth * (30 / 160))
  const top = Math.round((size - logoHeight) / 2)

  const resizedLogo = await sharp(logoSvg)
    .resize(logoWidth, logoHeight)
    .png()
    .toBuffer()

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 23, g: 23, b: 23, alpha: 1 }, // #171717
    },
  })
    .composite([{ input: resizedLogo, top, left: padding }])
    .png()
    .toBuffer()
}

// ── app/icon.png (32x32) ─────────────────────────────────────────────────────
// Next.js App Router auto-serves this as /icon.png (shown in browser tab)
const icon32 = await logoOnDark(32)
writeFileSync(join(root, 'app', 'icon.png'), icon32)
console.log('✓ app/icon.png (32x32)')

// ── app/favicon.ico ──────────────────────────────────────────────────────────
// Multi-size ICO: 16, 32, 48 — served at /favicon.ico for legacy browsers
const [ico16, ico32, ico48] = await Promise.all([
  logoOnDark(16),
  logoOnDark(32),
  logoOnDark(48),
])
const icoBuffer = await toIco([ico16, ico32, ico48])
writeFileSync(join(root, 'app', 'favicon.ico'), icoBuffer)
console.log('✓ app/favicon.ico (16, 32, 48)')

// ── app/apple-icon.png (180x180) ─────────────────────────────────────────────
const apple = await logoOnDark(180)
writeFileSync(join(root, 'app', 'apple-icon.png'), apple)
console.log('✓ app/apple-icon.png (180x180)')

// ── PWA icons in public/ ─────────────────────────────────────────────────────
const pwa192 = await logoOnDark(192)
writeFileSync(join(root, 'public', 'icon-192x192.png'), pwa192)
console.log('✓ public/icon-192x192.png')

const pwa512 = await logoOnDark(512, 0.12)
writeFileSync(join(root, 'public', 'icon-512x512.png'), pwa512)
console.log('✓ public/icon-512x512.png')

writeFileSync(join(root, 'public', 'icon-maskable-512x512.png'), pwa512)
console.log('✓ public/icon-maskable-512x512.png')

console.log('\nAll icons generated from logo_white.svg on #171717 background.')
