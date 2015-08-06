module.exports = function combineEnv(input) {
  var output = {};
  input = input || {};
  for (var envVar in process.env) {
    if (process.env.hasOwnProperty(envVar)) {
      output[envVar] = process.env[envVar];
    }
  }
  for (var envVar in input) {
    if (input.hasOwnProperty(envVar)) {
      output[envVar] = input[envVar];
    }
  }
  return output;
}
