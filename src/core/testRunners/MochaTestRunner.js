export default class MochaTestRunner {
  id = 'mocha'
  name = 'Mocha'

  constructor (logger) {
    this._logger = logger
  }

  async install () {
    const log = this._logger.log.bind(this._logger)
    log('Installing Mocha')
  }
}
