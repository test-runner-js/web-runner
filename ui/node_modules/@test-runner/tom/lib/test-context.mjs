/**
 * The test context, available as `this` within each test function.
 */
class TestContext {
  constructor (context) {
    /**
     * The name given to this test.
     */
    this.name = context.name
    /**
     * The test index within the current set.
     */
    this.index = context.index
    /**
     * Test run data.
     */
    this.data = undefined
  }
}

export default TestContext
