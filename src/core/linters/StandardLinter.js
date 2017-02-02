class StandardJS {
  jsxHeader = '/** @jsx Node */'
  packageName = 'standard'

  modifyPackageJson (pkg, compiler, testRunner, packageManager) {
    pkg.standard = {}

    if (compiler && compiler.id === 'babel') {
      packageManager.install('babel-eslint', { dev: true })

      pkg.standard.parser = 'babel-eslint'
    }

    if (testRunner && testRunner.globals) {
      pkg.standard.globals = testRunner.globals
    }
  }
}

class StandardTS {
  jsxHeader = null
  packageName = 'standardts'

  modifyPackageJson () {}
}

export default class StandardLinter {
  id = 'standard'
  name = 'Standard Style'

  constructor (logger, fs, path) {
    this._logger = logger
    this._fs = fs
    this._path = path
  }

  async install (directory, packageManager, taskRunner, compiler, testRunner) {
    this._logger.fine('Installing Standard Style linter')

    const implementation = compiler && compiler.id === 'typescript'
      ? new StandardTS()
      : new StandardJS()

    this.jsxHeader = implementation.jsxHeader

    packageManager.install(implementation.packageName, { dev: true })

    const packageJson = this._path.resolve(directory, 'package.json')
    const pkg = await this._fs.readJson(packageJson)

    implementation.modifyPackageJson(pkg, compiler, testRunner, packageManager)

    if (pkg.standard && Object.keys(pkg.standard).length > 0) {
      await this._fs.writeJson(packageJson, pkg)
    }

    if (taskRunner) {
      if (taskRunner.commands.test != null) {
        taskRunner.add('test', implementation.packageName + ' && ' + taskRunner.commands.test)
      } else {
        taskRunner.add('test', implementation.packageName)
      }
    }
  }
}
