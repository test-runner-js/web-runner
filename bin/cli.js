#!/usr/bin/env node
const WebRunnerCli = require('../')
const cli = new WebRunnerCli()
cli.start().catch(err => {
  console.error(err.stack)
})
