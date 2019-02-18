const TestRunnerCli = require('test-runner')

class WebRunnerCli extends TestRunnerCli {
  constructor (options) {
    super(options)
    this.optionDefinitions = [
      { name: 'files', type: String, multiple: true, defaultOption: true },
      { name: 'help', type: Boolean, alias: 'h' },
      { name: 'debug', type: Boolean },
      { name: 'show', type: Boolean },
      { name: 'scripts', multiple: true }
    ]
  }

  async printUsage () {
    const commandLineUsage = await this.loadModule('command-line-usage')
    this.errorLog(commandLineUsage([
      {
        header: 'web-runner',
        content: 'Run a TOM in Chromium.'
      },
      {
        header: 'Synopsis',
        content: '$ web-runner <options> {underline file} {underline ...}'
      },
      {
        header: 'Options',
        optionList: this.optionDefinitions
      }
    ]))
  }

  async launch (tomPath, options) {
    const puppeteer = require('puppeteer')
    const Lws = require('lws')
    const path = require('path')
    const lws = new Lws()
    const server = lws.listen({
      port: 8000,
      directory: path.resolve(__dirname),
      stack: 'static'
    })
    const browser = await puppeteer.launch({ headless: !options.show })
    const page = (await browser.pages())[0]
    try {
      page.on('console', msg => console.log(msg.text()))
      await page.goto('http://127.0.0.1:8000/harness/')
      /* load --scripts */
      for (let url of options.scripts || []) {
        if (!isURL(url)) url = path.relative('harness', url)
        await page.addScriptTag({ url })
      }
      tomPath = path.relative('harness', tomPath)
      const state = await page.evaluate(async (tomPath) => {
        const TestRunnerCore = (await import('../node_modules/test-runner-core/index.mjs')).default
        const $ = document.querySelector.bind(document)
        await import(tomPath)

        class DefaultView {
          start (count) {
            console.log(`\nRunning ${count} tests\n`)
          }
          testPass (test, result) {
            const indent = ' '.repeat(test.level())
            const parent = test.parent ? test.parent.name : ''
            console.log(`${indent}\x1b[32m✓\x1b[0m \x1b[35m${parent}\x1b[0m`, test.name, result ? `[${result}]` : '')
          }
          testFail (test, err) {
            const indent = ' '.repeat(test.level())
            const parent = test.parent ? test.parent.name : ''
            console.log(`${indent}\x1b[31m⨯\x1b[0m \x1b[35m${parent}\x1b[0m`, test.name)
            const lines = err.stack.split('\n').map(line => {
              const indent = ' '.repeat(test.level() + 2)
              return indent + line
            })
            console.log(`\n${lines.join('\n')}\n`)
          }
          testSkip (test) {
            const indent = ' '.repeat(test.level())
            console.log(`${indent}\x1b[30m-\x1b[0m ${test.name}}`)
          }
          testIgnore (test) {
            const indent = ' '.repeat(test.level())
          }
          end (stats) {
            console.log(`\nCompleted in: ${stats.timeElapsed()}ms. Pass: ${stats.pass}, fail: ${stats.fail}, skip: ${stats.skip}.\n`)
          }
        }

        const runner = new TestRunnerCore({ tom: window.tom, view: new DefaultView() })
        $('test-runner').setRunner(runner)
        await runner.start()
        return runner.state
      }, tomPath)
      console.log('state', state)
    } finally {
      if (!options.show) {
        await browser.close()
        server.close()
      }
    }
  }

  async processFiles (files, options) {
    /* currently, only running the first file supplied is supported */
    return this.launch(files[0], options)
  }
}

function isURL (url) {
  try {
    new URL(url)
    return true
  } catch (err) {
    return false
  }
}

module.exports = WebRunnerCli
