var Promise = Promise || require("nodegit-promise");
var spawn = require("child_process").spawn;

module.exports = function (command, args, cb) {
  return new Promise(function(resolve, reject) {
    var child = spawn(command, args);
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
    child.on("exit", function(code) {
      if (code != 0) {
        reject(new Error(code));
      }
      else {
        resolve();
      }
    });
  });
};
