var path = require('path');
var spawn = require('./spawn');

module.exports = function nodePreGyp(args) {
  var npgPath = path.join(__dirname, "..", "..", "node_modules", ".bin",
    "node-pre-gyp");

  return spawn(npgPath, args);
};
