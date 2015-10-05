var assert = require("assert");
var path = require("path");
var Promise = require("nodegit-promise");
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));

var exec = promisify(function(command, opts, callback) {
  return require("child_process").exec(command, opts, callback);
});

describe("Stage", function() {
  var RepoUtils = require("../utils/repository_setup");
  var NodeGit = require("../../");
	var test;

  beforeEach(function() {
    test = this;
		var repoDir = "../repos/stagingRepo/";
    var repoPath = path.resolve(__dirname, repoDir);

    return RepoUtils.createRepository(repoPath)
      .then(function(repo) {
        test.repository = repo;
        return repo.openIndex();
      })
      .then(function(index) {
        test.index = index;
      });
  });

  after(function() {
		return fse.remove(test.repository.workdir());
  });

function stagingTest(staging, newFileContent) {
    var fileContent = newFileContent ||
                      "One line of text\n" +
                      "Two lines of text\n"+
                      "Three lines of text\n"+
                      "Four lines of text\n"+
                      "Five lines of text\n"+
                      "Six lines of text\n"+
                      "Seven lines of text\n"+
                      "Eight lines of text\n"+
                      "Nine lines of text\n"+
                      "Ten lines of text\n"+
                      "Eleven lines of text\n"+
                      "Twelve lines of text\n"+
                      "Thirteen lines of text\n"+
                      "Fourteen lines of text\n"+
                      "Fifteen lines of text\n"+
                      "Sixteen lines of text\n"+
                      "Seventeen lines of text\n"+
                      "Eighteen lines of text\n"+
                      "Nineteen lines of text\n"+
                      "Twenty lines of text\n";
    var fileName = "stagedLinesTest.txt";
    var index;
    var stagedFile;
    var workingDirFile;
    var getDiffFunction;
    if (staging) {
      stagedFile = fileContent.replace("Fifteen", "Changed fifteen");
      workingDirFile = stagedFile.replace("Three", "Changed three")
                            .replace("Seventeen", "Changed seventeen");
      getDiffFunction = function() {
        return NodeGit.Diff.indexToWorkdir(test.repository, index, {
            flags:
              NodeGit.Diff.OPTION.SHOW_UNTRACKED_CONTENT |
              NodeGit.Diff.OPTION.RECURSE_UNTRACKED_DIRS
          });
      };
    }
    else {
      stagedFile = fileContent.replace("Three", "Changed three")
                            .replace("Seventeen", "Changed seventeen");
      workingDirFile = stagedFile.replace("Fifteen", "Changed fifteen");

      getDiffFunction = function() {
        return RepoUtils.addFileToIndex(test.repository, fileName)
          .then(function() {
            return test.repository.getBranchCommit("master");
          })
          .then(function(masterCommit) {
            return masterCommit.getTree();
          })
          .then(function(masterTree) {
            return NodeGit.Diff.treeToIndex(
              test.repository, masterTree, index, {
              flags:
                NodeGit.Diff.OPTION.SHOW_UNTRACKED_CONTENT |
                NodeGit.Diff.OPTION.RECURSE_UNTRACKED_DIRS
            });
          });
      };
    }

    return RepoUtils.commitFileToRepo(test.repository, fileName, fileContent)
    .then(function() {
      return fse.writeFile(path.join(test.repository.workdir(), fileName),
                            workingDirFile);
    })
    .then(function() {
      return test.repository.openIndex();
    })
    .then(function(repoIndex) {
      index = repoIndex;
      return getDiffFunction();
    })
    .then(function(fileDiff) {
      return fileDiff.patches();
    })
    .then(function(patches) {
      var pathPatch = patches.filter(function(patch) {
        return patch.newFile().path() === fileName;
      });
      return pathPatch[0].hunks();
    })
    .then(function(pathHunks) {
      var linePromises = [];

      pathHunks.forEach(function(pathHunk) {
        linePromises.push(pathHunk.lines());
      });

      return Promise.all(linePromises);
    })
    .then(function(lines) {
      var linesToStage = [];
      lines.forEach(function(hunkLines) {
        hunkLines.forEach(function(line) {
          if (line.content().toLowerCase().indexOf("fifteen") >= 0){
            linesToStage.push(line);
          }
        });
      });
      return test.repository.stageLines(fileName, linesToStage, !staging);
    })
    .then(function(stageResult) {
      assert.equal(stageResult, 0);
      var pathOid = index.getByPath(fileName).id;
      return test.repository.getBlob(pathOid);
    })
    .then(function(resultFileContents) {
      assert.equal(resultFileContents.toString(), stagedFile);
    });
  }

  it("can stage selected lines", function() {
    return stagingTest(true);
  });
  it("can unstage selected lines", function() {
    return stagingTest(false);
  });

  //This is used to test cases where there are no newline at EOF
  var newlineEofTestFileContent =
                  "One line of text\n" +
                  "Two lines of text\n"+
                  "Three lines of text\n"+
                  "Four lines of text\n"+
                  "Five lines of text\n"+
                  "Six lines of text\n"+
                  "Seven lines of text\n"+
                  "Eight lines of text\n"+
                  "Nine lines of text\n"+
                  "Ten lines of text\n"+
                  "Eleven lines of text\n"+
                  "Twelve lines of text\n"+
                  "Thirteen lines of text\n"+
                  "Fourteen lines of text\n"+
                  "Fifteen lines of text";
  it("can stage last line with no newline at EOF", function() {
    return stagingTest(true, newlineEofTestFileContent);
  });
  it("can unstage last line with no newline at EOF", function() {
    return stagingTest(false, newlineEofTestFileContent);
  });
  it("can stage second to last line with no newline at EOF", function() {
    var newlineEofTestFileContent2 = newlineEofTestFileContent +
     "\nSixteen lines of text\nSeventeen lines of text\nEighteen lines of text";
    return stagingTest(true, newlineEofTestFileContent2);
  });
  it("can unstage second to last line with no newline at EOF", function() {
    var newlineEofTestFileContent2 = newlineEofTestFileContent +
     "\nSixteen lines of text\nSeventeen lines of text\nEighteen lines of text";
    return stagingTest(false, newlineEofTestFileContent2);
  });

  //This is used to test case where the last hunk is staged.
  var lastHunkStagedFileContent =
                "Thirteen lines of text\n"+
                "Fourteen lines of text\n"+
                "Fifteen lines of text\n"+
                "Sixteen lines of text\n"+
                "Shforteenteen lines of text\n";

  it("staging last hunk stages whole file if no filemode changes", function() {
    return stagingTest(true, lastHunkStagedFileContent)
      .then(function() {
        return test.repository.openIndex();
      })
      .then(function(index) {
        return NodeGit.Diff.indexToWorkdir(test.repository, index, {
            flags:
              NodeGit.Diff.OPTION.SHOW_UNTRACKED_CONTENT |
              NodeGit.Diff.OPTION.RECURSE_UNTRACKED_DIRS
          });
      })
      .then(function(diff) {
        assert.equal(Object.keys(diff).length, 0);  //Empty diff
        return diff.patches();
      })
      .then(function(patches) {
        //patches will have at least one item if there is something unstaged
        assert.equal(patches.length, 0);
      });
  });

  function compareFilemodes(vsWorkdir, index, fileModeDifference) {
    //Takes diff of head commit vs Workdir (if vsWorkdir is set) or vs Index
    //(if vsWorkdir is unset). Note: there's only one file in the filemode
    //staging tests for which this helper fn was written.
    //index - index to use (vsWorkdir is unset)
    //fileModeDifference - expected (newfilemode) - (oldfilemode)
    return test.repository.getHeadCommit()
      .then(function(commit) {
        return commit.getTree();
      })
      .then(function(tree) {
        if (vsWorkdir) {
          return NodeGit.Diff.treeToWorkdir(test.repository, tree);
        } else {
          return NodeGit.Diff.treeToIndex(test.repository, tree, index);
        }
      })
      .then(function(diff) {
        return diff.getDelta(0);
      })
      .then(function(delta) {
        if (fileModeDifference === 0) {
          if (!delta) {
            return true;
          } else {
            throw ("File change when no file change expected.");
          }
        } else {
          assert(delta.newFile().mode() - delta.oldFile().mode() === 
            fileModeDifference);
        }
        return true;
      });
  }

  if (process.platform == "linux" || process.platform == "darwin") {
    it("can stage filemode changes", function() {
      var fileContent = "Blek";
      var fileName = "stageFilemodeTest.txt";
      var index;

      return RepoUtils.commitFileToRepo(test.repository, fileName, fileContent)
      .then(function() {
        //First, create a file, have the same file in both the repo and workdir.
        return fse.writeFile(path.join(test.repository.workdir(), fileName),
                              fileContent)
          .then(function() {
            //Then, change the permission locally.
            return fse.chmod(path.join(test.repository.workdir(), fileName), 
              0755 /* new filemode */);
          });
      })
      //Then, diff between head commit and workdir should have filemode change
      .then(function() {
        return compareFilemodes(true, null, 0111 /* expect +x */)
          .then(function() {
            return test.repository.stageFilemode(fileName, true);
          });
      })
      //Now lets do a commit...
      .then(function() {
        return test.repository.openIndex();
      })
      .then(function(repoIndex) {
        index = repoIndex;
        index.read(1);
        return index.writeTree();
      })
      .then(function (oid) {
        var signature = NodeGit.Signature.create("Foo bar",
          "foo@bar.com", 123456789, 60);
        return test.repository.createCommit("HEAD", signature, signature,
            "initial commit", oid, []);
        //... alright, we did a commit.
      })
      //Now if we compare head commit to index, should be a filemode change
      .then(function() {
        return compareFilemodes(false, index, 0111 /* expect +x */);
      });
    });

    it("can unstage filemode changes", function() {
      var fileContent = "Blek";
      var fileName = "stageFilemodeTest2.txt";
      var index;

      return RepoUtils.commitFileToRepo(test.repository, fileName, fileContent)
      .then(function() {
        //First, create a file, have the same file in both the repo and workdir.
        return fse.writeFile(path.join(test.repository.workdir(), fileName),
                              fileContent)
          .then(function() {
            //Then, change the permission locally.
            return fse.chmod(path.join(test.repository.workdir(), fileName), 
              0755 /* new filemode */);
          });
      })
      //Then, diff between head commit and workdir should have filemode change
      .then(function() {
        return compareFilemodes(true, null, 0111 /* expect +x */);
      })
      .then(function() {
        return test.repository.openIndex();
      })
      .then(function(repoIndex) {
        //Now we stage the whole file...
        index = repoIndex;
        index.addByPath(fileName);
        return index.write();
      })
      .then(function() {
        //We expect the Index to have the filemode changes now.
        return compareFilemodes(false, index, 0111 /* expect +x */)
          .then(function() {
            //...then we attempt to unstage filemode
            return test.repository.stageFilemode(fileName, false /* unstage */);
          });
      })
      //We expect the Index to have no filemode changes, since we unstaged.
      .then(function() {
        return compareFilemodes(false, index, 0 /* expect +x */);
      })
      //We also expect the workdir to now have the filemode change.
      .then(function() {
        return compareFilemodes(true, null, 0111 /* expect +x */);
      });
    });
  } else if (process.platform == "win32") {
    it("can stage/unstage filemode changes", function() {
      var fileContent = "Blek";
      var fileName = "stageFilemodeTest.txt";
      var index;

      return RepoUtils.commitFileToRepo(test.repository, fileName, fileContent)
      .then(function() {
        //First, create a file, have the same file in both the repo and workdir.
        return fse.writeFile(path.join(test.repository.workdir(), fileName),
                              fileContent)
          .then(function() {
            //Then, change the permission on index
            return exec("git update-index --chmod=+x " + fileName,
              {cwd: test.repository.workdir()});
          })
          .then(function() {
          //Then, change the permission on index
          return exec("git commit -m 'test'",
            {cwd: test.repository.workdir()});
          })
          .then(function() {
          //Then, change the permission on index
          return exec("git update-index --chmod=-x " + fileName,
            {cwd: test.repository.workdir()});
          });
      })
      .then(function() {
        return test.repository.openIndex();
      })
      .then(function(repoIndex) {
        index = repoIndex;
        //Head commit vs index
        //We expect the Index to have +x
        return compareFilemodes(false, index, -0111 /* expect +x */);
      })
      .then(function() {
        //...then we attempt to unstage filemode
        return test.repository.stageFilemode(fileName, false /* unstage */);
      })
      .then(function() {
        return compareFilemodes(false, index, 0 /* expect nochange */);
      });
    });
  }

});