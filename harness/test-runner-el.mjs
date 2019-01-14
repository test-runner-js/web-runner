import dommo from '../node_modules/dommo/index.mjs'
const π = document.createElement.bind(document)

class TestRunnerEl extends HTMLElement {
  connectedCallback () {
    this.innerHTML = `<header>
      <runner><name></name> <state></state></runner>
    </header>
    <tom-container></tom-container>`
    this.dom = {
      tomContainer: this.querySelector('tom-container'),
      runner: this.querySelector('runner')
    }
  }
  setRunner (runner) {
    this.dom.runner.children[0].textContent = runner.name || 'test runner'
    runner.on('start', count => {
      this.runnerStart(runner)
    })
    runner.on('state', state => {
      // if (state !== 'end') {
        this.dom.runner.children[1].textContent = state
        this.dom.runner.setAttribute('state', state)
      // }
    })
  }

  runnerStart (runner) {
    this.loadTom(runner.tom)
    console.log('GO')
  }

  loadTom (tom) {
    for (const test of tom) {
      const tomEl = dommo(`<tom><span>${test.name}</span> <span></span></tom>`)
      tomEl.style.marginLeft = `${test.level()}em`
      test.on('state', (state, test) => {
        console.log(test)
        tomEl.children[1].textContent = state
        tomEl.setAttribute('state', state)
      })
      this.dom.tomContainer.appendChild(tomEl)
    }
  }
}

customElements.define('test-runner', TestRunnerEl)

export default TestRunnerEl
