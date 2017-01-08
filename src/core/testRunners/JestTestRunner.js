export default class JestTestRunner {
  id = 'jest'
  name = 'Jest'
  globals = [
    'afterEach',
    'beforeEach',
    'afterAll',
    'beforeAll',
    'describe',
    'expect',
    'it',
    'fit',
    'jest',
    'test',
    'xdescribe',
    'fdescribe',
    'xit',
    'xtest'
  ]

  constructor (logger, fs, path) {
    this._logger = logger
    this._fs = fs
    this._path = path
  }

  async install (directory, packageManager, compiler, taskRunner, linter) {
    packageManager.install('jest', { dev: true })

    const testDir = this._path.resolve(directory, '__tests__')
    await this._fs.makeDirectory(testDir)

    if (taskRunner != null) {
      taskRunner.add('test', 'jest')
    }

    if (compiler && compiler.jestConfig) {
      await compiler.jestConfig(linter, directory, packageManager)
    } else {
      const testFile = this._path.resolve(testDir, 'App.test.js')
      await this._fs.writeFile(testFile, this._appTest())
    }
  }

  _appTest () {
    return [
      "const { Node: n } = require('tweed')",
      "const App = require('../src/App')",
      '',
      "describe('App', () => {",
      "  test('it works', () => {",
      '    const app = new App()',
      '',
      '    expect(app.render()).toEqual(',
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
      '    expect(app.render()).toEqual(',
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
