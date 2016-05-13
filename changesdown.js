var util = require('util')
var through = require('through2')
var subdown = require('subleveldown/leveldown')
var abstract = require('abstract-leveldown')
var pump = require('pump')
var encoding = require('./encoding')
var defaultIndexer = function (batch, cb) {
  cb(null, batch)
}

var opToBatch = function (op) {
  return op.type === 'batch' ? op.batch : [op]
}

var ChangesDOWN = function(location, cOpts, db) {
  if (!(this instanceof ChangesDOWN)) return new ChangesDOWN(location, cOpts, db)
  abstract.AbstractLevelDOWN.call(this, location)

  this.leveldown = subdown(db, 'd')
  this.indexer = cOpts.indexer || defaultIndexer
  this.meta = subdown(db, 'm')
  this.changes = cOpts.changes
  this.change = 0
  this.cbs = {}
}

util.inherits(ChangesDOWN, abstract.AbstractLevelDOWN)

ChangesDOWN.prototype.setDb = function() {
  return this.leveldown.setDb.apply(this.leveldown, arguments)
}

ChangesDOWN.prototype.getProperty = function() {
  return this.leveldown.getProperty.apply(this.leveldown, arguments)
}

ChangesDOWN.prototype.approximateSize = function() {
  this.leveldown.approximateSize.apply(this.leveldown, arguments)
}

ChangesDOWN.prototype.close = function() {
  this.leveldown.close.apply(this.leveldown, arguments)
}

var toBuffer = function(val) {
  if (Buffer.isBuffer(val)) return val
  if (typeof val === 'string') return new Buffer(val)
  return val
}

ChangesDOWN.prototype._open = function(options, cb) {
  var self = this
  var changes = this.changes

  var index = function(data, enc, cb) {
    self.change = data.change

    var value = encoding.decode(data.value)

    var predone = function(err) {
      if (err) return done(err)
      self.meta.put('indexed', ''+data.change, done)
    }

    var done = function(err) {
      var saved = self.cbs[data.change]
      delete self.cbs[data.change]
      if (saved) saved(err)
      cb(err)
    }

    self.indexer(opToBatch(value), function (err, batch) {
      if (err || !(batch && batch.length)) return predone(err)

      self.leveldown.batch(batch, predone)
    })
  }

  this.meta.open(options, function() {
    self.leveldown.open(options, function(err) {
      if (err) return cb(err)
      self.meta.get('indexed', function(err, change) {
        if (!change) change = new Buffer('0')

        pump(changes.createReadStream({since:Number(change.toString())}), through.obj(index), function(err) {
          if (err) return cb(err)
          pump(changes.createReadStream({live:true, since:self.change}), through.obj(index))
          cb()
        })
      })
    })
  })
}

ChangesDOWN.prototype._put = function(key, value, options, cb) {
  this._append(encoding.encode({
    type: 'put',
    key: toBuffer(key),
    value: toBuffer(value)
  }), cb)
}

ChangesDOWN.prototype._batch = function(batch, options, cb) {
  batch = batch.map(function(b) {
    return {
      type: b.type,
      key: toBuffer(b.key),
      value: toBuffer(b.value)
    }
  })

  this._append(encoding.encode({
    type: 'batch',
    batch: batch
  }), cb)
}

ChangesDOWN.prototype._del = function(key, options, cb) {
  this._append(encoding.encode({
    type: 'del',
    key: toBuffer(key)
  }), cb)
}

ChangesDOWN.prototype._append = function(value, cb) {
  var self = this
  this.changes.append(value, function(err, node) {
    if (err) return cb(err)
    if (self.change >= node.change) return cb()
    self.cbs[node.change] = cb
  })
}

ChangesDOWN.prototype.get = function(key, options, cb) {
  this.leveldown.get.apply(this.leveldown, arguments)
}

ChangesDOWN.prototype.iterator = function() {
  return this.leveldown.iterator.apply(this.leveldown, arguments)
}

module.exports = ChangesDOWN
