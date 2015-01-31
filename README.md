# changesdown

levelup that uses a leveldown that writes to a changes feed to store its state

```
npm install changesdown
```

[![build status](http://img.shields.io/travis/mafintosh/changesdown.svg?style=flat)](http://travis-ci.org/mafintosh/changesdown)

## Usage

``` js
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

feed.createReadStream({live:true})
  .on('data', function(data) {
    console.log('change:', changesdown.decode(data.value)) // should print some changes
  })
```

## API

#### `db = changesdown(levelup, changesFeed, [options])`

Returns a new levelup (`db`) that reads and writes from the changes feed.
The levelup you pass in is used to store a view of the feed.

Any options passed will be forwarded to the levelup constructor.

## License

MIT
