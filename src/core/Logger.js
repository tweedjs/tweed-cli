export default class Logger {
  constructor (chalk) {
    this._chalk = chalk
    this.verbose = false
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

  fine (...args) {
    if (this.verbose) {
      this.log(...args)
    }
  }
}
