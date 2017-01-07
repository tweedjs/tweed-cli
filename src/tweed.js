#!/usr/bin/env node

import { Program, NewCommand, VersionCommand, HelpCommand } from '.'
import chalk from 'chalk'
import * as path from 'path'

const cli = new Program(
  chalk,
  new HelpCommand(chalk),
  new VersionCommand(chalk),
  [
    new NewCommand(path, process)
  ]
)

cli.execute(process.argv.slice(2))
