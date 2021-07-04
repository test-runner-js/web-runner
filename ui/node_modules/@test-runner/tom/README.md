[![view on npm](https://badgen.net/npm/v/@test-runner/tom)](https://www.npmjs.org/package/@test-runner/tom)
[![npm module downloads](https://badgen.net/npm/dt/@test-runner/tom)](https://www.npmjs.org/package/@test-runner/tom)
[![Gihub repo dependents](https://badgen.net/github/dependents-repo/test-runner-js/tom)](https://github.com/test-runner-js/tom/network/dependents?dependent_type=REPOSITORY)
[![Gihub package dependents](https://badgen.net/github/dependents-pkg/test-runner-js/tom)](https://github.com/test-runner-js/tom/network/dependents?dependent_type=PACKAGE)
[![Node.js CI](https://github.com/test-runner-js/tom/actions/workflows/node.js.yml/badge.svg)](https://github.com/test-runner-js/tom/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/test-runner-js/tom/badge.svg)](https://coveralls.io/github/test-runner-js/tom)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

# @test-runner/tom

***This project and documentation are a work in progress***.

Used for defining a test suite for use with a compatible runner. The model describes your test functions, how they are grouped, the order in which they should run, the config for each (timeout, max concurrency etc.)

It is supplied as input to a compatible runner, for example: [test-runner](https://github.com/test-runner-js/cli) or [web-runner](https://github.com/test-runner-js/web-runner).

## Synopsis

Trivial example creating a TOM containing two tests - one pass and one fail. Create a test by supplying a name and test function to `tom.test`. If the function throws or rejects the test is considered a fail.

```js
import Tom from '@test-runner/tom'
const tom = new Tom()

tom.test('A successful test', function () {
  return 'This passed'
})

tom.test('A failing test', function () {
  throw new Error('This failed')
})

export default tom
```

Save the above to file named `test.mjs`, you can now run this test suite in several ways. For example, you can run it in Node.js by supplying it as input to `test-runner`.

```
$ test-runner tmp/synopsis.mjs

Start: 2 tests loaded

✓ synopsis A successful test [This passed]
⨯ synopsis A failing test

   Error: This failed
       at TestContext.<anonymous> (file:///Users/lloyd/Documents/test-runner-js/tom/tmp/synopsis.mjs:10:9)
       ...
       at processTimers (internal/timers.js:475:7)


Completed in 10ms. Pass: 1, fail: 1, skip: 0.
```

To confirm the test suite and the code under test is isomorphic you can run the same TOM in the browser (Chromium) using `web-runner`.

```
$ web-runner tmp/synopsis.mjs

Start: 2 tests loaded

✓ tom A successful test [This passed]
⨯ tom A failing test

   Error: This failed
       at TestContext.<anonymous> (http://localhost:7357/output.mjs:894:9)
       ...
       at http://localhost:7357/output.mjs:2016:21


Completed in 8ms. Pass: 1, fail: 1, skip: 0.
```

## API summary

Supply a name and test function to `tom.test`. If the function throws or rejects the test is considered a fail.

```js
tom.test('name', function () {
  // test
})
```

Skip a test.

```js
tom.skip('name', function () {
  // test
})
```

Skip all but this and any other tests marked as `only`.

```js
tom.only('name', function () {
  // test
})
```

Group.

```js
const myGroup = tom.group('My group')
```

Before and after

```js
tom.before('name', function () {
  // test
})

tom.after('name', function () {
  // test
})

```

Todo

```js
tom.todo('name', function () {
  // Complete later
})
```

Reset a completed test, ready to run again.

```js
tom.reset()
```


## Documentation

* [API reference](https://github.com/test-runner-js/tom/blob/master/docs/API.md)

* * *

&copy; 2018-21 Lloyd Brookes \<75pound@gmail.com\>.

