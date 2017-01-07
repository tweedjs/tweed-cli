export default class Program {
  constructor (chalk, helpCommand, versionCommand, commands) {
    this._chalk = chalk
    this._helpCommand = helpCommand
    this._versionCommand = versionCommand
    this.commands = commands.concat(versionCommand, helpCommand)
  }

  execute (argv) {
    const request = this._parseRequest(argv)

    request.command.execute(request.options, this)
  }

  _parseRequest (argv) {
    argv = Array.prototype.slice.call(argv)

    let request = {
      command: null,
      options: {
        verbose: false
      }
    }

    this.request = request

    while (argv.length > 0) {
      if (argv[0] === '-V' && request.command == null) {
        request.command = this._versionCommand
        argv.shift()
        continue
      }

      switch (argv[0]) {
        case '-v':
          request.options.verbose = true
          argv.shift()
          break

        case '-h':
        case '--help':
        case '-?':
        case '--?':
          argv.shift()
          request.options.command = request.command
          request.command = this._helpCommand
          break

        default:
          if (request.command != null) {
            const [forward, patch] = request.command.parseOption(argv, this)

            if (forward > 0) {
              Object.assign(request.options, patch)
              argv = argv.slice(forward)
              break
            }
          } else {
            const command = this._findCommand(argv[0])

            if (command != null) {
              request.command = command
              Object.assign(request.options, command.initialOptions || {})
              argv.shift()
              break
            }
          }

          this.abort(`Unexpected option '${argv[0]}'`)
      }
    }

    if (request.command == null) {
      request.command = this._helpCommand
    }

    return request
  }

  _findCommand (name) {
    return this.commands
      .filter((c) => c.name === name)[0]
  }

  abort (message) {
    if (this._chalk.hasColor(message)) {
      console.error(message)
    } else {
      console.error(this._chalk.red(message))
    }
    process.exit(1)
  }
}
