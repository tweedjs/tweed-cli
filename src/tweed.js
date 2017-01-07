#!/usr/bin/env node

import 'regenerator-runtime/runtime'
import { Program, NewCommand, VersionCommand, HelpCommand } from '.'
import chalk from 'chalk'
import * as path from 'path'
import input from 'inquirer'
import * as fs from 'node-fs-extra'
import FileSystem from './core/FileSystem'

import Builder from './core/Builder'

// Compilers
import BabelCompiler from './core/compilers/BabelCompiler'
import TypeScriptCompiler from './core/compilers/TypeScriptCompiler'

// Build Systems
import NPMBuildSystem from './core/buildSystems/NPMBuildSystem'
import MakeBuildSystem from './core/buildSystems/MakeBuildSystem'

// Test Runners
import JestTestRunner from './core/testRunners/JestTestRunner'
import MochaTestRunner from './core/testRunners/MochaTestRunner'

const filesystem = new FileSystem(fs, path)

const builder = new Builder(
  chalk,
  process,
  path,
  filesystem,
  {
    compilers: [
      new BabelCompiler(),
      new TypeScriptCompiler()
    ],
    buildSystems: [
      new NPMBuildSystem(),
      new MakeBuildSystem()
    ],
    testRunners: [
      new JestTestRunner(),
      new MochaTestRunner()
    ]
  }
)

const cli = new Program(
  chalk,
  new HelpCommand(chalk),
  new VersionCommand(chalk),
  [
    new NewCommand(path, process, chalk, input, filesystem, builder)
  ]
)

cli.execute(process.argv.slice(2))
