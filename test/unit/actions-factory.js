var actionFactory = require("../../lib/actions-factory"),
    _ = require("lodash"),
    should = require("should"),
    when = require("when");


//REFACTOR: DRY diff syntax - same request tests.

module.exports = function(util){
  describe("actions", function(){
    describe("with fortune", function(){
      var actions;
      var mixin,
          fortune = {
            direct: {
              callAction: function(){},
            }
          };
      
        beforeEach(function(){
            actions = actionFactory(fortune.direct, [
            {
                name: "resource", 
                route: "resources", 
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

            util.sandbox.stub(fortune.direct, "callAction").returns(when.resolve());
        });
        


        it("call an action", function(done){
            var data = {
              params: {},
              body: {
                  testBody: "test"
              }
            };
            actions.list.callResourceFirstAction("my-id", "POST", data)().then(function(){
                fortune.direct.callAction.calledWith("resources", "POST", {
                    params: {id: "my-id", key:"first-action"},
                    body: data.body
                }).should.be.true;
                done();
            }).catch(done);  
        });
        it("should crash withoud id", function(done){
            var data = {
              params: {},
              body: {
                  testBody: "test"
              }
            };

            try 
            {
                actions.list.callResourceFirstAction(null, "POST", data)().then(function(){
                    done(Error("should be crashed"));
                }).catch(done);  
            }
            catch (e) {
                done(); 
            }
        });

    });
  });
};
