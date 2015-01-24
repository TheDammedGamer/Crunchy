'use strict';
var Command = require('commander').Command;
var fs = require('fs');
var path = require('path');
var series = require('./series');

/**
 * Streams the batch of series to disk.
 * @param {Array.<string>} args
 * @param {function(Error)} done
 */
module.exports = function(args, done) {
  var config = _parse(args);
  var batchPath = path.join(config.output || process.cwd(), 'CrunchyRoll.txt');
  _tasks(config, batchPath, function(err, tasks) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      if (i >= tasks.length) return done();
      series(tasks[i].config, tasks[i].address, function(err) {
        if (err) return done(err);
        i += 1;
        next();
      });
    })();
  });
};

/**
 * Parses the configuration or reads the batch-mode file for tasks.
 * @private
 * @param {Object} config
 * @param {string} batchPath
 * @param {function(Error, Object=} done
 */
function _tasks(config, batchPath, done) {
  if (config.args.length) {
    return done(undefined, config.args.map(function(address) {
      return {address: address, config: config};
    }));
  }
  fs.exists(batchPath, function(exists) {
    if (!exists) return done(undefined, []);
    fs.readFile(batchPath, 'utf8', function(err, data) {
      if (err) return done(err);
      var map = [];
      data.split(/\r?\n/).forEach(function(line) {
        var lineConfig = _parse(process.argv.concat(line.split(' ')));
        lineConfig.args.forEach(function(address) {
          if (!address) return;
          map.push({address: address, config: lineConfig});
        });
      });
      done(undefined, map);
    });
  });
}

/**
 * Parses the arguments and returns a configuration.
 * @private
 * @param {Array.<string>} args
 * @returns {Object}
 */
function _parse(args) {
  return new Command().version(require('../package').version)
    // Disables
    .option('-c, --cache', 'Disables the cache.')
    .option('-m, --merge', 'Disables merging subtitles and videos.')
    // Filters
    .option('-e, --episode <i>', 'The episode filter.')
    // Settings
    .option('-f, --format <s>', 'The subtitle format. (Default: ass)')
    .option('-o, --output <s>', 'The output path.')
    .option('-s, --series <s>', 'The series override.')
    .option('-t, --tag <s>', 'The subgroup. (Default: CrunchyRoll)')
    .option('-v, --volume <i>', 'The volume.')
    .parse(args);
}