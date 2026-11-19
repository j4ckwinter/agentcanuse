import { rebuildIndex } from './store'

const dataDir = process.argv[2] ?? 'public/data'
rebuildIndex(dataDir)
  .then((runs) => console.log(`Indexed ${runs.length} runs in ${dataDir}`))
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
