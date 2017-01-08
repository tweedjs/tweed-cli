export default class TypeScriptCompiler {
  id = 'typescript'
  name = 'TypeScript'
  extension = 'ts'
  componentExtension = 'tsx'

  constructor (logger, fs, path) {
    this._logger = logger
    this._fs = fs
    this._path = path
  }

  async install (directory, packageManager, taskRunner) {
    packageManager.install(['typescript', 'tweed-typescript-config'], { dev: true })

    const tsconfigFile = this._path.resolve(directory, 'tsconfig.json')

    const tsconfig = await this._fs.exists(tsconfigFile)
      ? await this._fs.readJson(tsconfigFile)
      : {}

    const tweedConfig = './node_modules/tweed-typescript-config/config'

    if (typeof tsconfig.extends === 'string') {
      tsconfig.extends = [tweedConfig, tsconfig.extends]
    } else if (Array.isArray(tsconfig.extends)) {
      tsconfig.extends = [tweedConfig, ...tsconfig.extends]
    } else {
      tsconfig.extends = tweedConfig
    }

    tsconfig.compilerOptions = {}

    tsconfig.include = [
      'src/**/*.ts',
      'src/**/*.tsx'
    ]

    await this._fs.writeJson(tsconfigFile, tsconfig)
  }

  manipulateWebpackConfig (config, packageManager) {
    config.module = config.module || {}
    config.module.loaders = config.module.loaders || []

    config.module.loaders.push({
      loader: "'ts'",
      test: '/\\.tsx?$/',
      exclude: '/node_modules/'
    })

    packageManager.install('ts-loader', { dev: true })
  }

  async jestConfig (linter, directory, packageManager) {
    packageManager.install(['ts-jest', '@types/jest'], { dev: true })

    const packageJson = this._path.resolve(directory, 'package.json')

    const pkg = await this._fs.readJson(packageJson)

    pkg.jest = {
      transform: {
        '^.+\\.(ts|tsx)$': '<rootDir>/node_modules/ts-jest/preprocessor.js'
      },
      testRegex: '/__tests__/.*\\.(ts|tsx|js)$',
      moduleFileExtensions: [ 'ts', 'tsx', 'js' ]
    }

    await this._fs.writeJson(packageJson, pkg)

    await this._writeTestFile(
      directory,
      'App.test.tsx',
      '__tests__',
      'test',
      'expect',
      'toEqual'
    )
  }

  async mochaConfig (linter, directory, packageManager, taskRunner) {
    packageManager.install(['ts-node', '@types/mocha', '@types/chai'], { dev: true })

    await this._writeTestFile(
      directory,
      'AppTest.tsx',
      'test',
      'it',
      'expect',
      'to.deep.equal',
      "import { expect } from 'chai'"
    )

    if (taskRunner != null) {
      taskRunner.add('test', 'mocha --require ts-node/register test/**/*.ts*')
    }
  }

  async _writeTestFile (directory, filename, testDir, test, expect, toEqual, head) {
    const testFile = this._path.resolve(directory, testDir, filename)

    await this._fs.writeFile(testFile, [
      ...(head ? [head] : []),
      "import { Node } from 'tweed'",
      "import App from '../src/App'",
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
      "import { Engine } from 'tweed'",
      "import DOMRenderer from 'tweed/render/dom'",
      '',
      "import App from './App'",
      '',
      'const engine = new Engine(',
      "  new DOMRenderer(document.querySelector('#app'))",
      ')',
      '',
      'engine.render(new App())',
      ''
    ].join('\n')
  }

  async app () {
    return [
      "import { mutating, Node } from 'tweed'",
      '',
      'export default class App {',
      "  @mutating name = 'World'",
      '',
      '  constructor () {',
      '    this._setName = this._setName.bind(this)',
      '  }',
      '',
      '  _setName (event: Event): void {',
      '    this.name = (event.target as HTMLInputElement).value',
      '  }',
      '',
      '  render (): Node {',
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
