export default class MakeBuildSystem {
  id = 'make'
  name = 'Makefile'
  commands = {
    dev: 'make dev'
  }

  async install (log) {
    log('Installing make')
  }
}
