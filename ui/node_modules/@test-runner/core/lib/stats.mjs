/**
 * Stats object.
 */
class Stats {
  constructor () {
    /**
     * Total tests run.
     */
    this.total = 0
    /**
     * Runner start time.
     */
    this.startTime = 0
    /**
     * Runner end time.
     */
    this.endTime = 0
    this.pass = 0
    this.fail = 0
    this.skip = 0
    this.todo = 0
    this.ignore = 0
    this.inProgress = 0
  }

  timeElapsed () {
    return this.endTime - this.startTime
  }
}

export default Stats
