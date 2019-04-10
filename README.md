[![view on npm](https://badgen.net/npm/v/@test-runner/web)](https://www.npmjs.com/package/@test-runner/web)
[![npm module downloads](https://badgen.net/npm/dt/@test-runner/web)](https://www.npmjs.com/package/@test-runner/web)
[![Build Status](https://travis-ci.org/test-runner-js/web-runner.svg?branch=master)](https://travis-ci.org/test-runner-js/web-runner)
[![Dependency Status](https://badgen.net/david/dep/test-runner-js/web-runner)](https://david-dm.org/test-runner-js/web-runner)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

# web-runner

Runs the supplied test-object-model instance in test-runner-core in the browser.

```
$ web-runner <tom file>
```

How to make a TOM file isomorphic and suitable for web-runner.

1. Ensure it is written using ES modules
	1. Use full module file paths
1. Load an assertion library e.g. chai.assert
1. Ensure `window.tom` is set

* * *

&copy; 2018-19 Lloyd Brookes \<75pound@gmail.com\>.
