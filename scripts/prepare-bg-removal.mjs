// Legt Freistell-Modell und ONNX-Runtime unter public/bg-removal/ ab, damit die App
// beides selbst ausliefert (offline nutzbar, kein fremder CDN nötig).
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'bg-removal')
const dataDir = join(root, 'node_modules', '@imgly', 'background-removal-data', 'dist')
const ortDir = join(root, 'node_modules', 'onnxruntime-web', 'dist')

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const resources = {}

// "small" ist die quantisierte ISNet-Variante (~44 MB), schnell genug fürs Handy.
const model = JSON.parse(readFileSync(join(dataDir, 'resources.json'), 'utf8'))['/models/small']
for (const chunk of model.chunks) copyFileSync(join(dataDir, chunk.hash), join(out, chunk.hash))
resources['/models/isnet_quint8'] = {
  ...model,
  chunks: model.chunks.map((c) => ({ name: c.hash, offsets: c.offsets })),
}

const runtime = [
  ['/onnxruntime-web/ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.wasm', 'application/wasm'],
  ['/onnxruntime-web/ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.mjs', 'text/javascript'],
]
for (const [key, file, mime] of runtime) {
  const src = join(ortDir, file)
  if (!existsSync(src)) throw new Error(`${file} fehlt in onnxruntime-web`)
  copyFileSync(src, join(out, file))
  const size = statSync(src).size
  resources[key] = { chunks: [{ name: file, offsets: [0, size] }], size, mime }
}

writeFileSync(join(out, 'resources.json'), JSON.stringify(resources))
console.log(`Freistell-Modell nach ${out} kopiert`)
