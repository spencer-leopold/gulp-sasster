'use strict';

var gutil = require('gulp-util');
var through2 = require('through2');
var Sasster = require('sasster');
var instance;

module.exports = function (opts) {
	opts = opts || {};

	// if (!dest) {
	// 	throw new gutil.PluginError('gulp-sasster', '`dest` required');
	// }

  var files = [];
  var filesPlusContent = [];

  var onData = function (file, encoding, cb) {
    if (file.path) {
      files.push(file.path);
      filesPlusContent.push({
        filepath: file.path,
        contents: file.contents.toString()
      });
    }
    cb();
  };

  var onEnd = function(cb) {
    var _this = this;
    opts.src = files;
    opts.streams = true;
    opts.logger = gutil;

    if (!instance) {
      instance = new Sasster(opts);

      function onCompiled(out) {
        _this.emit('compiled', out);
        cleanup();
      }

      function onModified(src) {
        _this.emit('modified', src);
        cleanup();
      }

      function cleanup() {
        instance.removeListener('compiled', onCompiled);
        instance.on('compiled', onCompiled);
        instance.removeListener('modified', onModified);
        instance.on('modified', onModified);
      }

      instance.on('compiled', onCompiled);
      instance.on('modified', onModified);
    }

    instance.buildImportMap(files).then(function(fileMap) {
      return Promise.all(Object.keys(fileMap)
        .filter(function(src) {
          return (fileMap.hasOwnProperty(src));
        })
        .map(function(src) {
          return instance.compileSassContents(src, filesPlusContent).then(function(output) {
            return output;
          }).catch(gutil.log);
        })
      ).then(function() {
        if (!!opts.watch) {
          instance.watch();
        }

        _this.emit('end');
      }).catch(gutil.log);
    });

    cb();
  };

  return through2.obj(onData, onEnd);
};

module.exports.testAlter = function (opts) {
  var files = [];

  var onData = function (file, encoding, cb) {
    if (file.contents) {
      file.contents = new Buffer('body { margin: 0; }');
      files.push(file);
    }
    cb(null, file);
  };

  var onEnd = function(cb) {
    cb();
  };

  return through2.obj(onData, onEnd);
};
