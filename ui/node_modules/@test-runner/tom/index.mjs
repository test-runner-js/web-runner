import raceTimeout from 'race-timeout-anywhere'
import mixin from 'create-mixin/index.mjs'
import CompositeClass from 'composite-class/index.mjs'
import StateMachine from 'fsm-base'
import TestContext from './lib/test-context.mjs'
import { isPromise, isPlainObject, isString, isFunction } from 'typical'

/**
 * @module test-object-model
 */

/**
 * @param {string} [name] - The test name.
 * @param {function} [testFn] - A function which will either succeed, reject or throw.
 * @param {object} [options] - Test config.
 * @param {number} [options.timeout] - A time limit for the test in ms.
 * @param {number} [options.maxConcurrency] - The max concurrency that child tests will be able to run. For example, specifying `2` will allow child tests to run two at a time. Defaults to `10`.
 * @param {boolean} [options.skip] - Skip this test.
 * @param {boolean} [options.only] - Only run this test.
 * @param {boolean} [options.before] - Run this test before its siblings.
 * @param {boolean} [options.after] - Run this test after its siblings.
 * @param {boolean} [options.todo] - Mark this test as incomplete.
 * @param {boolean} [options.group] - Mark this test as a group.
 * @alias module:test-object-model
 */
class Tom extends mixin(CompositeClass)(StateMachine) {
  constructor (name, testFn, options) {
    if (name) {
      if (isString(name)) {
        if (isPlainObject(testFn)) {
          options = testFn
          testFn = undefined
        }
      } else if (isFunction(name)) {
        options = testFn
        testFn = name
        name = ''
      } else if (isPlainObject(name)) {
        options = name
        testFn = undefined
        name = ''
      }
    } else {
      if (isPlainObject(testFn)) {
        options = testFn
        testFn = undefined
      }
    }

    /**
     * Test state. Can be one of `pending`, `in-progress`, `skipped`, `ignored`, `todo`, `pass` or `fail`.
     * @member {string} module:test-object-model#state
     */
    super('pending', [
      { from: 'pending', to: 'in-progress' },
      { from: 'pending', to: 'skipped' },
      { from: 'pending', to: 'ignored' },
      { from: 'pending', to: 'todo' },
      { from: 'in-progress', to: 'pass' },
      { from: 'in-progress', to: 'fail' }
    ])

    /**
     * Test name
     * @type {string}
     */
    this.name = name || 'tom'

    /**
     * A function which will either succeed, reject or throw.
     * @type {function}
     */
    this.testFn = testFn

    /**
     * Position of this test within its parents children
     * @type {number}
     */
    this.index = 1

    /**
     * True if the test has ended.
     * @type {boolean}
     */
    this.ended = false

    /**
     * If the test passed, the value returned by the test function. If it failed, the exception thrown or rejection reason.
     * @type {*}
     */
    this.result = undefined

    options = Object.assign({}, options)
    options.maxConcurrency = options.maxConcurrency || 10
    options.timeout = options.timeout || 10000

    /**
     * True if one or more different tests are marked as `only`.
     * @type {boolean}
     */
    this.disabledByOnly = false

    /**
     * The options set when creating the test.
     */
    this.options = options

    /**
     * Test execution stats
     * @namespace
     */
    this.stats = {
      /**
       * Start time.
       * @type {number}
       */
      start: 0,
      /**
       * End time.
       * @type {number}
       */
      end: 0,
      /**
       * Test execution duration.
       * @type {number}
       */
      duration: 0,
      finish: function (end) {
        this.end = end
        this.duration = this.end - this.start
      }
    }

    /**
     * The text execution context.
     * @type {TextContext}
     */
    this.context = undefined
  }

  /**
   * Returns `test`, `group` or `todo`.
   * @returns {string}
   */
  get type () {
    if (this.options.group) {
      return 'group'
    } else if (this.options.todo) {
      return 'todo'
    } else {
      if (this.testFn && !this.children.length) {
        return 'test'
      } else if (!this.testFn && this.children.length) {
        return 'group'
      } else {
        return 'todo'
      }
    }
  }

  /**
   * Returns `true` if this test was marked to be skipped by usage of `skip` or `only`.
   * @returns {booolean}
   */
  get toSkip () {
    return this.disabledByOnly || this.options.skip
  }

  /**
   * Returns the test name.
   * @returns {string}
   */
  toString () {
    return this.name
  }

  /**
   * Add a test group.
   * @param {string} - Test name.
   * @param {objects} - Config.
   * @return {module:test-object-model}
   */
  group (name, options = {}) {
    options.group = true
    return this.test(name, options)
  }

  /**
   * Add a test.
   * @param {string} - Test name.
   * @param {function} - Test function.
   * @param {objects} - Config.
   * @return {module:test-object-model}
   */
  test (name, testFn, options = {}) {
    /* validate name */
    for (const child of this) {
      if (child.name === name) {
        throw new Error('Duplicate name: ' + name)
      }
    }
    const test = new this.constructor(name, testFn, options)
    this.add(test)
    test.index = this.children.length
    test._disableNonOnlyTests()
    return test
  }

  /**
   * Add a skipped test
   * @return {module:test-object-model}
   */
  skip (name, testFn, options = {}) {
    options.skip = true
    return this.test(name, testFn, options)
  }

  /**
   * Add an only test
   * @return {module:test-object-model}
   */
  only (name, testFn, options = {}) {
    options.only = true
    return this.test(name, testFn, options)
  }

  /**
   * Add a test which must run and complete before the others.
   * @return {module:test-object-model}
   */
  before (name, testFn, options = {}) {
    options.before = true
    return this.test(name, testFn, options)
  }

  /**
   * Add a test but don't run it and mark as incomplete.
   * @return {module:test-object-model}
   */
  todo (name, testFn, options = {}) {
    options.todo = true
    return this.test(name, testFn, options)
  }

  /**
   * Add a test which must run and complete after the others.
   * @return {module:test-object-model}
   */
  after (name, testFn, options = {}) {
    options.after = true
    return this.test(name, testFn, options)
  }

  _onlyExists () {
    return Array.from(this.root()).some(t => t.options.only)
  }

  _disableNonOnlyTests () {
    if (this._onlyExists()) {
      for (const test of this.root()) {
        test.disabledByOnly = !test.options.only
      }
    }
  }

  setState (state, target, data) {
    if (state === 'pass' || state === 'fail') {
      this.ended = true
    }
    super.setState(state, target, data)
    if (state === 'pass' || state === 'fail') {
      this.emit('end')
    }
  }

  /**
   * Execute the stored test function.
   * @returns {Promise}
   * @fulfil {*}
   */
  async run () {
    const performance = await this._getPerformance()
    if (this.testFn) {
      if (this.toSkip) {
        /**
         * Test skipped.
         * @event module:test-object-model#skipped
         * @param test {TestObjectModel} - The test node.
         */
        this.setState('skipped', this)
      } else if (this.options.todo) {
        /**
         * Test todo.
         * @event module:test-object-model#todo
         * @param test {TestObjectModel} - The test node.
         */
        this.setState('todo', this)
      } else {
        /**
         * Test in-progress.
         * @event module:test-object-model#in-progress
         * @param test {TestObjectModel} - The test node.
         */
        this.setState('in-progress', this)

        this.stats.start = performance.now()

        try {
          this.context = new TestContext({
            name: this.name,
            index: this.index
          })
          const testResult = this.testFn.call(this.context)
          if (isPromise(testResult)) {
            try {
              const result = await Promise.race([testResult, raceTimeout(this.options.timeout)])
              this.result = result
              this.stats.finish(performance.now())

              /**
               * Test pass.
               * @event module:test-object-model#pass
               * @param test {TestObjectModel} - The test node.
               * @param result {*} - The value returned by the test.
               */
              this.setState('pass', this, result)
              return result
            } catch (err) {
              this.result = err
              this.stats.finish(performance.now())

              /**
               * Test fail.
               * @event module:test-object-model#fail
               * @param test {TestObjectModel} - The test node.
               * @param err {Error} - The exception thrown.
               */
              this.setState('fail', this, err)
              return Promise.reject(err)
            }
          } else {
            this.stats.finish(performance.now())
            this.result = testResult
            this.setState('pass', this, testResult)
            return testResult
          }
        } catch (err) {
          this.result = err
          this.stats.finish(performance.now())
          this.setState('fail', this, err)
          throw (err)
        }
      }
    } else {
      if (this.options.todo) {
        this.setState('todo', this)
      } else {
        /**
         * Test ignored.
         * @event module:test-object-model#ignored
         * @param test {TestObjectModel} - The test node.
         */
        this.setState('ignored', this)
      }
    }
  }

  /**
   * Reset state
   */
  reset (deep) {
    if (deep) {
      for (const tom of this) {
        tom.reset()
      }
    } else {
      this.index = 1
      this.resetState()
      this.disabledByOnly = false
    }
  }

  async _getPerformance () {
    if (typeof window === 'undefined') {
      const { performance } = await import('perf_hooks')
      return performance
    } else {
      return window.performance
    }
  }

  /**
   * If more than one TOM instances are supplied, combine them into a common root.
   * @param {Array.<Tom>} tests
   * @param {string} [name]
   * @return {Tom}
   */
  static combine (tests, name, options) {
    let test
    if (tests.length > 1) {
      test = new this(name, options)
      for (const subTom of tests) {
        this.validate(subTom)
        test.add(subTom)
      }
    } else {
      test = tests[0]
      this.validate(test)
    }
    test._disableNonOnlyTests()
    return test
  }

  /**
   * Returns true if the input is a valid test.
   * @param {module:test-object-model} tom - Input to test.
   * @returns {boolean}
   */
  static validate (tom = {}) {
    const valid = ['name', 'testFn', 'index', 'ended'].every(prop => Object.keys(tom).includes(prop))
    if (!valid) {
      const err = new Error('Valid TOM required')
      err.invalidTom = tom
      throw err
    }
  }
}

export default Tom
