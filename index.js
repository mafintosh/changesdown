var changesdown = require('./changesdown')
var subleveldown = require('subleveldown')
var levelup = require('levelup')

module.exports = function(db, changes, opts) {
  if (!opts) opts = {}

  opts.db = function(location) {
    return changesdown(location, changes, db)
  }

  return levelup(db.location || 'no-location', opts)
}

module.exports.encoding = require('./encoding')
module.exports.encode = module.exports.encoding.encode
module.exports.decode = module.exports.encoding.decode