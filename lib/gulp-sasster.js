'use strict';

var gutil = require('gulp-util');
var through2 = require('through2');
var Sasster = require('sasster');
var instance;

module.exports = function (opts) {
	opts = opts || {};

  var files = [];
  var fileContents = [];

  var onData = function (file, encoding, cb) {
    if (file.path) {
      files.push(file.path);
      fileContents.push({
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

      instance.on('compiled', function(stream) {
        _this.emit('compiled', stream);
      });

      instance.on('modified', function(src) {
        _this.emit('modified', src);
      });
    }

    instance.buildImportMap(files).then(function(fileMap) {
      return Promise.all(Object.keys(fileMap)
        .filter(function(src) {
          return (fileMap.hasOwnProperty(src));
        })
        .map(function(src) {
          return instance.compileSassContents(src, fileContents).then(function(output) {
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
