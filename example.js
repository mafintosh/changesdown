var changesdown = require('changesdown')
var changes = require('changes-feed')
var level = require('level')

var feed = changes(level('changes'))
var db = changesdown(level('db'), feed)

db.put('hello', 'world', function() {
  db.get('hello', function(err, value) {
    console.log(value) // should print world
  })
})

db.createChangesStream({live:true})
  .on('data', function(data) {
    console.log('change:', data.value) // should print some changes
  })
