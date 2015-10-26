'use strict';

var gutil = require('gulp-util');
var through2 = require('through2');
var Sasster = require('sasster');

module.exports = function (opts) {
	opts = opts || {};

	// if (!dest) {
	// 	throw new gutil.PluginError('gulp-sasster', '`dest` required');
	// }

  var files = [];

  var onData = function (file, encoding, cb) {
    if (file.path) {
      files.push(file.path);
    }
    cb();
  };

  var onEnd = function(cb) {
    var _this = this;
    opts.src = files;
    opts.streams = true;

    var instance = new Sasster(opts);

    instance.buildImportMap(files).then(function(fileMap) {
      return Promise.all(Object.keys(fileMap)
        .filter(function(src) {
          return (fileMap.hasOwnProperty(src));
        })
        .map(function(src) {
          return instance.compileSass(src).then(function(output) {
            return output;
          }).catch(gutil.log);
        })
      ).then(function() {
        if (!!opts.watch) {
          instance.watch();
        }
      }).catch(gutil.log);

    });

    instance.on('update', function(out) {
      _this.emit('update', out);
    });

    cb();
  };

  return through2.obj(onData, onEnd);
};
