var actionFactory = require("../../lib/actions-factory"),
    _ = require("lodash"),
    should = require("should");


module.exports = function(util){
  describe("actions", function(){
    describe("with fortune", function(){
      var actions, data;
      var mixin,
          fortune = {
            direct: {
              callAction: function(){},
              callGenericAction: function () {}
            }
          };
      
        beforeEach(function(){
            data = { testBody: "test"  };

            actions = actionFactory(fortune.direct, [
            {
                name: "resource", 
                route: "resources", 
                actions: {
                    "first-action": 
                    {
                        name: 'first-action',
                        method: 'POST',
                        isGeneric: false
                    }, 
                    "second-action": 
                    {
                        name: 'second-action',
                        method: 'GET', 
                        isGeneric: true
                    
                    }

                }
            },{
                name: "singular-only", 
                route: "singular-only",
                actions: {
                    "first-action": 
                    {
                        name: 'first-action',
                        method: 'POST',
                    }, 
                    "second-action": 
                    {
                        name: 'second-action',
                        method: 'POST'
                    
                    }

                }
            }]);

            util.sandbox.stub(fortune.direct, "callAction").returns(Promise.resolve());
            util.sandbox.stub(fortune.direct, "callGenericAction").returns(Promise.resolve());
        });

        it("should call callAction if isn t a generic action", function(done){
            actions.list.callResourceFirstAction.call(actions.list, "my-id", null, {})().then(function() {
                fortune.direct.callAction.callCount.should.be.eql(1);
                fortune.direct.callGenericAction.callCount.should.be.eql(0);
                done();
            }).catch(done); 
        });
        it("should call callGenericAction if is a generic action", function(done){
            actions.list.callResourceSecondAction.call(actions.list, "my-id", null, {})().then(function() {
                fortune.direct.callGenericAction.callCount.should.be.eql(1);
                fortune.direct.callAction.callCount.should.be.eql(0);
                done();
            }).catch(done); 
        });
        


        it("should put data on body if method is not in [DELETE, GET]", function(done){

            actions.list.callResourceFirstAction.call(actions.list, "my-id", data, {})().then(function(){
                fortune.direct.callAction.calledWith("resources", "POST", {
                    query: {},
                    params: {id: "my-id", key:"first-action"},
                    body: { testBody: "test"  }
                }).should.be.true;
                done();
            }).catch(done);  
        });
        it("should put data on query obj if GET request without id", function(done){
            actions.list.callResourceSecondAction.call(actions.list, null, data, {})().then(function() {
                fortune.direct.callGenericAction.calledWith("resources", "GET", {
                    query: { testBody: "test"  },
                    params: { action:"second-action"},
                }).should.be.true;
                done();
            }).catch(done); 
        });
        it("should put data on query obj if DELETE request without id", function(done){
            actions.list.callResourceSecondAction.call(actions.list, null, data, {})().then(function() {
                fortune.direct.callGenericAction.calledWith("resources", "GET", {
                    query: { testBody: "test"  },
                    params: { action:"second-action"},
                }).should.be.true;
                done();
            }).catch(done); 
        });

        it("should pass params.id if the resource id is passed to the action", function(done){
            actions.list.callResourceFirstAction.call(actions.list, "my-id", null, {})().then(function() {
                fortune.direct.callAction.getCall(0).args[2].params.id.should.be.eql("my-id");
                done();
            }).catch(done); 
        });

    });
  });
};
