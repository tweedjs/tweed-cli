export default class NewCommand {
  name = 'new'
  description = 'Initiates a new Tweed project, or adds Tweed on top of an existing project'
  usage = 'tweed new'
  initialOptions = {
    subdir: null,
    name: null,
    compiler: 'babel'
  }

  constructor (path, process) {
    this._path = path
    this._process = process
  }

  parseOption (argv, program) {
    switch (argv[0]) {
      case '-n':
      case '--name':
        if (argv[1] == null) {
          program.abort(`The '${argv[0]}' option must be provided an argument`)
        }
        return [2, { name: argv[1] }]

      case '-c':
      case '--compiler':
        if (['typescript', 'babel', 'none'].indexOf(argv[1]) === -1) {
          program.abort(
            "The available compilers are 'babel' and 'typescript'.\n" +
            "Pass 'none' to write native JavaScript. 'babel' is the default."
          )
        }
        return [2, { compiler: argv[1] === 'none' ? null : argv[1] }]

      default:
        if (
          program.request.options.subdir == null &&
          argv[0][0] !== '-'
        ) {
          return [1, { subdir: argv[0] }]
        }
        return [0, null]
    }
  }

  execute ({ name, subdir, compiler }) {
    name = name || this._path.basename(subdir || this._process.cwd())
    console.log('Create', compiler ? 'a ' + compiler : 'an','app called', name, 'in', subdir ? './' + subdir : 'the current directory')
  }
}
