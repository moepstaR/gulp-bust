'use strict';

var through = require('through2'),
    gutil = require('gulp-util'),
    crypto = require('crypto'),
    _ = require('underscore'),
    os = require('os'),
    pluginName;

pluginName = 'gulp-bust';

function Bust(options) {
  Bust.prototype.settings = {
    hashLength: false,
    hashType: 'md5',
    production: true
  };

  Bust.prototype.mappings = {};

  _.extend(this.settings, options || {});

  Bust.prototype.isWin = (os.platform() === 'win32') ? true : false;

  return this;
}

Bust.prototype.funnel = function (file, enc, callback) {

  if (file.isNull()) {
    return;
  }

  if (file.isStream()) {
    this.emit('error', new gutil.PluginError(pluginName, 'Streaming not supported'));
  }

  if (file.isBuffer()) {
    Bust.prototype.method(file);
  }

  this.push(file);

  return callback();
};

Bust.prototype.rename = function (filePath, hash) {
  var chunks,
    suffix;

  hash = this.settings.hashLength ? hash.substring(0, this.settings.hashLength) : hash;
  chunks = filePath.split('.');
  suffix = chunks.pop();

  return chunks.concat([hash, suffix]).join('.');
};

Bust.prototype.sanitise = function (path) {
  var reg = new RegExp('\\\\', 'g');

  return this.isWin ? path.replace(reg, '/') : path;
};

Bust.prototype.res = function (file) {
  var hash,
    checksum,
    base = this.sanitise(file.relative);

  if (this.settings.production) {
    hash = crypto.createHash(this.settings.hashType);
    hash.update(file.contents);
    checksum = hash.digest('hex');

    file.path = this.rename(file.path, checksum);
  }

  this.mappings[base] = this.sanitise(file.relative);
};

Bust.prototype.createRegExp = function () {
  var arr = [];

  _.each(this.mappings, function (val, key) {
    arr.push(key);
  });

  this.regExp = new RegExp(arr.join('|'), 'g');
};

Bust.prototype.ref = function (file) {
  if (!_.isEmpty(this.mappings)) {
    file.contents = new Buffer(
      file.contents.toString()
        .replace(this.regExp, function (match) {
          return this.mappings[match];
        }.bind(this))
    );
  }
};

Bust.prototype.resources = function () {
  Bust.prototype.method = this.res;
  return through.obj(this.funnel);
};

Bust.prototype.references = function () {
  Bust.prototype.createRegExp();
  Bust.prototype.method = this.ref;
  return through.obj(this.funnel);
};

module.exports = Bust;
