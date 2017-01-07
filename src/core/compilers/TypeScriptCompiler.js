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
      'engine.render(new App())'
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
      '}'
    ].join('\n')
  }
}
