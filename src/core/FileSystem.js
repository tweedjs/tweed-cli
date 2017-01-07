export default class FileSystem {
  constructor (logger, fs, path, jsonfile) {
    this._logger = logger
    this._fs = fs
    this._path = path
    this._jsonfile = jsonfile
  }

  exists (path) {
    return new Promise((resolve) => {
      this._fs.access(path, (e) => resolve(!e))
    })
  }

  makeDirectory (path) {
    return this._promise(this._fs.mkdirs, path)
  }

  copy (from, to) {
    return this._promise(this._fs.copy, from, to)
  }

  writeFile (file, content) {
    return this._promise(this._fs.writeFile, file, content)
  }

  readJson (file) {
    return this._promise(this._jsonfile.readFile, file)
  }

  writeJson (file, json) {
    return this._promise(this._jsonfile.writeFile, file, json, { spaces: 2 })
  }

  _promise (fn, ...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, ...resp) => {
        if (err) {
          reject(err)
        } else {
          resolve(...resp)
        }
      })
    })
  }
}
