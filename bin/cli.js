#!/usr/bin/env node
const CliApp = require('../')
const cli = new CliApp()
cli.start().catch(err => {
  console.error(err.stack)
})
