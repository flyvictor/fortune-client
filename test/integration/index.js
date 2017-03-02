var should = require("should"),
    setup = require("./setup"),
    util = require("../util");


describe("INTEGRATION TESTS", function(){
  before(function(done){
    this.timeout(5000);
    setup.initialiseFortunes().then(done);
  });

  beforeEach(function(done){
    setup.populate().then(done);
  });

  afterEach(function(done){
    setup.wipeCollections().then(done);
  });

  util.requireSpecs(__dirname, ["fortune-client"]);
  util.requireSpecs(__dirname, ["linking"]);
  util.requireSpecs(__dirname, ["deep-filter"]);
});
