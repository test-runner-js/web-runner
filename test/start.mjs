import TestRunner from 'test-runner'
import WebRunnerCli from '@test-runner/web'
import assert from 'assert'
const a = assert.strict

const tom = new TestRunner.Tom({ maxConcurrency: 1 })

tom.test('single file run: pass', async function () {
  class WebRunnerTest extends WebRunnerCli {
    async getOptions () {
      const commandLineArgs = await this.loadModule('command-line-args')
      return commandLineArgs(this.optionDefinitions, { argv: ['test/fixture/one.mjs'] })
    }
  }
  const cli = new WebRunnerTest()
  const state = await cli.start()
  a.strictEqual(state, 'pass')
})

tom.test('single file run: fail', async function () {
  class WebRunnerTest extends WebRunnerCli {
    async getOptions () {
      const commandLineArgs = await this.loadModule('command-line-args')
      return commandLineArgs(this.optionDefinitions, { argv: ['test/fixture/two.mjs'] })
    }
  }
  const cli = new WebRunnerTest()
  const state = await cli.start()
  a.strictEqual(state, 'fail')
})

tom.test('test --silent')
tom.test('test --oneline')
tom.test('multiple tom input files')

export default tom
