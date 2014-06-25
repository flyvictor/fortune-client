var crud = require("../../lib/crud"),
    should = require("should"),
    when = require("when");

module.exports = function(util){
  describe("crud", function(){
    var mixin;
    
    describe("with local fortune", function(){
      var fortune = {
        direct: {
          get: function(){},
          create: function(){},
          destroy: function(){},
          replace: function(){},
          update: function(){}
        }
      };
      
      beforeEach(function(){
        mixin = crud(fortune, [{name: "resource", route: "resources"}]);
        util.sandbox.stub(fortune.direct, "get").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "create").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "destroy").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "replace").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "update").returns(when.resolve());
      });
      

      it("gets a single document", function(done){
        mixin.getResources(0,{opts:true}).then(function(){
          fortune.direct.get.calledWith("resources",0, {opts: true}).should.be.true;
          done();
        });
      });

      it("gets a collection of documents", function(done){
        mixin.getResources(null,{opts:true}).then(function(){
          fortune.direct.get.calledWith("resources",null,{opts: true}).should.be.true;
          done();
        });
      });

      it("creates a document", function(done){
        mixin.createResources({data:1},{opts:1}).then(function(){
          fortune.direct.create.calledWith("resources", {data:1}, {opts:1}).should.be.true;
          done();
        });
      });

      it("destroys a document", function(done){
        mixin.destroyResources(0, {opts:1}).then(function(){
          fortune.direct.destroy.calledWith("resources", 0, {opts: 1}).should.be.true;
          done();
        });
      });

      it("replaces a document", function(done){
        mixin.replaceResources(0,{data:1},{opts:1}).then(function(){
          fortune.direct.replace.calledWith("resources", 0, {data:1}, {opts:1}).should.be.true;
          done();
        });
      });

      it("updates a document", function(done){
        mixin.updateResources(0, {data:1}, {opts:1}).then(function(){
          fortune.direct.update.calledWith("resources", 0, {data:1}, {opts:1}).should.be.true;
          done();
        });
      });
    });
  });
};
