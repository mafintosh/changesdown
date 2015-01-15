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

// var db = require('level')('db')
// var changes = require('changes-feed')(subleveldown(db, 'changes'))
// var db2 = module.exports(subleveldown(db), changes)

// db2.put('hej', 'verden', function() {
//   db2.get('hej', console.log)
// })