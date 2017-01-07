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
      '}'
    ].join('\n')
  }
}
