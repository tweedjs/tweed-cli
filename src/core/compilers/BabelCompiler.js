export default class BabelCompiler {
  id = 'babel'
  name = 'Babel'
  extension = 'js'
  componentExtension = 'js'

  constructor (logger, fs, path) {
    this._logger = logger
    this._fs = fs
    this._path = path
  }

  async install (directory, packageManager, taskRunner) {
    packageManager.install(['babel-core', 'tweed-babel-config'], { dev: true })

    const rcFile = this._path.resolve(directory, '.babelrc')

    const rc = await this._fs.exists(rcFile)
      ? await this._fs.readJson(rcFile)
      : {}

    const tweedConfig = 'tweed-babel-config/config.json'

    if (typeof rc.extends === 'string') {
      rc.extends = [tweedConfig, rc.extends]
    } else if (Array.isArray(rc.extends)) {
      rc.extends = [tweedConfig, ...rc.extends]
    } else {
      rc.extends = tweedConfig
    }

    await this._fs.writeJson(rcFile, rc)
  }

  manipulateWebpackConfig (config, packageManager) {
    config.module = config.module || {}
    config.module.loaders = config.module.loaders || []

    config.module.loaders.push({
      loader: "'babel'",
      test: '/\\.jsx?$/',
      exclude: '/node_modules/'
    })

    packageManager.install('babel-loader', { dev: true })
  }

  async jestConfig (linter, directory, packageManager) {
    packageManager.install('babel-jest', { dev: true })

    await this._writeTestFile(
      linter,
      directory,
      '__tests__',
      'test',
      'expect',
      'toEqual'
    )
  }

  async mochaConfig (linter, directory, packageManager, taskRunner) {
    packageManager.install('babel-register', { dev: true })

    await this._writeTestFile(
      linter,
      directory,
      'test',
      'it',
      'expect',
      'to.deep.equal',
      "import { expect } from 'chai'"
    )

    if (taskRunner != null) {
      taskRunner.add('test', 'mocha --require babel-register')
    }
  }

  async _writeTestFile (linter, directory, testDir, test, expect, toEqual, head) {
    const testFile = this._path.resolve(directory, testDir, 'App.test.js')

    await this._fs.writeFile(testFile, [
      ...(linter && linter.jsxHeader ? [linter.jsxHeader, ''] : []),
      "import { Node } from 'tweed'",
      "import App from '../src/App'",
      ...(head ? [head] : []),
      '',
      "describe('App', () => {",
      `  ${test}('it works', () => {`,
      '    const app = new App()',
      '',
      `    ${expect}(app.render()).${toEqual}(`,
      '      <div>',
      "        <h1>Hello {'World'}</h1>",
      '        <input',
      "          value='World'",
      '          on-input={app._setName}',
      '        />',
      '      </div>',
      '    )',
      '',
      "    app.name = 'Changed'",
      '',
      `    ${expect}(app.render()).${toEqual}(`,
      '      <div>',
      "        <h1>Hello {'Changed'}</h1>",
      '        <input',
      "          value='Changed'",
      '          on-input={app._setName}',
      '        />',
      '      </div>',
      '    )',
      '  })',
      '})',
      ''
    ].join('\n'))
  }

  async main () {
    return [
      "import render from 'tweed/render/dom'",
      '',
      "import App from './App'",
      '',
      "render(new App(), document.querySelector('#app'))",
      ''
    ].join('\n')
  }

  async app (linter) {
    return [
      ...(linter && linter.jsxHeader ? [linter.jsxHeader, ''] : []),
      "import { mutating, Node } from 'tweed'",
      '',
      'export default class App {',
      "  @mutating name = 'World'",
      '',
      '  constructor () {',
      '    this._setName = this._setName.bind(this)',
      '  }',
      '',
      '  _setName (event) {',
      '    this.name = event.target.value',
      '  }',
      '',
      '  render () {',
      '    return (',
      '      <div>',
      '        <h1>Hello {this.name}</h1>',
      '        <input',
      '          value={this.name}',
      '          on-input={this._setName}',
      '        />',
      '      </div>',
      '    )',
      '  }',
      '}',
      ''
    ].join('\n')
  }
}
