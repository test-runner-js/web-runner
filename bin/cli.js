#!/bin/sh
":" //# comment; exec /usr/bin/env node --no-warnings "$0" "$@"

const WebRunnerCli = require('../')
const cli = new WebRunnerCli()
cli.start().catch(err => {
  console.error(err.stack)
})
