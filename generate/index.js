var generateJson = require("./scripts/generateJson");
var generateNativeCode = require("./scripts/generateNativeCode");
var generateMissingTests = require("./scripts/generateMissingTests");
var Promise = require("nodegit-promise");

module.exports = function generate() {
  console.info("[nodegit] Generating code.");

  return generateJson()
    .then(function() {
      console.info("[nodegit] Generated output JSON.");
      return Promise.all([
        generateNativeCode().then(function() {
          console.info("[nodegit] Generated native code.");
        }),
        generateMissingTests().then(function() {
          console.info("[nodegit] Generated missing tests.");
        })
      ]);
    })
    .catch(function(reason) {
      console.error("[nodegit] Error generating code.");
      return Promise.reject(reason);
    });
}

// Invoke method if called from `node generate`.
if (require.main === module) {
  module.exports().done(function() {
    process.exit(0);
  });
}
