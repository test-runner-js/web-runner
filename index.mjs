import TestRunnerCli from 'test-runner'
import { builtinModules } from 'module'
import currentModulePaths from 'current-module-paths'
import path from 'path'

const { __dirname } = currentModulePaths(import.meta.url)

class WebRunnerCli extends TestRunnerCli {
  constructor (options) {
    super(options)
    this.optionDefinitions.push(
      {
        name: 'show',
        type: Boolean,
        description: 'Show the Chromium window'
      },
      {
        name: 'tom',
        type: Boolean,
        description: 'Show the generated TOM'
      }
    )
    const treeIndex = this.optionDefinitions.findIndex(i => i.name === 'tree')
    this.optionDefinitions.splice(treeIndex, 1)
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

  async createTomBundle (tomFiles) {
    const { rollup } = await import('rollup')
    const resolve = (await import('@rollup/plugin-node-resolve')).default
    const commonJs = (await import('@rollup/plugin-commonjs')).default

    if (tomFiles.length > 1) {
      throw new Error('one file at a time first')
    }

    const bundle = await rollup({
      input: tomFiles,
      external: [...builtinModules, 'https://www.chaijs.com/chai.js'],
      plugins: [
        resolve({ preferBuiltins: true }),
        commonJs()
      ]
    })
    const generated = await bundle.generate({
      format: 'esm'
    })
    return generated.output[0].code
  }

  async launch (options) {
    const puppeteer = (await import('puppeteer')).default
    const Lws = (await import('lws')).default
    const LwsStatic = (await import('lws-static')).default

    const browser = await puppeteer.launch({ headless: !options.show })
    const page = (await browser.pages())[0]
    const port = 7357
    const tomBundle = await this.createTomBundle(options.files)
    class TomBundle {
      middleware (config) {
        return async (ctx, next) => {
          if (ctx.request.url === '/tom-bundle.mjs') {
            ctx.response.type = 'text/javascript'
            ctx.response.body = tomBundle
          }
          await next()
        }
      }
    }
    const lws = await Lws.create({
      port,
      stack: [TomBundle, LwsStatic],
      directory: path.resolve(__dirname, 'ui')
    })
    await page.goto(`http://localhost:${port}/index.html`)

    page.on('console', async msg => {
      const text = msg.text()
      /* avoid favicon 404s */
      if (!/404/.test(text)) {
        console.log(text)
      }
    })
    page.on('pageerror', err => {
      console.log('PAGEERROR')
      console.error(err)
      browser.close()
      lws.server.close()
    })

    browser.on('disconnected', () => {
      lws.server.close()
    })

    const state = await page.evaluate(async (show) => {
      const TestRunnerCore = (await import('/node_modules/@test-runner/core/dist/index.mjs')).default
      const DefaultView = (await import('/node_modules/@test-runner/default-view/dist/index.mjs')).default
      let tom = (await import('/tom-bundle.mjs')).default
      /* TestRunnerCore will accept a Promise but not a Puppeteer `JSHandle@promise`, so resolve it first. */
      tom = await tom
      let runner
      if (show) {
        runner = new TestRunnerCore(tom)
        document.querySelector('test-runner').setRunner(runner)
      } else {
        runner = new TestRunnerCore(tom, { view: new DefaultView() })
      }
      await runner.start()
      return runner.state
    }, options.show)

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

    /* --tom */
    } else if (options.tom) {
      const generated = await this.createTomBundle(options.files)
      console.log(generated)

    /* --files */
    } else {
      if (options.files && options.files.length) {
        options.files = await this.expandGlobs(options.files)
        return this.launch(options)
      } else {
        this.errorLog('one or more input files required')
        return this.printUsage()
      }
    }
  }
}

export default WebRunnerCli
