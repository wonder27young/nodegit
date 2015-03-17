var promisify = require("promisify-node");
var path = require("path");
var fse = require("fs");

var whichNativeNodish = require("which-native-nodish");
var compile = require("./compile.js");

var exec = promisify(function(command, opts, callback) {
  return require("child_process").exec(command, opts, callback);
});
var local = path.join.bind(path, __dirname);
var notFromRegistry = fse.existsSync(local("../.didntcomefromthenpmregistry"));

fse.writeFileSync(local("../.justAnInstall"), "");
whichNativeNodish("..")
  .then(function(results) {
    if (results.nwVersion) {
      console.info("[nodegit] Must build for node-webkit/nw.js");
      return checkAndBuild();
    }
    else if (results.asVersion) {
      console.info("[nodegit] Must build for atom-shell");
      return checkAndBuild();
    }
    if (process.env.BUILD_DEBUG) {
      console.info("[nodegit] Doing a debug build, no fetching allowed");
      return checkAndBuild();
    }
    if (process.env.BUILD_ONLY) {
      console.info("[nodegit] BUILD_ONLY is set to true, no fetching allowed");
      return checkAndBuild();
    }
    if (notFromRegistry) {
      console.info("[nodegit] Not installed from registry, " +
        "must build manually");
      return checkAndBuild();
    }

    console.info("[nodegit] Fetching binary from S3.");
    return exec("node-pre-gyp install")
      .then(
        function() {
          console.info("[nodegit] Completed installation successfully");
        },
        function() {
          console.info("[nodegit] Failed to install prebuilt binary, " +
            "building manually");
          return checkAndBuild();
        }
      );
  })


function checkAndBuild() {
  if (notFromRegistry) {
    return require('./prepareForBuild')()
      .then(compile);
  }

  return compile();
}
