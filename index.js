const CliApp = require('test-runner')

class WebCliApp extends CliApp {
  constructor (options) {
    super(options)
    this.optionDefinitions.push(
      { name: 'script', multiple: true }
    )
  }

  async launch (tomPath) {
    const puppeteer = require('puppeteer')
    const LocalWebServer = require('local-web-server')
    const path = require('path')
    tomPath = path.relative('harness', tomPath)
    const localWebServer = new LocalWebServer()
    const server = localWebServer.listen({ port: 8000 })
    const browser = await puppeteer.launch({ headless: true })
    const page = (await browser.pages())[0]
    page.on('console', msg => console.log(msg.text()))
    await page.goto('http://127.0.0.1:8000/harness/')
    await page.addScriptTag({ url: 'https://www.chaijs.com/chai.js' })
    await page.addScriptTag({ url: '../node_modules/test-object-model/dist/index.js' })
    await page.addScriptTag({ url: '../node_modules/sleep-anywhere/dist/index.js' })
    await page.addScriptTag({ url: '../test/es5/el.js' })
    const state = await page.evaluate(async (tomPath) => {
      await import('./test-runner-el.mjs')
      const TestRunner = (await import('../node_modules/test-runner-core/index.mjs')).default
      const π = document.createElement.bind(document)
      const $ = document.querySelector.bind(document)

      // const tom = (await import(tomPath)).default
      await import(tomPath)
      const runner = new TestRunner({ tom: window.tom })
      const testRunnerEl = π('test-runner')
      $('body').appendChild(testRunnerEl)
      testRunnerEl.setRunner(runner)
      await runner.start()
      return runner.state
    }, tomPath)
    console.log('state', state)
    await browser.close()
    server.close()
  }

  async processFiles (files, options) {
    // const tom = await this.getTom(files)

    /* --tree */
    if (options.tree) {
      this.log(tom.tree())
    } else {
      this.launch(files[0])
    }
  }
}

module.exports = WebCliApp
