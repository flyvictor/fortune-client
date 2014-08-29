var xServiceFilter = require("../../lib/x-service-filter"),
  should = require("should"),
  when = require("when"),
  sinon = require("sinon"),
  _ = require("lodash");

describe("cross service filtering", function(){
  var sandbox;

  beforeEach(function(){
    sandbox = sinon.sandbox.create();
  });
  it('should create onRequest hook', function(done){
    var router = {onRequest: sinon.stub()};
    xServiceFilter.init({}, router);
    router.onRequest.callCount.should.equal(1);
    done();
  });
  it('should always call through if no filter is defined', function(done){
    xServiceFilter.inspectRequest({request: {query: {}}}).then(function(){
      done();
    });
  });
  it('should catch requests with filter', function(done){
    sandbox.stub(xServiceFilter, "resolveReferencesFilters").returns(when.resolve('stub'));
    var req = {request: {query: {filter: {}}}};
    xServiceFilter.inspectRequest(req).then(function(){
      req.request.query.filter.should.equal('stub');
      sandbox.restore();
      done();
    });
  });
  it('should resolve external resource ids', function(done){
    sandbox.stub(xServiceFilter, "requestSubresource").returns(when.resolve(['resourceId']));
    xServiceFilter.init({resources: [
      {name: "user", route: "users", schema: {name: String}},
      {name: "band", route: "bands", schema: {members: [{ref: "user", external: true}]}}
    ]}, {onRequest: function(){}});
    var config = {
      route: "bands",
      request: {query: {filter: {members: {name: "Joe"}}}}
    };
    xServiceFilter.resolveReferencesFilters(config).then(function(filter){
      filter.members.should.eql({$in: ["resourceId"]});
      sandbox.restore();
      done();
    });
  });
  it('should rewrite initial filter to resolved values', function(done){
    sandbox.stub(xServiceFilter, "requestSubresource").returns(when.resolve(['resourceId']));
    xServiceFilter.init({resources: [
      {name: "user", route: "users", schema: {name: String}},
      {name: "band", route: "bands", schema: {members: [{ref: "user", external: true}]}}
    ]}, {onRequest: function(){}});
    var config = {
      route: "bands",
      request: {query: {filter: {members: {name: "Joe"}}}}
    };
    xServiceFilter.inspectRequest(config).then(function(){
      config.request.query.filter.members.should.eql({$in: ["resourceId"]});
      sandbox.restore();
      done();
    });
  });
  it('should work fine with complex filters - $or', function(done){
    sandbox.stub(xServiceFilter, "requestSubresource").returns(when.resolve(['resourceId']));
    xServiceFilter.init({resources: [
      {name: "user", route: "users", schema: {name: String}},
      {name: "band", route: "bands", schema: {members: [{ref: "user", external: true}]}}
    ]}, {onRequest: function(){}});
    var config = {
      route: "bands",
      request: {query: {filter: {$or: [{members: {name: "Joe"}}]}}}
    };
    xServiceFilter.inspectRequest(config).then(function(){
      config.request.query.filter.id.should.eql({
        $in: ["resourceId"]
      });
      sandbox.restore();
      done();
    });
  });
  it('should work fine with complex filters - $and', function(done){
    sandbox.stub(xServiceFilter, "requestSubresource").returns(when.resolve(['resourceId']));
    xServiceFilter.init({resources: [
      {name: "user", route: "users", schema: {name: String}},
      {name: "band", route: "bands", schema: {members: [{ref: "user", external: true}]}}
    ]}, {onRequest: function(){}});
    var config = {
      route: "bands",
      request: {query: {filter: {$and: [{members: {name: "Joe"}}]}}}
    };
    xServiceFilter.inspectRequest(config).then(function(){
      config.request.query.filter.id.should.eql({
        $in: ["resourceId"]
      });
      sandbox.restore();
      done();
    });
  });
  it('should work fine with $in filters', function(done){
    sandbox.stub(xServiceFilter, "requestSubresource").returns(when.resolve(['resourceId']));
    xServiceFilter.init({resources: [
      {name: "user", route: "users", schema: {name: String, pets: [String]}},
      {name: "band", route: "bands", schema: {members: [{ref: "user", external: true}]}}
    ]}, {onRequest: function(){}});
    var config = {
      route: "bands",
      request: {query: {filter: {members: {pets: {$in: ["petId"]}}}}}
    };
    xServiceFilter.inspectRequest(config).then(function(){
      config.request.query.filter.members.should.eql({$in: ["resourceId"]});
      sandbox.restore();
      done();
    });
  });
});