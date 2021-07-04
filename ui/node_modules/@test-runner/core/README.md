[![view on npm](https://badgen.net/npm/v/@test-runner/core)](https://www.npmjs.org/package/@test-runner/core)
[![npm module downloads](https://badgen.net/npm/dt/@test-runner/core)](https://www.npmjs.org/package/@test-runner/core)
[![Gihub repo dependents](https://badgen.net/github/dependents-repo/test-runner-js/core)](https://github.com/test-runner-js/core/network/dependents?dependent_type=REPOSITORY)
[![Gihub package dependents](https://badgen.net/github/dependents-pkg/test-runner-js/core)](https://github.com/test-runner-js/core/network/dependents?dependent_type=PACKAGE)
[![Node.js CI](https://github.com/test-runner-js/core/actions/workflows/node.js.yml/badge.svg)](https://github.com/test-runner-js/core/actions/workflows/node.js.yml)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

# @test-runner/core

***This documentation is a work in progress.***

Isomophic test runner. Takes a test-object-model instance as input, streaming progress info to the attached view or listener. Used by test-runner and web-runner.

## Synopsis

This trivial example creates a test object model containing one passing and one failing test. The model is passed to a `TestRunnerCore` instance, along with the default view, which then runs the tests printing the result to the console.

```js
import TestRunnerCore from '@test-runner/core'
import Tom from '@test-runner/tom'

/* Define a simple test model */
const tom = new Tom()

tom.test('A successful test', function () {
  return 'This passed'
})

tom.test('A failing test', function () {
  throw new Error('This failed')
})

/* send test-runner output to the default view  */
const view = new DefaultView()

/* run the tests defined in the test model */
const runner = new TestRunnerCore(tom, { view })
runner.start()
```

Output.

```
$ nodem tmp/synopsis.mjs

Start: 2 tests loaded

 ✓ tom A successful test [This passed]
 ⨯ tom A failing test

   Error: This failed
       at TestContext.<anonymous> (file:///Users/lloyd/Documents/test-runner-js/core/tmp/synopsis.mjs:13:9)
       ...
       at processTimers (internal/timers.js:475:7)


Completed in 11ms. Pass: 1, fail: 1, skip: 0.
```

Instead of passing a `view` instance to `TestRunnerCore`, this example shows how to observe `runner` events and print your own output.

```js
const runner = new TestRunnerCore(tom)

runner.on('state', (state, prevState) => {
  console.log(`Runner state change: ${prevState} -> ${state}`)
})
runner.on('test-pass', test => {
  console.log(`Test passed: ${test.name}`)
})
runner.on('test-fail', test => {
  console.log(`Test failed: ${test.name}`)
})
runner.start().then(() => {
  console.log(`Test run complete. State: ${runner.state}, passed: ${runner.stats.pass}, failed: ${runner.stats.fail}`)
})
```

Output.

```
$ node --experimental-modules synopsis.mjs
Runner state change: pending -> in-progress
Test passed: A successful test
Test failed: A failing test
Runner state change: in-progress -> fail
Test run complete. State: fail, passed: 1, failed: 1
```

## See also

* [API docs](https://github.com/test-runner-js/core/blob/master/docs/API.md)

* * *

&copy; 2016-21 Lloyd Brookes \<75pound@gmail.com\>. Documented by [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown).
