'use strict';

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () {
            return e[k];
          }
        });
      }
    });
  }
  n['default'] = e;
  return Object.freeze(n);
}

function raceTimeout (ms, msg) {
  return new Promise((resolve, reject) => {
    const interval = setTimeout(() => {
      const err = new Error(msg || `Timeout expired [${ms}]`);
      reject(err);
    }, ms);
    if (interval.unref) interval.unref();
  })
}

/**
 * Creates a mixin for use in a class extends expression.
 * @module create-mixin
 */

/**
 * @alias module:create-mixin
 * @param {class} Src - The class containing the behaviour you wish to mix into another class.
 * @returns {function}
 */
function createMixin (Src) {
  return function (Base) {
    class Mixed extends Base {}
    for (const propName of Object.getOwnPropertyNames(Src.prototype)) {
      if (propName === 'constructor') continue
      Object.defineProperty(Mixed.prototype, propName, Object.getOwnPropertyDescriptor(Src.prototype, propName));
    }
    if (Src.prototype[Symbol.iterator]) {
      Object.defineProperty(Mixed.prototype, Symbol.iterator, Object.getOwnPropertyDescriptor(Src.prototype, Symbol.iterator));
    }
    return Mixed
  }
}

/**
 * An isomorphic, load-anywhere JavaScript class for building [composite structures](https://en.wikipedia.org/wiki/Composite_pattern). Suitable for use as a super class or mixin.
 * @module composite-class
 * @example
 * const Composite = require('composite-class')
 */

const _children = new WeakMap();
const _parent = new WeakMap();

/**
 * @alias module:composite-class
 */
class Composite {
  /**
   * Children
   * @type {Array}
   */
  get children () {
    if (_children.has(this)) {
      return _children.get(this)
    } else {
      _children.set(this, []);
      return _children.get(this)
    }
  }

  set children (val) {
    _children.set(this, val);
  }

  /**
   * Parent
   * @type {Composite}
   */
  get parent () {
    return _parent.get(this)
  }

  set parent (val) {
    _parent.set(this, val);
  }

  /**
   * Add a child
   * @returns {Composite}
   */
  add (child) {
    if (!(isComposite(child))) throw new Error('can only add a Composite instance')
    child.parent = this;
    this.children.push(child);
    return child
  }

  /**
   * @param {Composite} child - the child node to append
   * @returns {Composite}
   */
  append (child) {
    if (!(child instanceof Composite)) throw new Error('can only add a Composite instance')
    child.parent = this;
    this.children.push(child);
    return child
  }

  /**
   * @param {Composite} child - the child node to prepend
   * @returns {Composite}
   */
  prepend (child) {
    if (!(child instanceof Composite)) throw new Error('can only add a Composite instance')
    child.parent = this;
    this.children.unshift(child);
    return child
  }

  /**
   * @param {Composite} child - the child node to remove
   * @returns {Composite}
   */
  remove (child) {
    return this.children.splice(this.children.indexOf(child), 1)
  }

  /**
   * depth level in the tree, 0 being root.
   * @returns {number}
   */
  level () {
    let count = 0;
    function countParent (composite) {
      if (composite.parent) {
        count++;
        countParent(composite.parent);
      }
    }
    countParent(this);
    return count
  }

  /**
   * @returns {number}
   */
  getDescendentCount () {
    return Array.from(this).length
  }

  /**
   * prints a tree using the .toString() representation of each node in the tree
   * @returns {string}
   */
  tree () {
    return Array.from(this).reduce((prev, curr) => {
      return (prev += `${'  '.repeat(curr.level())}- ${curr}\n`)
    }, '')
  }

  /**
   * Returns the root instance of this tree.
   * @returns {Composite}
   */
  root () {
    function getRoot (composite) {
      return composite.parent ? getRoot(composite.parent) : composite
    }
    return getRoot(this)
  }

  /**
   * default iteration strategy
   */
  * [Symbol.iterator] () {
    yield this;
    for (const child of this.children) {
      yield * child;
    }
  }

  /**
   * Used by node's `util.inspect`.
   */
  inspect (depth) {
    const clone = Object.assign({}, this);
    delete clone.parent;
    return clone
  }

  /**
   * Returns an array of ancestors
   * @return {Composite[]}
   */
  parents () {
    const output = [];
    function addParent (node) {
      if (node.parent) {
        output.push(node.parent);
        addParent(node.parent);
      }
    }
    addParent(this);
    return output
  }
}

function isComposite (item) {
  return item && item.children && item.add && item.level && item.root
}

/**
 * @module obso
 */
const _listeners = new WeakMap();

/**
 * @alias module:obso
 */
class Emitter {
  constructor () {
    _listeners.set(this, []);
  }

  /**
   * Emit an event.
   * @param {string} eventName - the event name to emit.
   * @param ...args {*} - args to pass to the event handler
   */
  emit (eventName, ...args) {
    const listeners = _listeners.get(this);
    if (listeners && listeners.length > 0) {
      const toRemove = [];

      /* invoke each relevant listener */
      for (const listener of listeners) {
        const handlerArgs = args.slice();
        if (listener.eventName === '__ALL__') {
          handlerArgs.unshift(eventName);
        }

        if (listener.eventName === '__ALL__' || listener.eventName === eventName) {
          listener.handler.call(this, ...handlerArgs);

          /* remove once handler */
          if (listener.once) toRemove.push(listener);
        }
      }

      toRemove.forEach(listener => {
        listeners.splice(listeners.indexOf(listener), 1);
      });
    }

    /* bubble event up */
    if (this.parent) this.parent._emitTarget(eventName, this, ...args);
  }

  _emitTarget (eventName, target, ...args) {
    const listeners = _listeners.get(this);
    if (listeners && listeners.length > 0) {
      const toRemove = [];

      /* invoke each relevant listener */
      for (const listener of listeners) {
        const handlerArgs = args.slice();
        if (listener.eventName === '__ALL__') {
          handlerArgs.unshift(eventName);
        }

        if (listener.eventName === '__ALL__' || listener.eventName === eventName) {
          listener.handler.call(target, ...handlerArgs);

          /* remove once handler */
          if (listener.once) toRemove.push(listener);
        }
      }

      toRemove.forEach(listener => {
        listeners.splice(listeners.indexOf(listener), 1);
      });
    }

    /* bubble event up */
    if (this.parent) this.parent._emitTarget(eventName, target || this, ...args);
  }

   /**
    * Register an event listener.
    * @param {string} [eventName] - The event name to watch. Omitting the name will catch all events.
    * @param {function} handler - The function to be called when `eventName` is emitted. Invocated with `this` set to `emitter`.
    * @param {object} [options]
    * @param {boolean} [options.once] - If `true`, the handler will be invoked once then removed.
    */
  on (eventName, handler, options) {
    const listeners = _listeners.get(this);
    options = options || {};
    if (arguments.length === 1 && typeof eventName === 'function') {
      handler = eventName;
      eventName = '__ALL__';
    }
    if (!handler) {
      throw new Error('handler function required')
    } else if (handler && typeof handler !== 'function') {
      throw new Error('handler arg must be a function')
    } else {
      listeners.push({ eventName, handler: handler, once: options.once });
    }
  }

  /**
   * Remove an event listener.
   * @param eventName {string} - the event name
   * @param handler {function} - the event handler
   */
  removeEventListener (eventName, handler) {
    const listeners = _listeners.get(this);
    if (!listeners || listeners.length === 0) return
    const index = listeners.findIndex(function (listener) {
      return listener.eventName === eventName && listener.handler === handler
    });
    if (index > -1) listeners.splice(index, 1);
  }

  /**
   * Once.
   * @param {string} eventName - the event name to watch
   * @param {function} handler - the event handler
   */
  once (eventName, handler) {
    /* TODO: the once option is browser-only */
    this.on(eventName, handler, { once: true });
  }
}

/**
 * Alias for `on`.
 */
Emitter.prototype.addEventListener = Emitter.prototype.on;

/**
 * Takes any input and guarantees an array back.
 *
 * - Converts array-like objects (e.g. `arguments`, `Set`) to a real array.
 * - Converts `undefined` to an empty array.
 * - Converts any another other, singular value (including `null`, objects and iterables other than `Set`) into an array containing that value.
 * - Ignores input which is already an array.
 *
 * @module array-back
 * @example
 * > const arrayify = require('array-back')
 *
 * > arrayify(undefined)
 * []
 *
 * > arrayify(null)
 * [ null ]
 *
 * > arrayify(0)
 * [ 0 ]
 *
 * > arrayify([ 1, 2 ])
 * [ 1, 2 ]
 *
 * > arrayify(new Set([ 1, 2 ]))
 * [ 1, 2 ]
 *
 * > function f(){ return arrayify(arguments); }
 * > f(1,2,3)
 * [ 1, 2, 3 ]
 */

function isObject (input) {
  return typeof input === 'object' && input !== null
}

function isArrayLike (input) {
  return isObject(input) && typeof input.length === 'number'
}

/**
 * @param {*} - The input value to convert to an array
 * @returns {Array}
 * @alias module:array-back
 */
function arrayify (input) {
  if (Array.isArray(input)) {
    return input
  } else if (input === undefined) {
    return []
  } else if (isArrayLike(input) || input instanceof Set) {
    return Array.from(input)
  } else {
    return [input]
  }
}

/**
 * @module fsm-base
 * @typicalname stateMachine
 */

const _initialState = new WeakMap();
const _state = new WeakMap();
const _validMoves = new WeakMap();

/**
 * @alias module:fsm-base
 * @extends {Emitter}
 */
class StateMachine extends Emitter {
  /**
   * @param {string} - Initial state, e.g. 'pending'.
   * @param {object[]} - Array of valid move rules.
   */
  constructor (initialState, validMoves) {
    super();
    _validMoves.set(this, arrayify(validMoves).map(move => {
      move.from = arrayify(move.from);
      move.to = arrayify(move.to);
      return move
    }));
    _state.set(this, initialState);
    _initialState.set(this, initialState);
  }

  /**
   * The current state
   * @type {string} state
   * @throws `INVALID_MOVE` if an invalid move made
   */
  get state () {
    return _state.get(this)
  }

  set state (state) {
    this.setState(state);
  }

  /**
   * Set the current state. The second arg onward will be sent as event args.
   * @param {string} state
   */
  setState (state, ...args) {
    /* nothing to do */
    if (this.state === state) return

    const validTo = _validMoves.get(this).some(move => move.to.indexOf(state) > -1);
    if (!validTo) {
      const msg = `Invalid state: ${state}`;
      const err = new Error(msg);
      err.name = 'INVALID_MOVE';
      throw err
    }

    let moved = false;
    const prevState = this.state;
    _validMoves.get(this).forEach(move => {
      if (move.from.indexOf(this.state) > -1 && move.to.indexOf(state) > -1) {
        _state.set(this, state);
        moved = true;
        /**
         * fired on every state change
         * @event module:fsm-base#state
         * @param state {string} - the new state
         * @param prev {string} - the previous state
         */
        this.emit('state', state, prevState);

        /**
         * fired on every state change
         */
        this.emit(state, ...args);
      }
    });
    if (!moved) {
      const froms = _validMoves.get(this)
        .filter(move => move.to.indexOf(state) > -1)
        .map(move => move.from.map(from => `'${from}'`))
        .flat();
      const msg = `Can only move to '${state}' from ${froms.join(' or ') || '<unspecified>'} (not '${prevState}')`;
      const err = new Error(msg);
      err.name = 'INVALID_MOVE';
      throw err
    }
  }

  /**
   * Reset to initial state.
   * @emits "reset"
   */
  resetState () {
    const prevState = this.state;
    const initialState = _initialState.get(this);
    _state.set(this, initialState);
    this.emit('reset', prevState);
  }
}

/**
 * The test context, available as `this` within each test function.
 */
class TestContext {
  constructor (context) {
    /**
     * The name given to this test.
     */
    this.name = context.name;
    /**
     * The test index within the current set.
     */
    this.index = context.index;
    /**
     * Test run data.
     */
    this.data = undefined;
  }
}

/**
 * Isomorphic, functional type-checking for Javascript.
 * @module typical
 * @typicalname t
 * @example
 * const t = require('typical')
 * const allDefined = array.every(t.isDefined)
 */

/**
 * A plain object is a simple object literal, it is not an instance of a class. Returns true if the input `typeof` is `object` and directly decends from `Object`.
 *
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * > t.isPlainObject({ something: 'one' })
 * true
 * > t.isPlainObject(new Date())
 * false
 * > t.isPlainObject([ 0, 1 ])
 * false
 * > t.isPlainObject(/test/)
 * false
 * > t.isPlainObject(1)
 * false
 * > t.isPlainObject('one')
 * false
 * > t.isPlainObject(null)
 * false
 * > t.isPlainObject((function * () {})())
 * false
 * > t.isPlainObject(function * () {})
 * false
 */
function isPlainObject (input) {
  return input !== null && typeof input === 'object' && input.constructor === Object
}

/**
 * Returns true if the input value is defined.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isDefined (input) {
  return typeof input !== 'undefined'
}

/**
 * Returns true if the input is a Promise.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isPromise (input) {
  if (input) {
    const isPromise = isDefined(Promise) && input instanceof Promise;
    const isThenable = input.then && typeof input.then === 'function';
    return !!(isPromise || isThenable)
  } else {
    return false
  }
}

/**
 * Returns true if the input value is a string. The equivalent of `typeof input === 'string'` for use in funcitonal contexts.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isString (input) {
  return typeof input === 'string'
}

/**
 * Returns true if the input value is a function. The equivalent of `typeof input === 'function'` for use in funcitonal contexts.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isFunction (input) {
  return typeof input === 'function'
}

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
class Tom extends createMixin(Composite)(StateMachine) {
  constructor (name, testFn, options) {
    if (name) {
      if (isString(name)) {
        if (isPlainObject(testFn)) {
          options = testFn;
          testFn = undefined;
        }
      } else if (isFunction(name)) {
        options = testFn;
        testFn = name;
        name = '';
      } else if (isPlainObject(name)) {
        options = name;
        testFn = undefined;
        name = '';
      }
    } else {
      if (isPlainObject(testFn)) {
        options = testFn;
        testFn = undefined;
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
    ]);

    /**
     * Test name
     * @type {string}
     */
    this.name = name || 'tom';

    /**
     * A function which will either succeed, reject or throw.
     * @type {function}
     */
    this.testFn = testFn;

    /**
     * Position of this test within its parents children
     * @type {number}
     */
    this.index = 1;

    /**
     * True if the test has ended.
     * @type {boolean}
     */
    this.ended = false;

    /**
     * If the test passed, the value returned by the test function. If it failed, the exception thrown or rejection reason.
     * @type {*}
     */
    this.result = undefined;

    options = Object.assign({}, options);
    options.maxConcurrency = options.maxConcurrency || 10;
    options.timeout = options.timeout || 10000;

    /**
     * True if one or more different tests are marked as `only`.
     * @type {boolean}
     */
    this.disabledByOnly = false;

    /**
     * The options set when creating the test.
     */
    this.options = options;

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
        this.end = end;
        this.duration = this.end - this.start;
      }
    };

    /**
     * The text execution context.
     * @type {TextContext}
     */
    this.context = undefined;
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
    options.group = true;
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
    const test = new this.constructor(name, testFn, options);
    this.add(test);
    test.index = this.children.length;
    test._disableNonOnlyTests();
    return test
  }

  /**
   * Add a skipped test
   * @return {module:test-object-model}
   */
  skip (name, testFn, options = {}) {
    options.skip = true;
    return this.test(name, testFn, options)
  }

  /**
   * Add an only test
   * @return {module:test-object-model}
   */
  only (name, testFn, options = {}) {
    options.only = true;
    return this.test(name, testFn, options)
  }

  /**
   * Add a test which must run and complete before the others.
   * @return {module:test-object-model}
   */
  before (name, testFn, options = {}) {
    options.before = true;
    return this.test(name, testFn, options)
  }

  /**
   * Add a test but don't run it and mark as incomplete.
   * @return {module:test-object-model}
   */
  todo (name, testFn, options = {}) {
    options.todo = true;
    return this.test(name, testFn, options)
  }

  /**
   * Add a test which must run and complete after the others.
   * @return {module:test-object-model}
   */
  after (name, testFn, options = {}) {
    options.after = true;
    return this.test(name, testFn, options)
  }

  _onlyExists () {
    return Array.from(this.root()).some(t => t.options.only)
  }

  _disableNonOnlyTests () {
    if (this._onlyExists()) {
      for (const test of this.root()) {
        test.disabledByOnly = !test.options.only;
      }
    }
  }

  setState (state, target, data) {
    if (state === 'pass' || state === 'fail') {
      this.ended = true;
    }
    super.setState(state, target, data);
    if (state === 'pass' || state === 'fail') {
      this.emit('end');
    }
  }

  /**
   * Execute the stored test function.
   * @returns {Promise}
   * @fulfil {*}
   */
  async run () {
    const performance = await this._getPerformance();
    if (this.testFn) {
      if (this.toSkip) {
        /**
         * Test skipped.
         * @event module:test-object-model#skipped
         * @param test {TestObjectModel} - The test node.
         */
        this.setState('skipped', this);
      } else if (this.options.todo) {
        /**
         * Test todo.
         * @event module:test-object-model#todo
         * @param test {TestObjectModel} - The test node.
         */
        this.setState('todo', this);
      } else {
        /**
         * Test in-progress.
         * @event module:test-object-model#in-progress
         * @param test {TestObjectModel} - The test node.
         */
        this.setState('in-progress', this);

        this.stats.start = performance.now();

        try {
          this.context = new TestContext({
            name: this.name,
            index: this.index
          });
          const testResult = this.testFn.call(this.context);
          if (isPromise(testResult)) {
            try {
              const result = await Promise.race([testResult, raceTimeout(this.options.timeout)]);
              this.result = result;
              this.stats.finish(performance.now());

              /**
               * Test pass.
               * @event module:test-object-model#pass
               * @param test {TestObjectModel} - The test node.
               * @param result {*} - The value returned by the test.
               */
              this.setState('pass', this, result);
              return result
            } catch (err) {
              this.result = err;
              this.stats.finish(performance.now());

              /**
               * Test fail.
               * @event module:test-object-model#fail
               * @param test {TestObjectModel} - The test node.
               * @param err {Error} - The exception thrown.
               */
              this.setState('fail', this, err);
              return Promise.reject(err)
            }
          } else {
            this.stats.finish(performance.now());
            this.result = testResult;
            this.setState('pass', this, testResult);
            return testResult
          }
        } catch (err) {
          this.result = err;
          this.stats.finish(performance.now());
          this.setState('fail', this, err);
          throw (err)
        }
      }
    } else {
      if (this.options.todo) {
        this.setState('todo', this);
      } else {
        /**
         * Test ignored.
         * @event module:test-object-model#ignored
         * @param test {TestObjectModel} - The test node.
         */
        this.setState('ignored', this);
      }
    }
  }

  /**
   * Reset state
   */
  reset (deep) {
    if (deep) {
      for (const tom of this) {
        tom.reset();
      }
    } else {
      this.index = 1;
      this.resetState();
      this.disabledByOnly = false;
    }
  }

  async _getPerformance () {
    if (typeof window === 'undefined') {
      const { performance } = await Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require('perf_hooks')); });
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
    let test;
    if (tests.length > 1) {
      test = new this(name, options);
      for (const subTom of tests) {
        this.validate(subTom);
        test.add(subTom);
      }
    } else {
      test = tests[0];
      this.validate(test);
    }
    test._disableNonOnlyTests();
    return test
  }

  /**
   * Returns true if the input is a valid test.
   * @param {module:test-object-model} tom - Input to test.
   * @returns {boolean}
   */
  static validate (tom = {}) {
    const valid = ['name', 'testFn', 'index', 'ended'].every(prop => Object.keys(tom).includes(prop));
    if (!valid) {
      const err = new Error('Valid TOM required');
      err.invalidTom = tom;
      throw err
    }
  }
}

module.exports = Tom;
