const TestRunnerCli = require('test-runner')
const path = require('path')

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
      }
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

  async createBundle (tomPath) {
    const rollup = require('rollup')
    const fs = require('fs')
    const os = require('os')
    const tmpDir = path.join(os.tmpdir(), 'web-runner')
    try {
      fs.mkdirSync(tmpDir)
    } catch (err) {
      /* directory exists */
    }

    const testRunnerPath = path.resolve(require.resolve('test-runner-core'), '../index.mjs')
    const defaultViewPath = path.resolve(require.resolve('@test-runner/default-view'), '../index.mjs')

    const entry = `import tomPromise from '${path.resolve(tomPath)}'
    import TestRunner from '${testRunnerPath}'
    import DefaultView from '${defaultViewPath}'
    const π = document.createElement.bind(document)
    const $ = document.querySelector.bind(document)

    async function start () {
      const tom = await tomPromise
      const runner = new TestRunner(tom, { view: new DefaultView() })
      return runner
    }

    export default start`
    const entryPath = path.join(tmpDir, 'entry.mjs')
    const outputPath = path.join(tmpDir, 'output.mjs')
    fs.writeFileSync(entryPath, entry)

    const bundle = await rollup.rollup({
      input: entryPath,
      external: ['assert', 'https://www.chaijs.com/chai.js']
    })
    const generated = await bundle.generate({ format: 'esm' })
    fs.writeFileSync(outputPath, generated.output[0].code)
  }

  async launch (tomPath, options) {
    const os = require('os')
    const puppeteer = require('puppeteer')
    const Lws = require('lws')
    const fs = require('fs')

    const tmpDir = path.join(os.tmpdir(), 'web-runner')
    const port = 7357
    const lws = Lws.create({
      port,
      stack: 'lws-static',
      moduleDir: [__dirname],
      directory: tmpDir
    })

    const browser = await puppeteer.launch({ headless: !options.show })
    const page = (await browser.pages())[0]
    page.on('console', async msg => {
      const text = msg.text()
      if (!/404/.test(text)) {
        console.log(text)
      }
    })
    page.on('pageerror', err => {
      console.log('PAGEERROR')
      console.error(require('util').inspect(err, { depth: 6, colors: true }))
    })

    /* what this start URL be? */
    page.goto(`http://localhost:${port}/`)
    await page.waitForNavigation()

    await this.createBundle(tomPath)
    const outputPath = path.join(tmpDir, 'output.mjs')
    const state = await page.evaluate(async () => {
      const getRunner = await import('./output.mjs')
      const runner = await getRunner.default()
      await runner.start()
      return runner.state
    })

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
