export default class NewCommand {
  name = 'new'
  description = 'Initiates a new Tweed project, or adds Tweed on top of an existing project'
  usage = 'tweed new'
  initialOptions = {
    directory: null,
    name: null,
    compiler: 'babel',
    buildSystem: 'npm',
    testRunner: null,
    interactive: true,
    backup: true
  }

  constructor (
    path,
    process,
    chalk,
    input,
    fs,
    builder,
    console
  ) {
    this._path = path
    this._process = process
    this._chalk = chalk
    this._input = input
    this._fs = fs
    this._builder = builder
    this._console = console
  }

  parseOption (argv, program) {
    switch (argv[0]) {
      // The name of the app
      case '-n':
      case '--name':
        if (argv[1] == null) {
          program.abort(`The '${argv[0]}' option must be provided an argument`)
        }
        return [2, { name: argv[1] }]

      // The build system to use: defaults to 'npm'
      case '-b':
      case '--build-system':
        const buildSystems = this._builder.buildSystems.map((b) => b.id)

        if ([...buildSystems, 'none'].indexOf(argv[1]) === -1) {
          program.abort(
            `The available build systems are: ${buildSystems.join(', ')}.\n` +
            "Pass 'none' to not include a build system. 'npm' is the default."
          )
        }
        return [2, { buildSystem: argv[1] === 'none' ? null : argv[1] }]

      // The test runner to use: defaults to 'none'
      case '-t':
      case '--test-runner':
        const testRunners = this._builder.testRunners.map((b) => b.id)

        if ([...testRunners, 'none'].indexOf(argv[1]) === -1) {
          program.abort(
            `The available test runners are: ${testRunners.join(', ')}.\n` +
            "Pass 'none' to not include a test runner. 'none' is the default."
          )
        }
        return [2, { testRunner: argv[1] === 'none' ? null : argv[1] }]

      // The compiler to use: defaults to 'babel'
      case '-c':
      case '--compiler':
        const compilers = this._builder.compilers.map((b) => b.id)

        if ([...compilers, 'none'].indexOf(argv[1]) === -1) {
          program.abort(
            `The available compilers are: ${compilers.join(', ')}.\n` +
            "Pass 'none' to write native JavaScript. 'babel' is the default."
          )
        }
        return [2, { compiler: argv[1] === 'none' ? null : argv[1] }]

      // Whether or not to backup if patching an existing directory
      case '--no-backup':
        return [1, { backup: false }]

      // Whether or not to confirm before doing anything
      case '--no-interaction':
        return [1, { interactive: false }]

      default:
        // The directory to use: defaults to the current directory
        if (
          program.request.options.directory == null &&
          argv[0][0] !== '-'
        ) {
          return [1, { directory: argv[0] }]
        }

        return [0, null]
    }
  }

  async execute ({
    directory,
    name,
    compiler,
    buildSystem,
    testRunner,
    interactive,
    backup
  }, program) {
    directory = this._path.resolve(directory || this._process.cwd())
    name = name || this._path.basename(directory)
    backup = backup && await this._fs.exists(directory)
    compiler = this._builder.compilers
      .filter((c) => c.id === compiler)[0]
    buildSystem = this._builder.buildSystems
      .filter((c) => c.id === buildSystem)[0]
    testRunner = this._builder.testRunners
      .filter((c) => c.id === testRunner)[0]

    let relativeDirectory = this._path.relative(this._process.cwd(), directory)

    if (relativeDirectory[0] !== '.') {
      relativeDirectory = '.' + this._path.sep + relativeDirectory
    }

    const { blue, yellow, gray } = this._chalk
    const { confirm } = interactive && await this._input.prompt([{
      name: 'confirm',
      type: 'confirm',
      message: [
        blue("Here's what I got:\n"),
        '',
        gray('Project Name: ') + yellow(name),
        gray('Directory:    ') + yellow(relativeDirectory),
        gray('Compiler:     ') + (compiler ? yellow(compiler.name) : gray('none')),
        gray('Build System: ') + (buildSystem ? yellow(buildSystem.name) : gray('none')),
        gray('Test Runner:  ') + (testRunner ? yellow(testRunner.name) : gray('none')),
        '\r\n',
        blue('Is this correct?')
      ].join('\n')
    }])

    if (!confirm && interactive) {
      program.abort(
        this._chalk.blue('Okay!')
      )
    }

    const packageManager = await this._console.commandExists('yarn')
      ? this._builder.packageManagers.yarn
      : this._builder.packageManagers.npm

    return this._builder.build({
      directory,
      name,
      compiler,
      buildSystem,
      backup,
      testRunner,
      packageManager,
      program
    })
  }
}
