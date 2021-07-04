import ansi from 'ansi-escape-sequences'

class DefaultView {
  /**
   * @param {object} [options]
   * @param {object} [options.viewHideSkips]
   * @param {object} [options.viewHideErrStack]
   * @param {object} [options.viewShowStarts]
   */
  constructor (options = {}) {
    this.options = options
    this.theme = {
      test: 'white',
      plain: 'white',
      testDark: 'rgb(135,135,135)',
      group: 'magenta',
      groupDark: 'rgb(110,0,110)',
      fail: 'red',
      pass: 'green',
      skip: 'grey',
      todo: 'cyan',
      ignore: 'blue',
      duration: 'rgb(100,100,0)',
      inProgress: 'rgb(255,191,0)'
    }
  }

  async init () {
    if (typeof window === 'undefined') {
      this._util = await import('util')
    }
  }

  log (...args) {
    const msg = args.join(' ')
    console.log(ansi.format(msg))
  }

  start (count) {
    this.log(`\n[${this.theme.plain}]{Start: ${count} tests loaded}\n`)
  }

  testStart (test) {
    if (this.options.viewShowStarts) {
      const th = this.theme
      const parent = this.getParent(test)
      this.log(`[${th.groupDark}]{∙ ${parent}}[${th.testDark}]{${test.name}}`)
    }
  }

  testPass (test) {
    const th = this.theme
    const parent = this.getParent(test)
    const result = test.result === undefined ? '' : ` [${test.result}]`
    const duration = test.stats.duration.toFixed(1) + 'ms'
    this.log(`[${th.pass}]{✓} [${th.group}]{${parent}}${test.name}${result} [${th.duration}]{${duration}}`)
    if (test.context.data) {
      this.contextData(test)
    }
  }

  contextData (test) {
    if (typeof window === 'undefined') {
      const str = this.inspect(test.context.data)
      const data = this.indent(str, '   ')
      this.log(`\n${data.trimEnd()}\n`)
    }
  }

  testFail (test) {
    const th = this.theme
    const err = test.result
    const parent = this.getParent(test)
    this.log(`[${th.fail}]{⨯} [${th.group}]{${parent}}${test.name}`)
    const errMessage = this.indent(this.getErrorMessage(err), '   ')
    this.log(`\n${errMessage.trimEnd()}\n`)
    if (test.context.data) {
      this.contextData(test)
    }
  }

  testSkip (test) {
    if (!this.options.viewHideSkips) {
      const th = this.theme
      const parent = this.getParent(test)
      this.log(`[${th.skip}]{-} [${th.skip}]{${parent}}[${th.skip}]{${test.name}}`)
    }
  }

  testTodo (test) {
    if (!this.options.viewHideSkips) {
      const th = this.theme
      const parent = this.getParent(test);
      this.log(`[${th.todo}]{-} [${th.todo}]{${parent}}[${th.todo}]{${test.name}}`);
    }
  }

  inspect (input) {
    if (typeof window === 'undefined') {
      return this._util.inspect(input, { colors: true })
    } else {
      return JSON.stringify(input, null, '  ')
    }
  }

  indent (input, indentWith) {
    const lines = input.split('\n').map(line => {
      return indentWith + line
    })
    return lines.join('\n')
  }

  getErrorMessage (err) {
    if (this.options.viewHideErrStack) {
      return err.message
    } else {
      return err.stack
    }
  }

  getParent (test) {
    return test.parent ? test.parents().reverse().slice().map(p => p.name).join(' | ').trim() + ' ' : ''
  }

  /**
   * @params {object} stats
   * @params {object} stats.fail
   * @params {object} stats.pass
   * @params {object} stats.skip
   * @params {object} stats.start
   * @params {object} stats.end
   */
  end (stats) {
    const th = this.theme
    const failColour = stats.fail > 0 ? th.fail : th.plain
    const passColour = stats.pass > 0 ? th.pass : th.plain
    const skipColour = stats.skip > 0 ? th.skip : th.plain
    this.log(`\n[${th.plain}]{Completed in ${stats.timeElapsed()}ms. Pass: [${passColour}]{${stats.pass}}, fail: [${failColour}]{${stats.fail}}, skip: [${skipColour}]{${stats.skip}}.}\n`)
  }

  static optionDefinitions () {
    return [
      {
        name: 'view.hide-skips',
        type: Boolean,
        description: 'Hide skipped tests.'
      },
      {
        name: 'view.hide-err-stack',
        type: Boolean,
        description: 'Under a failed test, show the error message instead of the full error stack.'
      },
      {
        name: 'view.show-starts',
        type: Boolean,
        description: 'Show test start events.'
      },
    ]
  }
}

export default DefaultView
