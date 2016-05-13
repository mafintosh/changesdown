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

tape('custom indexer', function (t) {
  var feed = changes(memdb())
  var db = changesdown(memdb(), {
    changes: feed,
    indexer: indexLikes
  })

  db.batch([{
    type: 'put',
    key: 'alice',
    value: toBuffer({
      hates: 'beer'
    })
  }, {
    type: 'put',
    key: 'bob',
    value: toBuffer({
      likes: 'people'
    })
  }], function(err) {
    if (err) throw err

    var data = []
    db.createValueStream()
      .on('data', data.push.bind(data))
      .on('end', function () {
        t.same(data, [new Buffer('people')])
        t.end()
      })
  })

  function indexLikes (batch, cb) {
    var vBatch = batch
      .map(function (subOp) {
        var value = JSON.parse(subOp.value)
        if (!value.likes) return

        return {
          type: subOp.type,
          key: subOp.key,
          value: new Buffer(value.likes)
        }
      })
      .filter(function (op) {
        return !!op
      })

    cb(null, vBatch)
  }
})

function toBuffer (obj) {
  return new Buffer(JSON.stringify(obj))
}
