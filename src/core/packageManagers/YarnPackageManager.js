export default class YarnPackageManager {
  _dependencies = []
  _devDependencies = []

  constructor (console) {
    this._console = console
  }

  _exec (pwd, args) {
    return this._console.execute('yarn', args, { pwd })
  }

  install (packageName, { dev = false } = {}) {
    if (dev) {
      this._devDependencies = this._devDependencies.concat(packageName)
    } else {
      this._dependencies = this._dependencies.concat(packageName)
    }
  }

  async flush (pwd) {
    await this._exec(pwd, [
      'add',
      ...this._dependencies
    ])

    if (this._devDependencies.length > 0) {
      await this._exec(pwd, [
        'add',
        '--dev',
        ...this._devDependencies
      ])
    }
  }
}
