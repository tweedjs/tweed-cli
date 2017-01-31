export default class Builder {
  constructor (chalk, process, path, fs, console, logger, spinner, { packageManagers, compilers, taskRunners, testRunners, bundlers, linters }) {
    this._chalk = chalk
    this._process = process
    this._path = path
    this._fs = fs
    this._console = console
    this._logger = logger
    this._spinner = spinner
    this.packageManagers = packageManagers
    this.compilers = compilers
    this.taskRunners = taskRunners
    this.testRunners = testRunners
    this.bundlers = bundlers
    this.linters = linters
  }

  async build ({
    directory,
    name,
    compiler,
    taskRunner,
    linter,
    backup,
    testRunner,
    bundler,
    program,
    packageManager
  }) {
    this._startSpinner(`Crafting ${name}...`)

    await this._makeDirectory(directory)

    if (backup) {
      await this._backUpDirectory(directory)
    }

    try {
      await this._installBase(name, directory, packageManager, compiler, linter)

      if (compiler != null) {
        await compiler.install(directory, packageManager, taskRunner)
      }

      if (bundler != null) {
        await bundler.install(directory, packageManager, compiler, taskRunner)
      }

      if (testRunner != null) {
        await testRunner.install(directory, packageManager, compiler, taskRunner, linter)
      }

      if (linter != null) {
        await linter.install(directory, packageManager, taskRunner, compiler, testRunner)
      }

      if (taskRunner != null) {
        await taskRunner.install(directory)
      }

      await packageManager.flush(directory)

      this._stopSpinner()

      this._logger.log('Done!', this._chalk.gray(this._startCommand(taskRunner, directory)))
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

  _startCommand (taskRunner, directory) {
    const cwd = this._process.cwd()

    return [
      directory === cwd ? null : 'cd ' + this._path.relative(cwd, directory),
      taskRunner && 'dev' in taskRunner.commands
        ? taskRunner.usage('dev')
        : null
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

  async _installBase (name, directory, packageManager, compiler, linter) {
    const packageJson = this._path.resolve(directory, 'package.json')
    const gitignore = this._path.resolve(directory, '.gitignore')
    const src = this._path.resolve(directory, 'src')
    const publicDir = this._path.resolve(directory, 'public')
    const indexHtml = this._path.resolve(publicDir, 'index.html')
    const ext = compiler && compiler.extension || 'js'
    const mainFileName = `main.${ext}`
    const main = this._path.resolve(src, mainFileName)
    const compExt = compiler && compiler.componentExtension || 'js'
    const appFileName = `App.${compExt}`
    const app = this._path.resolve(src, appFileName)

    if (!(await this._fs.exists(packageJson))) {
      this._logger.fine('Creating a package.json file')
      const pkg = {
        name,
        version: '0.0.0'
      }
      await this._fs.writeFile(packageJson, JSON.stringify(pkg, null, 2) + '\n')
    }

    if (!(await this._fs.exists(gitignore))) {
      this._logger.fine('Creating a .gitignore file')
      await this._fs.writeFile(gitignore, [
        '/node_modules/',
        '/public/main.bundle.js',
        ''
      ].join('\n'))
    }

    if (!(await this._fs.exists(src))) {
      this._logger.fine('Creating src directory')
      await this._fs.makeDirectory(src)
    }

    if (!(await this._fs.exists(main))) {
      this._logger.fine(`Creating src/${mainFileName}`)
      await this._fs.writeFile(main, compiler && await compiler.main(linter) || await this._main())
    }

    if (!(await this._fs.exists(app))) {
      this._logger.fine(`Creating src/${appFileName}`)
      await this._fs.writeFile(app, compiler && await compiler.app(linter) || await this._app())
    }

    if (!(await this._fs.exists(publicDir))) {
      this._logger.fine('Creating public directory')
      await this._fs.makeDirectory(publicDir)
    }

    if (!(await this._fs.exists(indexHtml))) {
      this._logger.fine(`Creating src/index.html`)
      await this._fs.writeFile(indexHtml, await this._indexHtml())
    }

    packageManager.install('tweed')
    packageManager.install('babel-runtime')
    packageManager.install('babel-polyfill')
  }

  async _main () {
    return [
      "'use strict'",
      '',
      "var render = require('tweed/render/dom').default",
      '',
      "var App = require('./App')",
      '',
      "engine.render(new App(), document.querySelector('#app'))",
      ''
    ].join('\n')
  }

  async _app () {
    return [
      "'use strict'",
      '',
      "var Tweed = require('tweed')",
      'var n = Tweed.Node',
      '',
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
      "    n('div', {},",
      "      n('h1', {}, 'Hello ' + this.name),",
      "      n('input', {",
      '        value: this.name,',
      '        on: {',
      '          input: this._setName',
      '        }',
      '      })',
      '    )',
      '  )',
      '}',
      '',
      'module.exports = App',
      ''
    ].join('\n')
  }

  _indexHtml () {
    return [
      '<!DOCTYPE html>',
      "<html lang='en'>",
      '  <head>',
      "    <meta charset='utf-8'>",
      "    <meta http-equiv='x-ua-compatible' content='ie=edge'>",
      "    <meta name='viewport' content='width=device-width, initial-scale=1'>",
      '  </head>',
      '  <body>',
      "    <div id='app'>Loading...</div>",
      "    <script src='main.bundle.js'></script>",
      '  </body>',
      '</html>',
      ''
    ].join('\n')
  }
}
