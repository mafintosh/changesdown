var changesdown = require('./changesdown')
var subleveldown = require('subleveldown')
var through = require('through2')
var pump = require('pump')
var levelup = require('levelup')
var encoding = require('./encoding')

var decoder = function (name) {
  switch (name) {
    case 'binary':
    return function (val) {
      return val
    }

    case 'utf-8':
    case 'utf8':
    return function (val) {
      return val.toString()
    }

    case 'json':
    return function (val) {
      return JSON.parse(val.toString())
    }
  }
}

module.exports = function(db, cOpts, opts) {
  // backwards compatibility
  cOpts = cOpts.append ? { changes: cOpts } : cOpts

  if (!opts) opts = {}

  opts.db = function(location) {
    return changesdown(location, cOpts, db)
  }

  var result = levelup(db.location || 'no-location', opts)

  var decodeKey = decoder(opts.keyEncoding || 'utf-8')
  var decodeValue = decoder(opts.valueEncoding || 'binary')
  var decode = function (entry) {
    if (entry.type === 'put' || entry.type === 'del') return {type: entry.type, key: decodeKey(entry.key), value: decodeValue(entry.value)}
    return {type: 'batch', batch: entry.batch.map(decode)}
  }

  result.createChangesStream = function (opts) {
    var format = function (data, enc, cb) {
      data.value = decode(encoding.decode(data.value))
      cb(null, data)
    }

    return pump(changes.createReadStream(opts), through.obj(format))
  }

  return result
}

module.exports.encoding = encoding
module.exports.encode = encoding.encode
module.exports.decode = encoding.decode
