export default class HelpCommand {
  name = 'help'
  description = 'Shows help pages'
  usage = 'tweed [help|-h] [-v|--verbose] [command]'
  options = []

  constructor (chalk) {
    this._chalk = chalk
  }

  parseOption (argv, program) {
    if (program.request.options.command != null) {
      return [0, null]
    }
    for (const command of program.commands) {
      if (command.name === argv[0]) {
        return [1, { command }]
      }
    }
    return [0, null]
  }

  execute ({ command, verbose }, program) {
    if (command == null) {
      console.log(this._helpAll(program, verbose))
    } else {
      console.log(this._help(command, program, verbose))
    }
  }

  _helpAll (program, verbose) {
    const nameWidth = Math.max(
      ...program.commands
        .map((c) => c.name.length)
    )
    return [
      this._chalk.gray('Usage: tweed [command] [...options]'),
      '',
      this._chalk.yellow('Available commands:'),
      ...program.commands
        .map((c) => ({
          name: c.name + new Array(nameWidth - c.name.length).fill(' ').join(''),
          description: c.description,
          usage: c.usage
        }))
        .map(({ name, description, usage }) => ({
          name: this._chalk.blue(name),
          description: this._chalk.gray(description),
          usage: this._chalk.gray(usage)
        }))
        .map(({ name, description, usage }) => verbose
          ? 'Command:     ' + name + '\n' + 'Usage:       ' + usage + '\n' + 'Description: ' + description + '\n'
          : '  ' + name + '  ' + description
        )
    ].join('\n')
  }

  _help (command, program, verbose) {
    const options = [
      ['-v, --verbose', 'Verbose output'],
      ...command.options
    ]
    const optionColWidth = Math.max(
      ...options.map(([o]) => o.length)
    )
    return [
      this._chalk.gray('Usage: ' + command.usage),
      '',
      this._chalk.blue(command.description),
      '',
      this._chalk.yellow('Available options:'),
      ...options
        .map(([option, description]) => [
          this._chalk.blue(
            option + new Array(optionColWidth - option.length).fill(' ').join('')
          ),
          this._chalk.gray(description)
        ])
        .map(([option, description]) =>
          `${option}  ${description}`
        ),
      ''
    ].join('\n')
  }
}
