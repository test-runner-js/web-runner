const CliApp = require('test-runner')

class WebCliApp extends CliApp {
  constructor (options) {
    super(options)
    this.optionDefinitions = [
      { name: 'files', type: String, multiple: true, defaultOption: true },
      { name: 'help', type: Boolean, alias: 'h' },
      { name: 'scripts', multiple: true }
    ]
  }

  async printUsage () {
    const commandLineUsage = await this.loadModule('command-line-usage')
    this.errorLog(commandLineUsage([
      {
        header: 'web-runner',
        content: 'Run a TOM in Chrome.'
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
    const LocalWebServer = require('local-web-server')
    const path = require('path')
    tomPath = path.relative('harness', tomPath)
    const localWebServer = new LocalWebServer()
    const server = localWebServer.listen({ port: 8000 })
    const browser = await puppeteer.launch({ headless: true })
    const page = (await browser.pages())[0]
    try {
      page.on('console', msg => console.log(msg.text()))
      await page.goto('http://127.0.0.1:8000/harness/')
      for (let url of options.scripts || []) {
        if (!isURL(url)) url = path.relative('harness', url)
        await page.addScriptTag({ url })
      }
      // await page.addScriptTag({ url: 'https://www.chaijs.com/chai.js' })
      // await page.addScriptTag({ url: '../node_modules/test-object-model/dist/index.js' })
      // await page.addScriptTag({ url: '../node_modules/sleep-anywhere/dist/index.js' })
      // await page.addScriptTag({ url: '../test/es5/something-el.js' })
      const state = await page.evaluate(async (tomPath) => {
        await import('./test-runner-el.mjs')
        const TestRunner = (await import('../node_modules/test-runner-core/index.mjs')).default
        const π = document.createElement.bind(document)
        const $ = document.querySelector.bind(document)
        await import(tomPath)
        const runner = new TestRunner({ tom: window.tom })
        const testRunnerEl = π('test-runner')
        $('body').appendChild(testRunnerEl)
        testRunnerEl.setRunner(runner)
        await runner.start()
        return runner.state
      }, tomPath)
      console.log('state', state)
    } finally {
      await browser.close()
      server.close()
    }
  }

  async processFiles (files, options) {
    /* currently only runs the first file supplied */
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

module.exports = WebCliApp
