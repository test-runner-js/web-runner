/**
 * @param {string} html
 * @param {object} [options]
 * @param {object} [options.document]
 * @param {string} [options.parentEl]
 */
function domify (html, options) {
  options = Object.assign({}, {
    document: typeof document === 'undefined' ? undefined : document,
    parentEl: 'container'
  }, options);
  const div = options.document.createElement(options.parentEl);
  div.innerHTML = html.trim();
  if (div.childNodes.length === 1) {
    return div.firstChild
  } else {
    const frag = options.document.createDocumentFragment();
    Array.from(div.childNodes).forEach(function (childNode) {
      frag.appendChild(childNode);
    });
    return frag
  }
}

class TestRunnerEl extends HTMLElement {
  connectedCallback () {
    this.innerHTML = `<header>
      <runner-name>test-runner</runner-name>
      <state-indicator state=""></state-indicator>
      <runner-state>in-progress</runner-state>
      <duration>duration: </duration>
    </header>
    <tom-container></tom-container>`;
    this.$ = this.querySelector.bind(this);
    this.dom = {
      tomContainer: this.querySelector('tom-container'),
      runnerStateName: this.querySelector('runner-state'),
      runnerStateIndicator: this.querySelector('state-indicator')
    };
  }

  setRunner (runner) {
    this.dom.runnerStateName.textContent = runner.state;
    this.dom.runnerStateIndicator.setAttribute('state', runner.state);
    this.loadTom(runner.tom);
    runner.on('state', state => {
      this.dom.runnerStateName.textContent = state;
      this.dom.runnerStateIndicator.setAttribute('state', state);
    });
    runner.tom.on('state', state => {
      const seconds = ((Date.now() - runner.stats.start) / 1000).toFixed(2);
      this.$('duration').textContent = `duration: ${seconds}s`;
    });
  }

  loadTom (tom) {
    for (const test of tom) {
      const tomEl = domify(`<test-el>
        <state-indicator state="${test.state}"></state-indicator>
        <test-name>${test.name}</test-name>
        <details>
          <summary>Data</summary>
          <pre><code></code></pre>
        </details>
      </test-el>`);
      tomEl.style.paddingLeft = `${test.level()}em`;
      test.on('state', function (state, prevState) {
        if (this !== test) return
        tomEl.children[0].setAttribute('state', state);
        tomEl.children[0].textContent = state;
        if (this.context && this.context.data) {
          tomEl.querySelector('code').textContent = JSON.stringify(this.context.data, null, '  ');
          tomEl.children[2].dataset.hasData = true;
        } else {
          delete tomEl.children[2].dataset.hasData;
        }
      });

      test.on('fail', (test, err) => {
        tomEl.querySelector('code').textContent = `message: ${err.message}
actual: ${err.actual}
expected: ${err.expected}
stack: ${err.stack}`;
        tomEl.children[2].dataset.hasData = true;
        tomEl.querySelector('details').open = true;
      });
      this.dom.tomContainer.appendChild(tomEl);
    }
  }
}

customElements.define('test-runner', TestRunnerEl);

export default TestRunnerEl;
