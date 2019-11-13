[![view on npm](https://img.shields.io/npm/v/@test-runner/web.svg)](https://www.npmjs.org/package/@test-runner/web)
[![npm module downloads](https://img.shields.io/npm/dt/@test-runner/web.svg)](https://www.npmjs.org/package/@test-runner/web)
[![Build Status](https://travis-ci.org/test-runner-js/web-runner.svg?branch=master)](https://travis-ci.org/test-runner-js/web-runner)
[![Dependency Status](https://badgen.net/david/dep/test-runner-js/web-runner)](https://david-dm.org/test-runner-js/web-runner)
[![Coverage Status](https://coveralls.io/repos/github/test-runner-js/web-runner/badge.svg)](https://coveralls.io/github/test-runner-js/web-runner)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

# @test-runner/web

Runs the supplied test-object-model instance in the browser (Chromium).

```
$ web-runner <tom file>
```

## Synopsis

Example of an isomorphic test object model. This file will run natively without transpilation in both Nodejs and the browser.

```js
import Tom from './node_modules/test-object-model/dist/index.mjs'
import arrayify from './index.mjs'
import getAssert from './node_modules/isomorphic-assert/index.mjs'

async function getTom () {
  const a = await getAssert()
  const tom = new Tom('array-back')

  tom.test('arrayify()', function () {
    a.deepEqual(arrayify(undefined), [])
    a.deepEqual(arrayify(null), [null])
    a.deepEqual(arrayify(0), [0])
    a.deepEqual(arrayify([1, 2]), [1, 2])
    a.deepEqual(arrayify(new Set([1, 2])), [1, 2])
  })

  return tom
}

export default getTom()
```

Example output.

```
$ web-runner test.mjs


Start: 2 tests loaded

 ✓ array-back if already array, do nothing
 ✓ array-back arrayify()

Completed in 16ms. Pass: 2, fail: 0, skip: 0.
```

* * *

&copy; 2018-19 Lloyd Brookes \<75pound@gmail.com\>.
