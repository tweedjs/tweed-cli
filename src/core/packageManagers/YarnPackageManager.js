export default class YarnPackageManager {
  constructor (console) {
    this._console = console
  }

  _exec (pwd, args) {
    return this._console.execute('yarn', args, { pwd })
  }

  install (packageName, { pwd, dev }) {
    return this._exec(pwd, [
      'add',
      ...(dev ? ['--dev'] : []),
      ...(typeof packageName === 'string'
        ? [packageName]
        : packageName
      )
    ])
  }
}
