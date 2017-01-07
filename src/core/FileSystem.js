export default class FileSystem {
  constructor (fs, path) {
    this._fs = fs
    this._path = path
  }

  exists (path) {
    return new Promise((resolve) => {
      this._fs.access(path, (e) => resolve(!e))
    })
  }

  makeDirectory (path) {
    return new Promise((resolve, reject) => {
      this._fs.mkdirs(path, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  copy (from, to) {
    return new Promise((resolve, reject) => {
      this._fs.copy(from, to, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}
