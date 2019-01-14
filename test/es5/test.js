const a = chai.assert
const π = document.createElement.bind(document)
const tom = new Tom()

tom.test('fetch something 1', async function () {
  await sleep(2000)
  return true
})
tom.test('fetch something 2', async function () {
  await sleep(100)
  a.strictEqual(1, 1)
})
tom.test('fetch something 4', async function () {
  await sleep(4000)
  const el = π('something-el')
  a.strictEqual(el.one(), 'one')
  a.ok(!el.innerHTML)
  document.body.append(el)
  a.strictEqual(el.innerHTML, 'something')
})
tom.test('this fails', async function () {
  await sleep(3000)
  throw new Error('broken')
})

window.tom = tom
