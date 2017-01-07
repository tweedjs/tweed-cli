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

// Build Systems
import NPMBuildSystem from './core/buildSystems/NPMBuildSystem'
import MakeBuildSystem from './core/buildSystems/MakeBuildSystem'

// Test Runners
import JestTestRunner from './core/testRunners/JestTestRunner'
import MochaTestRunner from './core/testRunners/MochaTestRunner'

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
    buildSystems: [
      new NPMBuildSystem(logger, filesystem, path),
      new MakeBuildSystem(logger, filesystem, path)
    ],
    testRunners: [
      new JestTestRunner(logger),
      new MochaTestRunner(logger)
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
