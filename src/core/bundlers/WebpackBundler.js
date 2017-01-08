export default class WebpackBundler {
  id = 'webpack'
  name = 'Webpack'

  constructor (logger, fs, path) {
    this._logger = logger
    this._fs = fs
    this._path = path
  }

  async install (directory, packageManager, compiler, taskRunner) {
    packageManager.install('webpack', { dev: true })

    let config = {
      entry: "'./src/main'",
      output: {
        path: "resolve(__dirname, 'public')",
        filename: "'main.bundle.js'"
      }
    }

    if (compiler && compiler.manipulateWebpackConfig) {
      this._logger.fine(`Adding ${compiler.name} to Webpack config`)
      await compiler.manipulateWebpackConfig(config, packageManager)
    }

    config.plugins = "process.env.NODE_ENV === 'production'\n" +
      '    ? [\n' +
      '      new webpack.optimize.UglifyJsPlugin()\n' +
      '    ]\n' +
      '    : []'

    const json = JSON
      .stringify(config, null, 2)
      .replace(/"/g, '')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')

    const configString = [
      "const webpack = require('webpack')",
      "const { resolve } = require('path')",
      '',
      `module.exports = ${json}`,
      ''
    ].join('\n')

    const configFile = this._path.resolve(directory, 'webpack.config.js')

    this._logger.fine('Generating Webpack config file')
    await this._fs.writeFile(configFile, configString)

    if (taskRunner != null) {
      packageManager.install('webpack-dev-server', { dev: true })
      taskRunner.add('build', 'NODE_ENV=production webpack')
      taskRunner.add('dev', 'webpack-dev-server --inline --hot --content-base public/')
    }
  }
}
