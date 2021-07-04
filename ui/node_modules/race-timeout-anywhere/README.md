[![view on npm](https://badgen.net/npm/v/race-timeout-anywhere)](https://www.npmjs.org/package/race-timeout-anywhere)
[![npm module downloads](https://badgen.net/npm/dt/race-timeout-anywhere)](https://www.npmjs.org/package/race-timeout-anywhere)
[![Gihub repo dependents](https://badgen.net/github/dependents-repo/75lb/race-timeout-anywhere)](https://github.com/75lb/race-timeout-anywhere/network/dependents?dependent_type=REPOSITORY)
[![Gihub package dependents](https://badgen.net/github/dependents-pkg/75lb/race-timeout-anywhere)](https://github.com/75lb/race-timeout-anywhere/network/dependents?dependent_type=PACKAGE)
[![Build Status](https://travis-ci.org/75lb/race-timeout-anywhere.svg?branch=master)](https://travis-ci.org/75lb/race-timeout-anywhere)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

# race-timeout-anywhere

An isomorphic, load-anywhere timeout function for use with `Promise.race`.

The `raceTimeout` function never resolves, it will only reject once the specified time period has elapsed. In the example below, `fetchDataSomehow()` must resolve before `raceTimeout` rejects after 1000ms, else a timeout exception is thrown.

```js
import raceTimeout from 'race-timeout-anywhere'

try {
  const data = await Promise.race([
    fetchDataSomehow(),
    raceTimeout(1000)
  ])
  /* fetchDataSomehow() took less than 1000ms, process data */
} catch (err) {
  /* fetchDataSomehow() took longer than 1000ms */
}
```


### Load anywhere

This library is compatible with Node.js, the Web and any style of module loader. It can be loaded anywhere, natively without transpilation.

CommonJS:

```js
const raceTimeout = require('race-timeout-anywhere')
```

ECMAScript Module:

```js
import raceTimeout from 'rice-timeout-anywhere'
```

Within a modern browser ECMAScript Module:

```js
import raceTimeout from './node_modules/rice-timeout-anywhere/index.mjs'
```

* * *

&copy; 2018-21 Lloyd Brookes \<75pound@gmail.com\>.
