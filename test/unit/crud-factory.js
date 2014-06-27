var crudFactory = require("../../lib/crud-factory"),
    _ = require("lodash"),
    should = require("should"),
    when = require("when");

module.exports = function(util){
  describe("crud", function(){
    describe("with local fortune", function(){
      var mixin, fortune = {
        direct: {
          get: function(){},
          create: function(){},
          destroy: function(){},
          replace: function(){},
          update: function(){}
        }
      };
      
      beforeEach(function(){
        crud = crudFactory(fortune, [{name: "resource", route: "resources"}]);

        util.sandbox.stub(fortune.direct, "get").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "create").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "destroy").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "replace").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "update").returns(when.resolve());
      });
      

      it("gets a single document", function(done){
        crud.getResources(0,{opts:true})().then(function(){
          fortune.direct.get.calledWith("resources",{id: 0, opts: true}).should.be.true;
          done();
        });
      });

      it("gets a collection of documents", function(done){
        crud.getResources(null,{opts:true})().then(function(){
          fortune.direct.get.calledWith("resources",{opts: true, query: null}).should.be.true;
          done();
        });
      });

      it("creates a document", function(done){
        crud.createResources({data:1},{opts:1})().then(function(){
          fortune.direct.create.calledWith("resources", {
            body: {resources:  [{data:1}]},
            opts:1
          }).should.be.true;
          done();
        });
      });

      it("destroys a document", function(done){
        crud.destroyResources(0, {opts:1})().then(function(){
          fortune.direct.destroy.calledWith("resources", {id: 0, opts: 1}).should.be.true;
          done();
        });
      });

      it("replaces a document", function(done){
        crud.replaceResources(0,{data:1},{opts:1})().then(function(){
          fortune.direct.replace.calledWith("resources", {
            id: 0,
            body: {resources: [{data:1}]},
            opts:1
          }).should.be.true;
          done();
        });
      });

      it("updates a document", function(done){
        crud.updateResources(0, {data:1}, {opts:1})().then(function(){
          fortune.direct.update.calledWith("resources", {
            id: 0,
            body:[{data:1}],
            opts:1
          }).should.be.true;
          done();
        });
      });
    });
  });
};
