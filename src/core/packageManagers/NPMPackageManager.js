export default class NPMPackageManager {
  constructor (console) {
    this._console = console
  }

  _exec (pwd, args) {
    return this._console.execute('npm', args, { pwd })
  }

  install (packageName, { pwd, dev }) {
    return this._exec(pwd, [
      'install',
      dev ? '--save-dev' : '--save',
      ...(typeof packageName === 'string'
        ? [packageName]
        : packageName
      )
    ])
  }
}
