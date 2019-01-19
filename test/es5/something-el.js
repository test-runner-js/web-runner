class SomethingEl extends HTMLElement {
  connectedCallback () {
    this.innerHTML = 'something'
  }
  one () {
    return 'one'
  }
}

customElements.define('something-el', SomethingEl)
