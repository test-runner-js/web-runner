const TestRunnerCli = require('test-runner')
const path = require('path')

class WebRunnerCli extends TestRunnerCli {
  constructor (options) {
    super(options)
    this.optionDefinitions.push({
      name: 'show',
      type: Boolean,
      description: 'Show the Chromium window'
    })
    const treeIndex = this.optionDefinitions.findIndex(i => i.name === 'tree')
    this.optionDefinitions.splice(treeIndex, 1)
    const os = require('os')
    this.tmpDir = path.join(os.tmpdir(), 'web-runner')
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
        content: '$ web-runner [<options>] {underline file} {underline ...}'
      },
      {
        header: 'Options',
        optionList: this.optionDefinitions,
        hide: 'files'
      },
      {
        header: 'View options',
        optionList: this.viewOptionDefinitions
      },
      {
        content: 'For more information see: {underline https://github.com/test-runner-js/web-runner}'
      }
    ]))
  }

  async createBundle (tomFiles) {
    const rollup = require('rollup')
    const resolve = require('rollup-plugin-node-resolve')
    const fs = require('fs')
    const os = require('os')

    try {
      fs.mkdirSync(this.tmpDir)
    } catch (err) {
      /* directory exists */
    }

    const testRunnerPath = path.resolve(require.resolve('test-runner-core'), '../index.mjs')
    const defaultViewPath = path.resolve(require.resolve('@test-runner/default-view'), '../index.mjs')
    const TomPath = path.resolve(require.resolve('test-object-model'), '../index.mjs')

    let entry = ''
    let toms = ''
    for (const [i, tomFile] of tomFiles.entries()) {
      const path = require('path')
      const extname = path.extname(tomFile)
      const basename = path.basename(tomFile, extname)
      entry += `import tomPromise${i} from '${path.resolve(tomFile)}'\n`
      toms += `[await tomPromise${i}, '${basename}'],\n`
    }
    entry += `
    import TestRunner from '${testRunnerPath}'
    import DefaultView from '${defaultViewPath}'
    import Tom from '${TomPath}'

    async function getTom (options) {
      const toms = [
        ${toms}
      ]
      /* load and name tom files */
      for (const tom of toms) {
        if (tom[0]) {
          if (tom[0].name === 'tom') {
            tom[0].name = tom[1]
          }
        } else {
          throw new Error('No TOM exported: ')
        }
      }
      const name = 'web-runner'
      return Tom.combine(toms.map(t => t[0]), name, options)
    }

    async function start () {
      const tom = await getTom()
      const runner = new TestRunner(tom, { view: new DefaultView() })
      return runner
    }

    export default start`

    const entryPath = path.join(this.tmpDir, 'entry.mjs')
    const outputPath = path.join(this.tmpDir, 'output.mjs')
    fs.writeFileSync(entryPath, entry)

    const bundle = await rollup.rollup({
      input: entryPath,
      external: [...require('module').builtinModules, 'https://www.chaijs.com/chai.js'],
      inlineDynamicImports: true,
      plugins: [resolve({
        preferBuiltins: true
      })]
    })
    const generated = await bundle.generate({
      format: 'esm',
      // sourcemap: 'inline'
    })
    fs.writeFileSync(outputPath, generated.output[0].code)
  }

  async launch (tomFiles, options) {
    const puppeteer = require('puppeteer')
    const Lws = require('lws')
    const fs = require('fs')

    await this.createBundle(tomFiles)

    const port = 7357
    const lws = Lws.create({
      port,
      stack: 'lws-static',
      moduleDir: [__dirname],
      directory: this.tmpDir
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
      browser.close()
      lws.server.close()
    })

    /* what this start URL be? */
    page.goto(`http://localhost:${port}/`)
    await page.waitForNavigation()

    const outputPath = path.join(this.tmpDir, 'output.mjs')
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

    return state
  }

  async start () {
    await this.getAllOptionDefinitions()
    const options = await this.getOptions()

    /* --help */
    if (options.help) {
      return this.printUsage()

    /* --version */
    } else if (options.version) {
      return this.printVersion()

    /* --files */
    } else {
      if (options.files && options.files.length) {
        const files = await this.expandGlobs(options.files)
        if (files.length) {
          return this.launch(files, options)
        } else {
          this.errorLog('one or more input files required')
          return this.printUsage()
        }
      } else {
        return this.printUsage()
      }
    }
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
