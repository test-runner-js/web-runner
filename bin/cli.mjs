#!/usr/bin/env node
import WebRunnerCli from '@test-runner/web'

const cli = new WebRunnerCli()
await cli.start()
