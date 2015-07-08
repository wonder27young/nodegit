var spawn = require("child_process").spawn;

module.exports = function (command, args, cb) {
  var child = spawn(command, args);
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);
  child.on('exit', cb);
};

module.exports.promise = function(command, args) {
  var Promise = Promise || require("nodegit-promise");
  return new Promise(function(resolve, reject) {
    module.exports(command, args, function(code) {
      if (code != 0) {
        reject(new Error(code));
      }
      else {
        resolve();
      }
    });
  });
}
