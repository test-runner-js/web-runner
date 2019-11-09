const TestRunnerCli = require('test-runner')

class WebRunnerCli extends TestRunnerCli {
  constructor (options) {
    super(options)
    this.optionDefinitions = [
      { name: 'files', type: String, multiple: true, defaultOption: true },
      { name: 'help', type: Boolean, alias: 'h' },
      { name: 'show', type: Boolean, description: 'Show the Chromium window' },
      {
        name: 'tree',
        type: Boolean,
        alias: 't',
        description: 'Print the tree structure of the supplied TOM.'
      },
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
    const lws = Lws.create({
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
      console.log('PAGEERROR')
      console.error(require('util').inspect(err, { depth: 6, colors: true }))
    })

    /* what this start URL be? */
    page.goto('http://localhost:8000/harness/index.html')
    await page.waitForNavigation()

    const scriptHandle = await page.addScriptTag({
      content: `import tom from '${tomPath}'
      import TestRunner from '/node_modules/test-runner-core/dist/index.mjs'
      import DefaultView from '/node_modules/@test-runner/default-view/dist/index.mjs'
      const π = document.createElement.bind(document)
      const $ = document.querySelector.bind(document)

      const runner = new TestRunner(tom, { view: new DefaultView() })
      const testRunnerEl = π('test-runner')
      $('body').appendChild(testRunnerEl)
      testRunnerEl.setRunner(runner)
      window.runner = runner`,
      type: 'module'
    })

    const state = await page.evaluate(async (script) => {
      return new Promise((resolve, reject) => {
        setTimeout(function () {
          runner.start()
            .then(() => resolve(runner.state))
            .catch(reject)
        }, 100)
      })
    }, scriptHandle)

    if (state === 'fail') {
      process.exitCode = 1
    }

    if (!options.show) {
      await browser.close()
      lws.server.close()
    }
  }

  async start () {
    const options = await this.getOptions()
    /* currently, only running the first file supplied is supported */
    return this.launch(options.files[0], options)
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
