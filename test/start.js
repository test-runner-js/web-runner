const Tom = require('test-runner').Tom
const WebRunnerCli = require('../')
const a = require('assert').strict

const tom = module.exports = new Tom()

tom.test('single file run: pass', async function () {
  class WebRunnerTest extends WebRunnerCli {
    async getOptions () {
      const commandLineArgs = await this.loadModule('command-line-args')
      return commandLineArgs(this.optionDefinitions, { argv: ['test/fixture/one.mjs', '--silent'] })
    }
  }
  const cli = new WebRunnerTest()
  const state = await cli.start()
  a.strictEqual(state, 'pass')
})

tom.test('test --silent')
tom.test('test --oneline')
tom.test('multiple tom input files')
