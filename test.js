var tape = require('tape')
var memdb = require('memdb')
var changesdown = require('./')
var changes = require('changes-feed')

tape('works', function(t) {
  var feed = changes(memdb())
  var db = changesdown(memdb(), feed)

  db.put(new Buffer('hello'), new Buffer('world'), function() {
    db.get(new Buffer('hello'), function(err, val) {
      t.notOk(err, 'no err')
      t.same(val, new Buffer('world'))
      t.end()
    })
  })
})

tape('batches', function(t) {
  var feed = changes(memdb())
  var db = changesdown(memdb(), feed)

  db.batch([{
    type: 'put',
    key: new Buffer('hello'),
    value: new Buffer('world')
  }, {
    type: 'put',
    key: new Buffer('hej'),
    value: new Buffer('verden')
  }], function() {
    db.get(new Buffer('hello'), function(err, val) {
      t.notOk(err, 'no err')
      t.same(val, new Buffer('world'))
      db.get(new Buffer('hej'), function(err, val) {
        t.notOk(err, 'no err')
        t.same(val, new Buffer('verden'))
        t.end()
      })
    })
  })
})

tape('can reset db view', function(t) {
  var feed = changes(memdb())
  var db = changesdown(memdb(), feed)

  db.put(new Buffer('hello'), new Buffer('world'), function() {
    db.get(new Buffer('hello'), function(err, val) {
      t.notOk(err, 'no err')
      t.same(val, new Buffer('world'))

      var db = changesdown(memdb(), feed)
      db.get(new Buffer('hello'), function(err, val) {
        t.notOk(err, 'no err')
        t.same(val, new Buffer('world'))
        t.end()
      })
    })
  })
})