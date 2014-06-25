var should = require("should"),
    setup = require("./setup"),
    util = require("../util");


describe("INTEGRATION TESTS", function(){
  before(function(done){
    setup.initialiseFortunes().then(done);
  });

  beforeEach(function(done){
    setup.populate().then(done);
  });
  
  afterEach(function(done){
    setup.wipeCollections().then(done);
  });

  util.requireSpecs(__dirname, ["fortune-client"]);
});
