import WebRunnerCli from '@test-runner/web'
import util from 'util'
util.inspect.defaultOptions.depth = 6
util.inspect.defaultOptions.breakLength = process.stdout.columns
util.inspect.defaultOptions.maxArrayLength = Infinity

const cli = new WebRunnerCli()
cli.start().catch(err => {
  console.error(util.inspect(err, { colors: true }))
  process.exitCode = 1
})

process.on('uncaughtException', (err, origin) => {
  cli.errorLog(`\nAn ${origin} was thrown, possibly in a separate tick.\n`)
  cli.errorLog(err)
  process.exit(1)
})
process.on('unhandledRejection', (reason, promise) => {
  cli.errorLog('\nAn unhandledRejection was thrown. Please ensure the rejecting promise is returned from the test function.\n')
  cli.errorLog(reason)
  process.exit(1)
})

const warnings = []
process.on('warning', warning => {
  warnings.push(warning)
})

process.on('exit', () => {
  const ignoreList = ['ExperimentalWarning']
  for (const warning of warnings) {
    if (!ignoreList.includes(warning.name)) {
      console.log(warning)
    }
  }
})
