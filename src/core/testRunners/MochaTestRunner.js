export default class MochaTestRunner {
  id = 'mocha'
  name = 'Mocha'
  globals = [
    'afterEach',
    'beforeEach',
    'afterAll',
    'beforeAll',
    'describe',
    'it'
  ]

  constructor (logger, fs, path) {
    this._logger = logger
    this._fs = fs
    this._path = path
  }

  async install (directory, packageManager, compiler, taskRunner, linter) {
    packageManager.install(['mocha', 'chai'], { dev: true })

    const testDir = this._path.resolve(directory, 'test')
    await this._fs.makeDirectory(testDir)

    if (taskRunner != null) {
      taskRunner.add('test', 'mocha')
    }

    if (compiler && compiler.mochaConfig) {
      await compiler.mochaConfig(linter, directory, packageManager, taskRunner)
    } else {
      const testFile = this._path.resolve(testDir, 'AppTest.js')
      await this._fs.writeFile(testFile, this._appTest())
    }
  }

  _appTest () {
    return [
      "const { expect } = require('chai')",
      "const { Node: n } = require('tweed')",
      "const App = require('../src/App')",
      '',
      "describe('App', () => {",
      "  it('it works', () => {",
      '    const app = new App()',
      '',
      '    expect(app.render()).to.deep.equal(',
      "      n('div', {},",
      "        n('h1', {}, 'Hello World'),",
      "        n('input', {",
      "          value: 'World',",
      "          'on-input': app._setName",
      '        })',
      '      )',
      '    )',
      '',
      "    app.name = 'Changed'",
      '',
      '    expect(app.render()).to.deep.equal(',
      "      n('div', {},",
      "        n('h1', {}, 'Hello Changed'),",
      "        n('input', {",
      "          value: 'Changed',",
      "          'on-input': app._setName",
      '        })',
      '      )',
      '    )',
      '  })',
      '})'
    ].join('\n')
  }
}
