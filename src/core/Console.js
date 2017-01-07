export default class Console {
  constructor (logger, process, childProcess, commandExists) {
    this._logger = logger
    this._process = process
    this._childProcess = childProcess
    this._commandExists = commandExists
  }

  commandExists (cli) {
    this._logger.fine('Checking if', cli, 'is installed')
    return new Promise((resolve, reject) => {
      this._commandExists(cli, (err, exists) => {
        if (err) {
          reject(err)
        } else {
          resolve(exists)
        }
      })
    })
  }

  execute (command, args, { pwd, showOutput }) {
    if (showOutput == null) {
      showOutput = this._logger.verbose
    }

    return new Promise((resolve, reject) => {
      this._logger.fine(`Executing '${[command, ...args].join(' ')}'`)
      const process = this._childProcess.spawn(command, args, { cwd: pwd })

      if (showOutput) {
        process.stdout.pipe(this._process.stdout)
        process.stderr.pipe(this._process.stderr)
      }

      process.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(
            `The '${command}' command exited with the status code ${code}`
          ))
        }
      })
    })
  }
}
