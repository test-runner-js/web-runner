import Tom from '@test-runner/tom'

const tom = new Tom()
tom.test('one', () => 1)
tom.test('fails', () => {
  throw new Error('broken')
})

export default tom
