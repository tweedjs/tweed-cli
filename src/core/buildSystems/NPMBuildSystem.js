export default class NPMBuildSystem {
  id = 'npm'
  name = 'NPM scripts'
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
    return `npm run ${command}`
  }

  async install (directory) {
    const packageJson = this._path.resolve(directory, 'package.json')

    const json = await this._fs.readJson(packageJson)

    json.scripts = json.scripts || {}

    for (const name in this.commands) {
      if (typeof json.scripts[name] === 'string') {
        json.scripts[name] += ' && ' + this.commands[name]
      } else {
        json.scripts[name] = this.commands[name]
      }
    }

    await this._fs.writeJson(packageJson, json)
  }
}
