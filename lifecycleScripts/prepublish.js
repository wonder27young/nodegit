var promisify = require("promisify-node");
var path = require("path");
var fse = require("fs-extra");

var whichNativeNodish = require("which-native-nodish");
var prepareForBuild = require("./prepareForBuild");
var build = require("./compile");

var exec = promisify(function(command, opts, callback) {
  return require("child_process").exec(command, opts, callback);
});

var justAFileFilePath = path.join(__dirname, "../.justAnInstall");
if (fse.existsSync(justAFileFilePath)) {
  console.info("[nodegit] skipping prepublish step since we're just " +
    "installing");
    fse.removeSync(justAFileFilePath);
    return;
}

var version = require('../package').version;
var tarArgs = ["-czvf", "nodegit-" + version + ".tar.gz"]

[
  "lib/",
  "include/",
  "lifecycleScripts/clean.js",
  "lifecycleScripts/compile.js",
  "lifecycleScripts/install.js",
  "lifecycleScripts/prepublish.js",
  "src/",
  "node_modules/node-pre-gyp/",
  "vendor",
  "HISTORY.md",
  "LICENSE",
  "package.json",
  "README.md"
].forEach(function(filePath) {
  tarArgs.push(path.join(__dirname, "..", filePath));
});

var zipper = span("tar", tarArgs);
zipper.stdout.on('data', function (data) {
  console.log(data);
});

ls.stderr.on('data', function (data) {
  console.error(data);
});
