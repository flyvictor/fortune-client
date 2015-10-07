var resourceLinker = require("../../lib/resource-linker"),
    router = require("../../lib/router")(),
    should = require("should"),
    when = require("when"),
    sinon = require("sinon"),
    _ = require("lodash");


var stubs = function () {
  var quoteResource = {
    quotes: [{
      id: "quoteId",
      isBooked: false,
      links: {
        aircraft : "OE-GGP",
        quoteLegs: [
          "5368f7aea08a5bed0f525d4c"
        ]
      }
    }],
    links: {
      "quotes.aircraft": { type: "aircraft" },
      "quotes.operator": { type: "operators" },
      "quotes.quoteLegs": { type: "quote-legs" }
    },
    linked: {
      "aircraft": "external"
    }
  };

  var aircraftResource = {
    aircraft: [{
      id: "OE-GGP",
      registration: "OE-GGP",
      model: "Citation XLS",
      links: {
        images: [
          "536d20d8460e865d02bf2dd6",
          "536d20d8460e865d02bf2dd0"
        ],
        operator : "ABC"
      }
    }],
    links: {
      "aircraft.images": { type: "aircraft-image" },
      "aircraft.operator": { type: "operators" }
    },
    linked: {
      "operator": "external"
    }
  };

  var operatorResource = {
    operators: [{
      id : "12345",
      name : "BA Operator"
    },{
      id: "ABC",
      name: "Executive Aviation"
    }]
  };

  var bodyWithExternals = {
    people: [{
      email: "dilbert@mailbert.com",
      links: {
        aircraft: ["OE-GGP"],
        employer: "12345",
        quotes: ["quoteId"]
      }
    }],
    links: {
      "people.quotes": {type: "quotes"},
      "people.aircraft": {type: "aircraft"},
      "people.employer": {type: "operators"}
    },
    linked: {
      quotes: quoteResource.quotes,
      aircraft: "external",
      operators: "external"
    }
  };

  var denormalizedBodyWithExternals = {
    people: [{
      email: "dilbert@mailbert.com",
      links: {
        aircraft: [aircraftResource],
        employer: "12345",
        quotes: [quoteResource.quotes]
      }
    }],
    links: {
      "people.quotes": {type: "quotes"},
      "people.aircraft": {type: "aircraft"},
      "people.employer": {type: "operators"}
    },
    linked: {
      quotes: quoteResource.quotes,
      aircraft: "external",
      operators: "external"
    }
  };

  return {
    quoteResource : quoteResource,
    aircraftResource : aircraftResource,
    operatorResource : operatorResource,
    bodyWithExternals: bodyWithExternals,
    denormalizedBodyWithExternals: denormalizedBodyWithExternals
  };
};

describe("fortune resource linker", function(){
  var sandbox;
  var actions = {
    getQuotes: function(){},
    getAircraft: function(){},
    getOperators: function(){}
  };
  var linker, trigger;

  beforeEach(function(){
    sandbox = sinon.sandbox.create();
    sandbox.stub(router, "onResponse");
    sandbox.stub(actions, "getAircraft");
    sandbox.stub(actions, "getOperators");
    sandbox.stub(actions, "getQuotes");
    router.actions = actions;
    linker = resourceLinker(router);

    router.actions.getAircraft.returns(when.resolve(stubs().aircraftResource));
    router.actions.getOperators.returns(when.resolve(stubs().operatorResource));

    trigger = router.onResponse.getCall(0).args[0];
  });

  afterEach(function(){
    sandbox.restore();
  });

  it('should use routers onResponse method to intercept requests', function(){
    router.onResponse.callCount.should.equal(1);
  });

  it('should properly split included paths', function(){
    var includes = ['aircraft', 'aircraft.images'];
    var groups = linker.groupIncludes(includes, stubs().bodyWithExternals);
    groups.aircraft.ids.should.eql(['OE-GGP', 'OE-GGP']);
    groups.aircraft.includes[0][0].should.equal('aircraft');
    groups.aircraft.includes[1][0].should.equal('aircraft');
    groups.aircraft.includes[1][1].should.equal('images');
  });

  it('should try to fetch linked resources once for each type and with unique ids', function(done){

    var includes = ['aircraft', 'aircraft.images', 'employer'].join(',');
    var initialRequest = {query: {include: includes}};
    linker.fetchExternals({query: {include: includes}}, stubs().bodyWithExternals).then(function(){
      router.actions.getAircraft.callCount.should.equal(1);
      var aircraft = router.actions.getAircraft.getCall(0);
      aircraft.args[0].should.eql(["OE-GGP"]);
      aircraft.args[1].should.eql({include: "images", parentRequest: initialRequest});
      router.actions.getOperators.callCount.should.equal(1);
      var operators = router.actions.getOperators.getCall(0);
      operators.args[0].should.eql(["12345"]);
      operators.args[1].should.eql({include: "", parentRequest: initialRequest});
      done();
    });
  });

  it("should return body for no includes", function(done){
    var body = {people: [{email: "test@test.com"}]};
    trigger({request: {}}, {body: body}).then(function(body){
      body.should.eql(body);
      done();
    });
  });

  it("should call through transparently when there is no body data", function(done){
    trigger(null, {}).then(function(body){
      should.not.exist(body);
      done();
    });
  });

  it("should attach resource linked data for external include", function(done){
    var includes = ["aircraft", "employer"].join(',');

    linker.fetchExternals({query: {include: includes}}, stubs().bodyWithExternals).then(function(merged){
      merged.linked.aircraft[0].id.should.equal("OE-GGP");
      merged.linked.operators[0].id.should.equal("12345");
      done();
    });
  });

  it("should not try to fetch non-external include", function(done){
    var includes = ["quotes", "aircraft"];
    linker.fetchExternals(includes, stubs().bodyWithExternals).then(function(){
      router.actions.getQuotes.callCount.should.equal(0);
      done();
    });
  });

  it("should ignore invalid include", function(done){
    var includes = ["wrong"];
    var groups = linker.groupIncludes(includes, stubs().bodyWithExternals);
    groups.should.eql({});
    (function(){
      linker.fetchExternals(includes, stubs().bodyWithExternals).then(function(data){
        should.not.exist(data.linked.wrong);
        done();
      });
    }).should.not.throw();
  });

  it.skip("should correctly handle linking when response is denormalized", function(done){
    var includes = ["quotes", "aircraft"];
    linker.fetchExternals({query: {include: 'quotes,aircraft'}}, stubs().denormalizedBodyWithExternals).then(function(data){
      router.actions.getAircraft.callCount.should.equal(1);
      var aircraft = router.actions.getAircraft.getCall(0);
      aircraft.args[0].should.eql(["OE-GGP"]);
      aircraft.args[1].should.eql({include: "images", parentRequest: initialRequest});
      router.actions.getOperators.callCount.should.equal(1);
      var operators = router.actions.getOperators.getCall(0);
      operators.args[0].should.eql(["12345"]);
      operators.args[1].should.eql({include: "", parentRequest: initialRequest});
      done();
    }).catch(done);
  });
});
