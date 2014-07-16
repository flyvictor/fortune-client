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
        crud = crudFactory(fortune, [
          {name: "resource", route: "resources"},
          {name: "singular-only", route: "singular-only"}
        ]);
        util.sandbox.stub(fortune.direct, "get").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "create").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "destroy").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "replace").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "update").returns(when.resolve());
      });
      

      it("gets a single document", function(done){
        crud.getResource(0,{opts:true})().then(function(){
          fortune.direct.get.calledWith("resources",{
            params: {id: 0},
            opts: true,
            query: {}
          }).should.be.true;
          done();
        });
      });

      it("gets a collection of documents", function(done){
        crud.getResources(null,{opts:true})().then(function(){
          fortune.direct.get.calledWith("resources",{
            opts: true,
            query: {},
            params: {}
          }).should.be.true;
          done();
        });
      });

      it("creates a document", function(done){
        crud.createResource({data:1},{opts:1})().then(function(){
          fortune.direct.create.calledWith("resources", {
            body: {resources:  [{data:1}]},
            opts:1,
            query: {},
            params: {}
          }).should.be.true;
          done();
        }).catch(function(err){ console.trace(err); });
      });

      it("destroys a document", function(done){
        crud.destroyResource(0, {opts:1})().then(function(){
          fortune.direct.destroy.calledWith("resources", {
            params: {id: 0},
            opts: 1,
            query: {}
          }).should.be.true;
          done();
        });
      });

      it("replaces a document", function(done){
        crud.replaceResource(0,{data:1},{opts:1})().then(function(){
          fortune.direct.replace.calledWith("resources", {
            params: {id: 0},
            body: {resources: [{data:1}]},
            opts:1,
            query: {}
          }).should.be.true;
          done();
        });
      });

      it("updates a document", function(done){
        crud.updateResource(0, {data:1}, {opts:1})().then(function(){
          fortune.direct.update.calledWith("resources", {
            params: {id: 0},
            body:[{data:1}],
            opts:1,
            query: {}
          }).should.be.true;
          done();
        });
      });

      it("merges collection query into the request query filters", function(){
        crud.getResources({foo: 1}, {filter: {bar: 1} })(function(request){
          request.options.query.filter.should.be.eql({foo: 1});
          should.not.exist(request.options.query.foo);
        });

        crud.destroyResources({foo: 1}, {filter: {bar: 1} })(function(request){
          request.options.query.filter.should.be.eql({foo: 1});
          should.not.exist(request.options.query.foo);
        });
      });

      describe("for single-form resources", function(){
        it("gets a single document", function(done){
          crud.getSingularOnly(0,{opts:true})().then(function(){
            fortune.direct.get.calledWith("singular-only",{
              params: {id: 0},
              opts: true,
              query: {}
            }).should.be.true;
            done();
          });
        });

        it("gets a collection of documents", function(done){
          crud.getSingularOnly(null,{opts:true})().then(function(){
            fortune.direct.get.calledWith("singular-only",{
              opts: true,
              query: {},
              params: {}
            }).should.be.true;
            done();
          });
        });

        it("creates a document", function(done){
          crud.createSingularOnly({data:1},{opts:1})().then(function(){
            fortune.direct.create.calledWith("singular-only", {
              body: {"singular-only":  [{data:1}]},
              opts:1,
              query: {},
              params: {}
            }).should.be.true;
            done();
          });
        });

        it("destroys a document", function(done){
          crud.destroySingularOnly(0, {opts:1})().then(function(){
            fortune.direct.destroy.calledWith("singular-only", {
              params: {id: 0},
              opts: 1,
              query: {}
            }).should.be.true;
            done();
          });
        });

        it("replaces a document", function(done){
          crud.replaceSingularOnly(0,{data:1},{opts:1})().then(function(){
            fortune.direct.replace.calledWith("singular-only", {
              params: {id: 0},
              body: {"singular-only": [{data:1}]},
              opts:1,
              query: {}
            }).should.be.true;
            done();
          });
        });

        it("updates a document", function(done){
          crud.updateSingularOnly(0, {data:1}, {opts:1})().then(function(){
            fortune.direct.update.calledWith("singular-only", {
              params: {id: 0},
              body:[{data:1}],
              opts:1,
              query: {}
            }).should.be.true;
            done();
          });
        });

        it("merges collection query into the request query filters", function(){
          crud.getSingularOnly({foo: 1}, {filter: {bar: 1} })(function(request){
            request.options.query.filter.should.be.eql({foo: 1});
            should.not.exist(request.options.query.foo);
          });

          crud.destroySingularOnly({foo: 1}, {filter: {bar: 1} })(function(request){
            request.options.query.filter.should.be.eql({foo: 1});
            should.not.exist(request.options.query.foo);
          });
        });
        
      });
    });
  });
};
