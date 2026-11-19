import { tidyData } from './store'

const dataDir = process.argv[2] ?? 'public/data'
tidyData(dataDir)
  .then((runs) => console.log(`Indexed ${runs.length} runs in ${dataDir}, screenshots kept for the latest`))
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
