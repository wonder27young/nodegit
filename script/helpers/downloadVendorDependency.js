var path = require("path");
var promisify = require("promisify-node");
var Promise = Promise || require("nodegit-promise");
var request = require("request");
var tar = require("tar");
var zlib = require("zlib");
var fse = promisify("fs-extra");

var vendorDeps = require("../../package").vendorDependencies;
var NODE_VERSION = Number(process.version.match(/^v(\d+\.\d+)/)[1]);

module.exports = function downloadVendorDependency(name, force) {
  return new Promise(function(resolve, reject) {
    var vendorPackage = vendorDeps[name][NODE_VERSION] || vendorDeps[name];
    var version = vendorPackage.sha || vendorPackage.version;
    var vendorPath = path.join(__dirname, "..", "..", "vendor", name);
    var keyPath = path.join(vendorPath, version);

    if (!force && fse.existsSync(keyPath)) {
      return resolve();
    }
    console.info('[nodegit] Updating ' + name);
    fse.remove(vendorPath)
      .then(function() {
        return new Promise(function(innerResolve, innerReject) {
          var extract = tar.Extract({
            path: vendorPath,
            strip: true
          });

          request.get(vendorPackage.url)
            .pipe(zlib.createUnzip())
            .pipe(extract)
            .on("error", innerReject)
            .on("end", innerResolve);
        });
      })
      .then(function() {
        return fse.writeFile(keyPath, "");
      })
      .then(function() {
        resolve(vendorPath);
      })
      .catch(function(reason) {
        reject(reason);
      });
  });
}
