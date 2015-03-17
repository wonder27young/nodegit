var promisify = require("promisify-node");
var Promise = require("nodegit-promise");
var path = require("path");
var fs = require("fs");

var whichNativeNodish = require("which-native-nodish");
var spinner = new require("node-spinner")();
spinner.set('|/-\\');

var exec = promisify(function(command, opts, callback) {
  return require("child_process").exec(command, opts, callback);
});

module.exports = function() {
  return whichNativeNodish("..")
    .then(function(results) {
      var type = "node";
      if (results.nwVersion) {
        type = "nw.js";
      }
      else if (results.asVersion) {
        type = "atom-shell";
      }
      console.info("[nodegit] Building native " + type + " module");

      spinner.reset();
      spin();
      var interval = setInterval(spin, 250);

      var opts = {
        cwd: ".",
        maxBuffer: Number.MAX_VALUE
      };

      var prefix = "";
      var target = "";
      var debug = (process.env.BUILD_DEBUG ? " --debug" : "");
      var builder = "pangyp";
      var distUrl = "";
      if (results.asVersion) {
        prefix = (process.platform == "win32" ?
          "SET HOME=%HOME%\\.atom-shell-gyp&& " :
          "HOME=~/.atom-shell-gyp");

        target = "--target=" + results.asVersion;

        distUrl = "--dist-url=https://gh-contractor-zcbenz.s3." +
          "amazonaws.com/atom-shell/dist";
      }
      else if (results.nwVersion) {
        builder = "nw-gyp";
        target = "--target=" + results.nwVersion;
      }
      return exec("npm install nan " + builder)
        .then(function() {
          builder = path.resolve(".", "node_modules", ".bin", builder);
          builder = builder.replace(/\s/g, "\\$&");
          var cmd = [prefix, builder, "rebuild", target, debug, distUrl]
            .join(" ").trim();

          return exec(cmd, opts);
        })
        .then(function() {
          if (interval) {
            clearInterval(interval);
            process.stdout.write('\r');
          }
          console.info("[nodegit] Compilation complete.");
          console.info("[nodegit] Completed installation successfully.");
        },
        function(reason) {
          if (interval) {
            clearInterval(interval);
            process.stdout.write('\r');
          }
          return Promise.reject(reason);
        });
    });
};

function spin() {
  process.stdout.write('\r \033[36mbuilding\033[m ' + spinner.next());
}
