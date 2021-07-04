import dommo from './node_modules/dommo/index.mjs'

class TestRunnerEl extends HTMLElement {
  connectedCallback () {
    this.innerHTML = `<header>
      <runner-name>test-runner</runner-name>
      <state-indicator state=""></state-indicator>
      <runner-state>in-progress</runner-state>
      <duration>duration: </duration>
    </header>
    <tom-container></tom-container>`
    this.$ = this.querySelector.bind(this)
    this.dom = {
      tomContainer: this.querySelector('tom-container'),
      runnerStateName: this.querySelector('runner-state'),
      runnerStateIndicator: this.querySelector('state-indicator')
    }
  }

  setRunner (runner) {
    this.dom.runnerStateName.textContent = runner.state
    this.dom.runnerStateIndicator.setAttribute('state', runner.state)
    this.loadTom(runner.tom)
    runner.on('state', state => {
      this.dom.runnerStateName.textContent = state
      this.dom.runnerStateIndicator.setAttribute('state', state)
    })
    runner.tom.on('state', state => {
      const seconds = ((Date.now() - runner.stats.start) / 1000).toFixed(2)
      this.$('duration').textContent = `duration: ${seconds}s`
    })
  }

  loadTom (tom) {
    for (const test of tom) {
      const tomEl = dommo(`<test-el>
        <state-indicator state="${test.state}"></state-indicator>
        <test-name>${test.name}</test-name>
        <details>
          <summary>Data</summary>
          <pre><code></code></pre>
        </details>
      </test-el>`)
      tomEl.style.paddingLeft = `${test.level()}em`
      test.on('state', function (state, prevState) {
        if (this !== test) return
        tomEl.children[0].setAttribute('state', state)
        tomEl.children[0].textContent = state
        if (this.context && this.context.data) {
          tomEl.querySelector('code').textContent = JSON.stringify(this.context.data, null, '  ')
          tomEl.children[2].dataset.hasData = true
        } else {
          delete tomEl.children[2].dataset.hasData
        }
      })

      test.on('fail', (test, err) => {
        tomEl.querySelector('code').textContent = `message: ${err.message}
actual: ${err.actual}
expected: ${err.expected}
stack: ${err.stack}`
        tomEl.children[2].dataset.hasData = true
        tomEl.querySelector('details').open = true
      })
      this.dom.tomContainer.appendChild(tomEl)
    }
  }
}

customElements.define('test-runner', TestRunnerEl)

export default TestRunnerEl
