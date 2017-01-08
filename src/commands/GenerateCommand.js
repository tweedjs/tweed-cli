export default class GenerateCommand {
  name = 'generate'
  description = 'Generate files containing tedious boilerplate.'
  usage = 'tweed generate <classpath> [-m <mutating-field>]'
  initialOptions = {
    classpath: null,
    mutating: []
  }
  options = [
    ['-m, --mutating <mutating-field>', 'Add a mutating field to the component']
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

      default:
        if (argv[0][0] !== '-' && program.request.options.classpath == null) {
          return [1, { classpath: argv[0] }]
        }
        return [0, null]
    }
  }

  async execute ({ classpath, mutating }, program) {
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
    classpath.push(className + '.' + extension)

    className = this._forceUpperCamelCase(className)

    const targetFile = this._path.resolve('src', ...classpath)
    const targetDir = this._path.dirname(targetFile)
    const relative = this._path.relative(process.cwd(), targetFile)

    await this._fs.makeDirectory(targetDir)

    if (await this._fs.exists(targetFile)) {
      program.abort(relative + ' already exists.')
    }

    await this._fs.writeFile(targetFile, generate(className, mutating))

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

  _generateTypeScript (name, mutating) {
    const isStateful = mutating.length > 0
    return `
import { ${isStateful ? 'mutating, ' : ''}Node } from 'tweed'

export default class ${name} {${
  isStateful ? (
    mutating
      .map(([field, type]) => `
  @mutating ${field}${type ? `: ${type}` : ''} = null`
      )
      .join('') + '\n'
  ) : ''
}
  render (): Node {
    return <div />
  }
}
    `.trim() + '\n'
  }

  _generateBabel (name, mutating) {
    const isStateful = mutating.length > 0
    return `
import { ${isStateful ? 'mutating, ' : ''}Node } from 'tweed'

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
var n = Tweed.Node${
  isStateful ? (`
var mutating = Tweed.mutating`
  ) : ''
}

module.exports = ${name}
function ${name} () {${
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
}
