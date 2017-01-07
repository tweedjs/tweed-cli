export default class Builder {
  constructor (chalk, process, path, fs, { compilers, buildSystems, testRunners }) {
    this._chalk = chalk
    this._process = process
    this._path = path
    this._fs = fs
    this.compilers = compilers
    this.buildSystems = buildSystems
    this.testRunners = testRunners
  }

  log (...args) {
    console.log(...args.map((message) => {
      switch (typeof message) {
        case 'string':
          if (this._chalk.hasColor(message)) {
            return message
          }
          return this._chalk.green(message)

        case 'number':
          return this._chalk.red(message)

        case 'boolean':
          return this._chalk.magenta(message)

        default:
          return message
      }
    }))
  }

  logFine (verbose, ...args) {
    verbose && this.log(...args)
  }

  async build ({
    verbose,
    directory,
    name,
    compiler,
    buildSystem,
    backup,
    testRunner,
    program
  }) {
    const log = this.log.bind(this)
    log.fine = this.logFine.bind(this, verbose)

    await this._makeDirectory(directory, log)

    if (backup) {
      await this._backUpDirectory(directory, log)
    }

    try {
      await this._installBase(log)

      if (compiler != null) {
        await compiler.install(log)
      }

      if (buildSystem != null) {
        await buildSystem.install(log)
      }

      if (testRunner != null) {
        await testRunner.install(log)
      }

      log('Done!', this._chalk.gray(this._startCommand(buildSystem, directory)))
    } catch (e) {
      const lines = [
        'There was an error.'
      ]

      if (backup) {
        lines.push('The original directory is available at ' + directory + '.old')
      }

      lines.push(e.stack)

      program.abort(lines.join('\n\n'))
    }
  }

  _startCommand (buildSystem, directory) {
    const cwd = this._process.cwd()

    return [
      directory === cwd ? null : 'cd ' + this._path.relative(cwd, directory),
      buildSystem ? buildSystem.commands.dev : null
    ].filter((p) => p != null).join('; ')
  }

  async _makeDirectory (directory, log) {
    log.fine('Making sure', directory, 'exists')

    const exists = await this._fs.exists(directory)

    if (exists) {
      log.fine('The directory exists')
      return
    }

    log.fine('Creating the directory')

    await this._fs.makeDirectory(directory)

    log('Created', directory)
  }

  async _backUpDirectory (directory, log) {
    log.fine('Backing up', directory, 'to', directory + '.old')

    await this._fs.copy(directory, directory + '.old')

    log('Backing up', directory, 'to', directory + '.old')
  }

  _installBase (log) {
    log.fine('Installing Tweed')
  }
}
