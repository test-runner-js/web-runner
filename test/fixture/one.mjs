import Tom from '/node_modules/test-object-model/dist/index.mjs'

const tom = new Tom()
tom.test('one', () => 1)
tom.test('two', () => 2)

export default tom
