#!/usr/bin/env node

import 'regenerator-runtime/runtime'
import { Program, NewCommand, VersionCommand, HelpCommand } from '.'
import chalk from 'chalk'
import * as path from 'path'
import * as childProcess from 'child_process'
import input from 'inquirer'
import * as fs from 'node-fs-extra'
import * as jsonfile from 'jsonfile'
import commandExists from 'command-exists'
import ora from 'ora'

import FileSystem from './core/FileSystem'
import Console from './core/Console'
import Logger from './core/Logger'

import Builder from './core/Builder'

// Package Managers
import YarnPackageManager from './core/packageManagers/YarnPackageManager'
import NPMPackageManager from './core/packageManagers/NPMPackageManager'

// Compilers
import BabelCompiler from './core/compilers/BabelCompiler'
import TypeScriptCompiler from './core/compilers/TypeScriptCompiler'

// Task Runners
import NPMTaskRunner from './core/taskRunners/NPMTaskRunner'
import MakeTaskRunner from './core/taskRunners/MakeTaskRunner'

// Test Runners
import JestTestRunner from './core/testRunners/JestTestRunner'
import MochaTestRunner from './core/testRunners/MochaTestRunner'

// Bundlers
import WebpackBundler from './core/bundlers/WebpackBundler'

const logger = new Logger(chalk)
const filesystem = new FileSystem(logger, fs, path, jsonfile)
const console = new Console(logger, process, childProcess, commandExists)

const builder = new Builder(
  chalk,
  process,
  path,
  filesystem,
  console,
  logger,
  ora,
  {
    packageManagers: {
      yarn: new YarnPackageManager(console),
      npm: new NPMPackageManager(console)
    },
    compilers: [
      new BabelCompiler(logger, filesystem, path),
      new TypeScriptCompiler(logger, filesystem, path)
    ],
    taskRunners: [
      new NPMTaskRunner(logger, filesystem, path),
      new MakeTaskRunner(logger, filesystem, path)
    ],
    testRunners: [
      new JestTestRunner(logger),
      new MochaTestRunner(logger)
    ],
    bundlers: [
      new WebpackBundler(logger, filesystem, path)
    ]
  }
)

const cli = new Program(
  logger,
  chalk,
  new HelpCommand(chalk),
  new VersionCommand(chalk),
  [
    new NewCommand(path, process, chalk, input, filesystem, builder, console)
  ]
)

cli.execute(process.argv.slice(2))
