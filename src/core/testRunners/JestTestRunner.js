export default class JestTestRunner {
  id = 'jest'
  name = 'Jest'

  constructor (logger) {
    this._logger = logger
  }

  async install () {
    const log = this._logger.log.bind(this._logger)
    log('Installing Jest')
  }
}
