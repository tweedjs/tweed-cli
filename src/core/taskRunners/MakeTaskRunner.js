export default class MakeTaskRunner {
  id = 'make'
  name = 'Makefile'
  commands = {}

  constructor (logger, fs, path) {
    this._logger = logger
    this._fs = fs
    this._path = path
  }

  add (taskName, command) {
    this.commands[taskName] = command
  }

  usage (command) {
    return `make ${command}`
  }

  async install (directory) {
    const makefile = this._path.resolve(directory, 'Makefile')

    if (await this._fs.exists(makefile)) {
      await this._fs.writeFile(makefile, [
        await this._fs.readFile(makefile),
        this._generate()
      ].join('\n\n'))
      return
    }

    await this._fs.writeFile(makefile, this._generate())
  }

  _generate () {
    return Object.keys(this.commands)
      .map(
        (command) => [
          `.PHONY: ${command}`,
          `${command}:`,
          `\t${this.commands[command]}`
        ].join('\n')
      )
      .join('\n\n')
  }
}
