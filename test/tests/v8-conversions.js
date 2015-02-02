var assert = require("assert");

//var path = require("path");
//var Promise = require("nodegit-promise");
//var promisify = require("promisify-node");
//var fse = promisify(require("fs-extra"));

describe("Converting valuetypes in v8", function() {
  var nodegit = require("../..");
  //var Clone = require("../../lib/clone");

  // Set a reasonable timeout here now that our repository has grown.
  this.timeout(15000);

  it.only("can accept truthy values for integer-booleans in setters",
  function() {
    //var url = "http://github.com/maxkorp/courier.git";
    //var boolRepo = path.resolve("test/repos/v8-bool");

    var vals = [0, 1, 2, true, false, {}, "radishes", null, undefined, "", []];

    vals.forEach(function (val) {
      var opts = { ignoreCertErrors: val };
      opts = new nodegit.CloneOptions(opts);
      assert.equal(opts.ignoreCertErrors, !!val);
    });

    // function cleanAndClone(ignoreCertErrs) {
    //   var truthy = !!ignoreCertErrs;
    //   var opts = { ignoreCertErrors: ignoreCertErrs };
    //
    //   vals.forEach(function (val) {
    //     var opts = { ignoreCertErrors: val };
    //     opts = new nodegit.CloneOptions(opts);
    //     assert.equals(opts.ignoreCertErrors, !!val);
    //   }
    //   var promise = fse.remove(boolRepo)
    //     .then(function() {
    //       console.log(ignoreCertErrs);
    //       return Clone.clone(url, boolRepo, opts);
    //     });
    //
    //   if (truthy) {
    //     promise = promise.catch(function() {
    //       return Promise.reject(
    //         new Error(ignoreCertErrs + " was considered falsy")
    //       );
    //     });
    //   }
    //   else {
    //     promise = promise.then(function () {
    //       return Promise.reject(
    //         new Error(ignoreCertErrs + " was considered truthy")
    //       );
    //     }, Promise.resolve);
    //   }
    //   return promise;
    // }


    // return vals.reduce(function(previous, currentValue) {
    //   return previous.then(function() {
    //     return cleanAndClone(currentValue);
    //   });
    // }, Promise.resolve());
  });

});
