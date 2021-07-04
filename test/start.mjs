import TestRunner from 'test-runner'
import WebRunnerCli from '@test-runner/web'
import assert from 'assert'
const a = assert.strict

const tom = new TestRunner.Tom({ maxConcurrency: 1 })

tom.test('single file run: pass', async function () {
  const origExitCode = process.exitCode
  class WebRunnerTest extends WebRunnerCli {
    async getOptions () {
      const commandLineArgs = await this.loadModule('command-line-args')
      return commandLineArgs(this.optionDefinitions, { argv: ['test/fixture/one.mjs'] })
    }
  }
  const cli = new WebRunnerTest()
  const state = await cli.start()
  a.equal(state, 'pass')
  a.equal(process.exitCode || 0, 0)
  process.exitCode = origExitCode
})

tom.test('single file run: fail', async function () {
  const origExitCode = process.exitCode
  class WebRunnerTest extends WebRunnerCli {
    async getOptions () {
      const commandLineArgs = await this.loadModule('command-line-args')
      return commandLineArgs(this.optionDefinitions, { argv: ['test/fixture/two.mjs'] })
    }
  }
  const cli = new WebRunnerTest()
  const state = await cli.start()
  a.equal(state, 'fail')
  a.equal(process.exitCode || 0, 1)
  process.exitCode = origExitCode
})

tom.todo('test --silent')
tom.todo('test --oneline')
tom.todo('multiple tom input files')

export default tom
