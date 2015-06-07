var Promise = require("nodegit-promise");
var promisify = require("promisify-node");
var path = require("path");
var fs = require("fs");

var checkPrepared = require("./checkPrepared");
var whichNativeNodish = require("which-native-nodish");
var prepareForBuild = require("./prepareForBuild");

var exec = promisify(function(command, opts, callback) {
  return require("child_process").exec(command, opts, callback);
});
var nwVersion = null;
var asVersion = null;

var local = path.join.bind(path, __dirname);

if (fs.existsSync(local("../.didntcomefromthenpmregistry"))) {
  return checkAndBuild();
}
if (process.env.BUILD_DEBUG) {
  console.info("[nodegit] Doing a debug build, no fetching allowed.");
  return checkAndBuild();
}
if (process.env.BUILD_ONLY) {
  console.info("[nodegit] BUILD_ONLY is set to true, no fetching allowed.");
  return checkAndBuild();
}

console.info("[nodegit] Fetching binary from S3.");
return exec("node-pre-gyp install")
  .then(
    function() {
      console.info("[nodegit] Completed installation successfully.");
    },
    function() {
      console.info("[nodegit] Failed to install prebuilt binary, " +
        "building manually.");
      return checkAndBuild();
    }
  );

function checkAndBuild() {
  console.info("[nodegit] Making sure dependencies are available and native " +
    "code is generated");

  return checkPrepared.checkAll()
    .then(function(allGood) {
      if (!allGood) {
        console.info("[nodegit] Something is missing, retrieving " +
        "dependencies and regenerating code");
        return prepareForBuild();
      }
    });
}
