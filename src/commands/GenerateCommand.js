export default class GenerateCommand {
  name = 'generate'
  description = 'Generate files containing tedious boilerplate.'
  usage = 'tweed generate <classpath> [-m <field>[:<type>]] [-t]'
  initialOptions = {
    classpath: null,
    mutating: [],
    test: false
  }
  options = [
    ['-m, --mutating <field>[:<type>]', 'Add a mutating field to the component'],
    ['-t, --test', 'Generate a corresponding test file']
  ]

  constructor (chalk, logger, path, fs) {
    this._chalk = chalk
    this._logger = logger
    this._path = path
    this._fs = fs
  }

  parseOption (argv, program) {
    switch (argv[0]) {
      case '-m':
      case '--mutating':
        if (!argv[1] || argv[1][0] === '-') {
          program.abort("The '--mutating' should be followed by a field name")
        }
        return [2, { mutating: program.request.options.mutating.concat([argv[1].split(/\s*:\s*/)]) }]

      case '-t':
      case '--test':
        return [1, { test: true }]

      default:
        if (argv[0][0] !== '-' && program.request.options.classpath == null) {
          return [1, { classpath: argv[0] }]
        }
        return [0, null]
    }
  }

  async execute ({ classpath, mutating, test }, program) {
    const { extension, delimiter, generate } = await this._environment()

    if (classpath == null) {
      const { red, gray, underline } = this._chalk

      const exampleLabel = gray('Example:')
      const arrow = gray('→')

      program.abort(
        red('Please provide a classpath with slash or period as delimiter.\n') +
        '\n' +
        `  ${exampleLabel} tweed generate ${underline('Header')}\n` +
        `         ${arrow} src${delimiter}${underline(`Header`)}.${extension}\n` +
        '\n' +
        `  ${exampleLabel} tweed generate ${underline('pages.start.Testimonials')}\n` +
        `         ${arrow} src${delimiter}${underline(`pages${delimiter}start${delimiter}Testimonials`)}.${extension}\n` +
        '\n' +
        `  ${exampleLabel} tweed generate ${underline('data/client/APIEmployeeRepository')}\n` +
        `         ${arrow} src${delimiter}${underline(`data${delimiter}client${delimiter}APIEmployeeRepository`)}.${extension}\n`
      )
    }

    classpath = classpath.split(/\/|\\|\./)
    let className = classpath.pop()
    const filepath = classpath.concat(className + '.' + extension)

    className = this._forceUpperCamelCase(className)

    const targetFile = this._path.resolve('src', ...filepath)

    await this._generateFile(program, targetFile, () => generate(className, mutating))

    if (test) {
      const importPath = new Array(classpath.length + 1)
        .fill('..')
        .concat('src', classpath)
        .join('/') + '/' + className

      const { filename, testDir, generate } = await this._testEnvironment(importPath, program, className)
      const filepath = classpath.concat(filename + '.' + extension)
      const targetFile = this._path.resolve(testDir, ...filepath)

      await this._generateFile(program, targetFile, generate)
    }
  }

  async _generateFile (program, targetFile, generate) {
    const targetDir = this._path.dirname(targetFile)
    const relative = this._path.relative(process.cwd(), targetFile)

    await this._fs.makeDirectory(targetDir)

    if (await this._fs.exists(targetFile)) {
      program.abort(relative + ' already exists.')
    }

    await this._fs.writeFile(targetFile, generate())

    this._logger.log('Generated', relative)
  }

  _forceUpperCamelCase (name) {
    return name
      .replace(/[A-Z]/g, (m) => '_' + m[0])
      .toLowerCase()
      .split(/-|_/)
      .filter((p) => p)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join('')
  }

  async _environment () {
    const useTypeScript = await this._fs.exists('tsconfig.json')
    const useBabel = await this._fs.exists('.babelrc')

    return {
      extension: useTypeScript
        ? 'tsx'
        : 'js',
      delimiter: this._path.sep,
      generate: (name, mutating) => {
        if (useTypeScript) {
          return this._generateTypeScript(name, mutating)
        }
        if (useBabel) {
          return this._generateBabel(name, mutating)
        }
        return this._generateES5(name, mutating)
      }
    }
  }

  async _testEnvironment (importPath, program, className) {
    const useTypeScript = await this._fs.exists('tsconfig.json')
    const useBabel = await this._fs.exists('.babelrc')
    const pkg = require(process.cwd() + '/package.json')
    const useJest = 'jest' in pkg.devDependencies
    const useMocha = 'mocha' in pkg.devDependencies

    if (!(useJest || useMocha)) {
      program.abort("To include a test file you have to install 'jest' or 'mocha'")
    }

    let filename, testDir, generate

    if (useJest) {
      filename = `${className}.test`
      testDir = '__tests__'
      if (useTypeScript) {
        generate = this._generateTypeScriptTest.bind(this, 'test', className, 'expect', 'toEqual', importPath)
      } else if (useBabel) {
        generate = this._generateBabelTest.bind(this, 'test', className, 'expect', 'toEqual', importPath)
      } else {
        generate = this._generateES5Test.bind(this, 'test', className, 'expect', 'toEqual', importPath)
      }
    }

    if (useMocha) {
      filename = `${className}Test`
      testDir = 'test'
      if (useTypeScript) {
        generate = this._generateTypeScriptTest.bind(this, 'it', className, 'expect', 'to.deep.equal', importPath, "import { expect } from 'chai'")
      } else if (useBabel) {
        generate = this._generateBabelTest.bind(this, 'it', className, 'expect', 'to.deep.equal', importPath, "import { expect } from 'chai'")
      } else {
        generate = this._generateES5Test.bind(this, 'it', className, 'expect', 'to.deep.equal', importPath, "const { expect } = require('chai')")
      }
    }

    return {
      filename,
      testDir,
      generate
    }
  }

  _jsxHeader () {
    const pkg = require(process.cwd() + '/package.json')
    const useStandard = 'standard' in pkg.devDependencies

    if (useStandard) {
      return '/** @jsx VirtualNode */'
    }
  }

  _generateTypeScript (name, mutating) {
    const isStateful = mutating.length > 0
    return `
import { ${isStateful ? 'mutating, ' : ''}VirtualNode } from 'tweed'

export default class ${name} {${
  isStateful ? (
    mutating
      .map(([field, type]) => `
  @mutating ${field}${type ? `: ${type}` : ''} = null`
      )
      .join('') + '\n'
  ) : ''
}
  render (): VirtualNode {
    return <div />
  }
}
    `.trim() + '\n'
  }

  _generateBabel (name, mutating) {
    const isStateful = mutating.length > 0
    const jsxHeader = this._jsxHeader()
    return `${jsxHeader ? jsxHeader + '\n' : ''}
import { ${isStateful ? 'mutating, ' : ''}VirtualNode } from 'tweed'

export default class ${name} {${
  isStateful ? (
    mutating
      .map(([field]) => `
  @mutating ${field} = null`
      )
      .join('') + '\n'
  ) : ''
}
  render () {
    return <div />
  }
}
    `.trim() + '\n'
  }

  _generateES5 (name, mutating) {
    const isStateful = mutating.length > 0
    return `
'use strict'

var Tweed = require('tweed')
var n = Tweed.VirtualNode${
  isStateful ? (`
var mutating = Tweed.mutating`
  ) : ''
}

var ${name} = module.exports = function ${name} () {${
  isStateful ? (
`${mutating.map(([field]) => `
  this.${field} = null`
)}
}
${mutating.map(([field]) => `
mutating(${name}.prototype, '${field}')`
)}`
  ) : '}'
}

${name}.prototype.render = function () {
  return n('div')
}
    `.trim() + '\n'
  }

  _generateTypeScriptTest (test, className, expect, toEqual, importPath, head) {
    const varName = className[0].toLowerCase() + className.slice(1)

    return `${
  head ? '\n' + head : ''
}
import { VirtualNode } from 'tweed'
import ${className} from '${importPath}'

describe('${className}', () => {
  const ${varName} = new ${className}()

  ${test}('it works', () => {
    ${expect}(${varName}.render())
      .${toEqual}(<div />)
  })
})
    `.trim() + '\n'
  }

  _generateBabelTest (test, className, expect, toEqual, importPath, head) {
    const varName = className[0].toLowerCase() + className.slice(1)
    const jsxHeader = this._jsxHeader()

    return `${jsxHeader ? jsxHeader + '\n' : ''}${
  head ? '\n' + head : ''
}
import { VirtualNode } from 'tweed'
import ${className} from '${importPath}'

describe('${className}', () => {
  const ${varName} = new ${className}()

  ${test}('it works', () => {
    ${expect}(${varName}.render())
      .${toEqual}(<div />)
  })
})
    `.trim() + '\n'
  }

  _generateES5Test (test, className, expect, toEqual, importPath, head) {
    const varName = className[0].toLowerCase() + className.slice(1)

    return `${
  head ? '\n' + head : ''
}
const { VirtualNode: n } = require('tweed')
const ${className} = require('${importPath}')

describe('${className}', () => {
  var ${varName} = new ${className}()

  ${test}('it works', () => {
    ${expect}(${varName}.render())
      .${toEqual}(n('div'))
  })
})
    `.trim() + '\n'
  }
}
