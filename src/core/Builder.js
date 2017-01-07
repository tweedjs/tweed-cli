export default class Builder {
  constructor (chalk, process, path, fs, console, logger, spinner, { packageManagers, compilers, buildSystems, testRunners }) {
    this._chalk = chalk
    this._process = process
    this._path = path
    this._fs = fs
    this._console = console
    this._logger = logger
    this._spinner = spinner
    this.packageManagers = packageManagers
    this.compilers = compilers
    this.buildSystems = buildSystems
    this.testRunners = testRunners
  }

  async build ({
    directory,
    name,
    compiler,
    buildSystem,
    backup,
    testRunner,
    program,
    packageManager
  }) {
    this._startSpinner(`Crafting ${name}...`)

    await this._makeDirectory(directory)

    if (backup) {
      await this._backUpDirectory(directory)
    }

    try {
      await this._installBase(directory, packageManager, compiler)

      if (compiler != null) {
        await compiler.install(directory, packageManager, buildSystem)
      }

      if (buildSystem != null) {
        await buildSystem.install(directory)
      }

      if (testRunner != null) {
        await testRunner.install(directory, packageManager)
      }

      this._stopSpinner()

      this._logger.log('Done!', this._chalk.gray(this._startCommand(buildSystem, directory)))
    } catch (e) {
      this._stopSpinner()

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

  _startSpinner (message) {
    if (!this._logger.verbose) {
      this.__spinner = this._spinner(message).start()
    }
  }

  _stopSpinner () {
    if (!this._logger.verbose) {
      this.__spinner.stop()
    }
  }

  _startCommand (buildSystem, directory) {
    const cwd = this._process.cwd()

    return [
      directory === cwd ? null : 'cd ' + this._path.relative(cwd, directory),
      buildSystem ? buildSystem.usage('dev') : null
    ].filter((p) => p != null).join('; ')
  }

  async _makeDirectory (directory) {
    const exists = await this._fs.exists(directory)

    if (exists) {
      this._logger.fine('The directory exists')
      return
    }

    this._logger.fine('Creating', directory)
    await this._fs.makeDirectory(directory)
  }

  async _backUpDirectory (directory) {
    this._logger.fine('Backing up', directory, 'to', directory + '.old')

    await this._fs.copy(directory, directory + '.old')

    this._logger.log('Backing up')
    this._logger.fine('Backing up to', directory + '.old')
  }

  async _installBase (directory, packageManager, compiler) {
    const packageJson = this._path.resolve(directory, 'package.json')
    const src = this._path.resolve(directory, 'src')
    const ext = compiler && compiler.extension || 'js'
    const mainFileName = `main.${ext}`
    const main = this._path.resolve(src, mainFileName)
    const compExt = compiler && compiler.componentExtension || 'js'
    const appFileName = `App.${compExt}`
    const app = this._path.resolve(src, appFileName)

    if (!(await this._fs.exists(packageJson))) {
      this._logger.fine('Creating an empty package.json file')
      await this._fs.writeFile(packageJson, '{}\n')
    }

    if (!(await this._fs.exists(src))) {
      this._logger.fine('Creating src directory')
      await this._fs.makeDirectory(src)
    }

    if (!(await this._fs.exists(main))) {
      this._logger.fine(`Creating src/${mainFileName}`)
      await this._fs.writeFile(main, compiler && await compiler.main() || await this._main())
    }

    if (!(await this._fs.exists(app))) {
      this._logger.fine(`Creating src/${appFileName}`)
      await this._fs.writeFile(app, compiler && await compiler.app() || await this._app())
    }

    await packageManager.install('tweed', { pwd: directory, dev: false })
  }

  async _main () {
    return [
      "'use strict'",
      '',
      "var Tweed = require('tweed')",
      "var DOMRenderer = require('tweed/render/dom').default",
      '',
      "var App = require('./App')",
      '',
      'var engine = new Tweed.Engine(',
      "  new DOMRenderer(document.querySelector('#app'))",
      ')',
      '',
      'engine.render(new App())'
    ].join('\n')
  }

  async _app () {
    return [
      "'use strict'",
      '',
      "var Tweed = require('tweed')",
      'var Node = Tweed.Node',
      '',
      'module.exports = App',
      'function App () {',
      "  this.name = 'World'",
      '',
      '  this._setName = this._setName.bind(this)',
      '}',
      '',
      "Tweed.mutating(App.prototype, 'name')",
      '',
      'App.prototype._setName = function (event) {',
      '  this.name = event.target.value',
      '}',
      '',
      'App.prototype.render = function () {',
      '  return (',
      "    Node('div', {},",
      "      Node('h1', {}, 'Hello ' + this.name)",
      "      Node('input', {",
      '        value: this.name,',
      "        'on-input': this._setName",
      '      })',
      '    )',
      '  )',
      '}'
    ].join('\n')
  }
}
