import Tom from '@test-runner/tom'

const tom = new Tom()
tom.test('one', () => 1)
tom.test('two', () => 2)

export default tom
