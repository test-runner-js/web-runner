import tom from '../test/fixture/one.mjs'
import TestRunner from '../node_modules/test-runner-core/dist/index.mjs'
import DefaultView from '../node_modules/@test-runner/default-view/dist/index.mjs'
const π = document.createElement.bind(document)
const $ = document.querySelector.bind(document)

const runner = new TestRunner(tom, { view: new DefaultView() })
const testRunnerEl = π('test-runner')
$('body').appendChild(testRunnerEl)
testRunnerEl.setRunner(runner)
setTimeout(() => runner.start(), 1000)
