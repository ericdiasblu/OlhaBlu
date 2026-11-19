import { readFileSync } from 'node:fs'

const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
const packages = lock.packages
const registry = 'https://registry.npmjs.org'
const errors = []

function hasRegistrySource(path, entry) {
  const name = path.split('node_modules/').at(-1)
  const filename = name.split('/').at(-1)
  return entry.resolved === `${registry}/${name}/-/${filename}-${entry.version}.tgz`
    && /^sha512-[A-Za-z0-9+/]{86}==$/.test(entry.integrity ?? '')
    && !entry.link
}

for (const [path, entry] of Object.entries(packages)) {
  if (!path) continue
  if (hasRegistrySource(path, entry)) continue

  if (entry.inBundle && !entry.resolved && !entry.integrity && !entry.link) {
    const parts = path.split('/node_modules/')
    // npm hashes the enclosing tarball for dependencies embedded by its publisher.
    const coveredByParent = parts.slice(0, -1).some((_, index) => {
      const parent = parts.slice(0, index + 1).join('/node_modules/')
      return packages[parent] && hasRegistrySource(parent, packages[parent])
    })
    if (coveredByParent) continue
  }

  errors.push(path)
}

if (errors.length) {
  console.error('Pacotes sem origem oficial do npm ou sem SHA-512:')
  for (const path of errors) console.error(`  ${path}`)
  process.exitCode = 1
} else {
  console.log('Origem e integridade do lockfile npm verificadas.')
}
