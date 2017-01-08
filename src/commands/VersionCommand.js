export default class VersionCommand {
  name = 'version'
  description = 'Shows versions of installed Tweed packages.'
  usage = 'tweed [version|-V] [-v|--verbose]'
  options = []

  constructor (chalk) {
    this._chalk = chalk
  }

  parseOption () {
    return [0, null]
  }

  execute ({ verbose }, program) {
    if (!verbose) {
      const version = this._versionOf('tweed')

      if (version == null) {
        program.abort(
          this._chalk.red('Tweed is not installed.\n  ') +
          this._chalk.gray('$ npm install tweed')
        )
      }

      console.log(`v${version}`)
      return
    }

    const versions = {
      tweed: this._versionOf('tweed'),
      'tweed-cli': this._versionOf('tweed-cli'),
      'tweed-router': this._versionOf('tweed-router')
    }

    const nameWidth = Math.max(
      ...Object.keys(versions)
        .map((n) => n.length)
    )

    const output = Object.keys(versions)
      .map((name) => ({
        name: name + Array(nameWidth - name.length).fill(' ').join(''),
        version: versions[name]
      }))
      .map(({ name, version }) => ({
        name: this._chalk.green(name),
        version: version
          ? this._chalk.yellow('v' + version)
          : this._chalk.gray('not installed')
      }))
      .map(({ name, version }) => `${name}  ${version}`)
      .join('\n')

    console.log(output)
  }

  _versionOf (pkg) {
    try {
      return require(`${pkg}/package`).version
    } catch (e) {
      return null
    }
  }
}
