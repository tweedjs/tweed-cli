export default class StandardLinter {
  id = 'standard'
  name = 'Standard Style'
  jsxHeader = '/** @jsx Node */'

  constructor (logger, fs, path) {
    this._logger = logger
    this._fs = fs
    this._path = path
  }

  async install (directory, packageManager, taskRunner, compiler, testRunner) {
    this._logger.fine('Installing Standard Style linter')

    packageManager.install('standard', { dev: true })

    const packageJson = this._path.resolve(directory, 'package.json')
    const pkg = await this._fs.readJson(packageJson)

    pkg.standard = {}

    if (compiler && compiler.id === 'babel') {
      packageManager.install('babel-eslint', { dev: true })

      pkg.standard.parser = 'babel-eslint'
    }

    if (testRunner && testRunner.globals) {
      pkg.standard.globals = testRunner.globals
    }

    if (Object.keys(pkg.standard).length > 0) {
      await this._fs.writeJson(packageJson, pkg)
    }

    if (taskRunner == null) {
      return
    }

    if (taskRunner.commands.test != null) {
      taskRunner.add('test', 'standard && ' + taskRunner.commands.test)
    } else {
      taskRunner.add('test', 'standard')
    }
  }
}
