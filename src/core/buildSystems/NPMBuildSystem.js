export default class NPMBuildSystem {
  id = 'npm'
  name = 'NPM scripts'
  commands = {
    dev: 'npm run dev'
  }

  async install (log) {
    log('Installing NPM scripts')
  }
}
