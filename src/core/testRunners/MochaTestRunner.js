export default class MochaTestRunner {
  id = 'mocha'
  name = 'Mocha'

  constructor (logger, fs, path) {
    this._logger = logger
    this._fs = fs
    this._path = path
  }

  async install (directory, packageManager, compiler, taskRunner) {
    packageManager.install(['mocha', 'chai'], { dev: true })

    const testDir = this._path.resolve(directory, 'test')
    await this._fs.makeDirectory(testDir)

    if (taskRunner != null) {
      taskRunner.add('test', 'mocha')
    }

    if (compiler && compiler.mochaConfig) {
      await compiler.mochaConfig(directory, packageManager, taskRunner)
    } else {
      const testFile = this._path.resolve(testDir, 'AppTest.js')
      await this._fs.writeFile(testFile, this._appTest())
    }
  }

  _appTest () {
    return [
      "const { expect } = require('chai')",
      "const { Node } = require('tweed')",
      "const App = require('../src/App')",
      '',
      "describe('App', () => {",
      "  it('it works', () => {",
      '    const app = new App()',
      '',
      '    expect(app.render()).to.deep.equal(',
      "      Node('div', {},",
      "        Node('h1', {}, 'Hello World'),",
      "        Node('input', {",
      "          value: 'World',",
      "          'on-input': app._setName",
      '        })',
      '      )',
      '    )',
      '',
      "    app.name = 'Changed'",
      '',
      '    expect(app.render()).to.deep.equal(',
      "      Node('div', {},",
      "        Node('h1', {}, 'Hello Changed'),",
      "        Node('input', {",
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
