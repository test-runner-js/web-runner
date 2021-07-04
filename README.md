[![view on npm](https://badgen.net/npm/v/@test-runner/web)](https://www.npmjs.org/package/@test-runner/web)
[![npm module downloads](https://badgen.net/npm/dt/@test-runner/web)](https://www.npmjs.org/package/@test-runner/web)
[![Gihub repo dependents](https://badgen.net/github/dependents-repo/test-runner-js/web-runner)](https://github.com/test-runner-js/web-runner/network/dependents?dependent_type=REPOSITORY)
[![Gihub package dependents](https://badgen.net/github/dependents-pkg/test-runner-js/web-runner)](https://github.com/test-runner-js/web-runner/network/dependents?dependent_type=PACKAGE)
[![Node.js CI](https://github.com/test-runner-js/web-runner/actions/workflows/node.js.yml/badge.svg)](https://github.com/test-runner-js/web-runner/actions/workflows/node.js.yml)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

***This project and documentation are a work in progress***.

# @test-runner/web

Runs the supplied test suite in a headless browser (Chromium).

```
$ web-runner [<options>] file ...
```

## Synopsis

Example of an isomorphic [test model](https://github.com/test-runner-js/test-object-model). This file will run natively without transpilation in both Nodejs and the browser.

```js
import Tom from '@test-runner/tom'
import arrayify from './index.mjs'
import getAssert from 'isomorphic-assert'

const a = await getAssert()
const tom = new Tom('array-back')

tom.test('arrayify()', function () {
  a.deepEqual(arrayify(undefined), [])
  a.deepEqual(arrayify(null), [null])
  a.deepEqual(arrayify(0), [0])
  a.deepEqual(arrayify([1, 2]), [1, 2])
  a.deepEqual(arrayify(new Set([1, 2])), [1, 2])
})

export default tom
```

Example output.

```
$ web-runner test.mjs


Start: 2 tests loaded

 ✓ array-back if already array, do nothing
 ✓ array-back arrayify()

Completed in 16ms. Pass: 2, fail: 0, skip: 0.
```

## Install

```
$ npm install --save-dev @test-runner/web
```

* * *

&copy; 2019-21 Lloyd Brookes \<75pound@gmail.com\>.
