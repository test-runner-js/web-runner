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

  async expandGlobs (files) {
    /* disable glob expansion */
    return files
  }

  async launch (tomPath, options) {
    const puppeteer = require('puppeteer')
    const Lws = require('lws')
    const path = require('path')
    const fs = require('fs')
    const lws = new Lws()
    const server = lws.listen({
      port: 8000,
      stack: 'static'
    })
    const browser = await puppeteer.launch({ headless: !options.show })
    const page = (await browser.pages())[0]
    page.on('console', async msg => {
      console.log(msg.text())
      // const handle = msg.args()[0]
      // console.log(handle._remoteObject)
    })
    page.on('pageerror', err => {
      console.error(require('util').inspect(err, { depth: 6, colors: true }))
    })

    /* what this start URL be? */
    page.goto('http://localhost:8000/node_modules/@test-runner/web/harness/index.html')
    await page.waitForNavigation()

    try {
      await page.addScriptTag({
        content: fs.readFileSync(require.resolve('@test-runner/el/dist/index.mjs'), 'utf8'),
        type: 'module'
      })
      await page.addStyleTag({
        content: fs.readFileSync(require.resolve('@test-runner/el/test-runner.css'), 'utf8')
      })
      await page.addScriptTag({
        content: fs.readFileSync(require.resolve('test-runner-core/dist/index.js'), 'utf8')
      })

      // /* load --scripts */
      // for (let url of options.scripts || []) {
      //   if (!isURL(url)) url = path.relative('harness', url)
      //   await page.addScriptTag({ url })
      // }

      /* load user's TOM */
      await page.addScriptTag({ url: path.resolve('/', tomPath), type: 'module' })
      await page.waitForFunction('window.tom', {
        timeout: 3000
      })

      const state = await page.evaluate(async (tomPath) => {
        const $ = document.querySelector.bind(document)

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

        const runner = new TestRunner({ tom: window.tom, view: new DefaultView() })
        $('test-runner').setRunner(runner)
        await runner.start()
        return runner.state
      }, tomPath)
      if (state === 'fail') process.exitCode = 1
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
