var should = require("should"),
    sinon = require("sinon"),
    util = require("../util");


describe("UNIT TESTS", function(){
  beforeEach(function(){
    util.sandbox = sinon.createSandbox();
  });

  afterEach(function(){
    util.sandbox.restore();
  });

  util.requireSpecs(__dirname,[
    "crud-factory",
    "denormalize",
    "deep-filter",
    "remote-adapter", 
    "actions-factory"
  ]);
});
