var Promise = require("nodegit-promise");
var cp = require("child_process");

var promisify = require("promisify-node");
var retrieve = require("./retrieveExternalDependencies");
var check = require("./checkPrepared").checkGenerated;
var generate = require("../generate");

var exec = promisify(function(command, opts, callback) {
  return require("child_process").exec(command, opts, callback);
});

module.exports = function prepareForBuild() {
  return exec("npm install --ignore-scripts")
    .then(function() {
      return Promise.all([
        retrieve(),
        generate()
      ]);
    });
};


// Called on the command line
if (require.main === module) {
  module.exports();
}
