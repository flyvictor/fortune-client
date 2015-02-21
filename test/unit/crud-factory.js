var crudFactory = require("../../lib/crud-factory"),
    _ = require("lodash"),
    should = require("should"),
    when = require("when");


//REFACTOR: DRY diff syntax - same request tests.

module.exports = function(util){
  describe("crud", function(){
    describe("with fortune", function(){
      var crud;
      var mixin,
          fortune = {
            direct: {
              get: function(){},
              create: function(){},
              destroy: function(){},
              replace: function(){},
              update: function(){}
            }
          };
      
      beforeEach(function(){
        crud = crudFactory(fortune.direct, [
          {name: "resource", route: "resources"},
          {name: "singular-only", route: "singular-only"}
        ], ["get", "create", "replace", "update", "destroy"]);

        util.sandbox.stub(fortune.direct, "get").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "create").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "destroy").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "replace").returns(when.resolve());
        util.sandbox.stub(fortune.direct, "update").returns(when.resolve());
      });
      

      it("gets a single document", function(done){
        crud.fancy.getResource(0,{opts:true})().then(function(){
          fortune.direct.get.calledWith("resources",{
            params: {id: 0},
            opts: true,
            query: {}
          }).should.be.true;
          done();
        }).catch(done);
      });

      it("gets a collection of documents", function(done){
        crud.fancy.getResources(null,{opts:true})().then(function(){
          fortune.direct.get.calledWith("resources",{
            opts: true,
            query: {},
            params: {}
          }).should.be.true;
          done();
        }).catch(done);
      });

      it("creates a document", function(done){
        crud.fancy.createResource({data:1},{opts:1})().then(function(){
          fortune.direct.create.calledWith("resources", {
            body: {resources:  [{data:1}]},
            opts:1,
            query: {},
            params: {}
          }).should.be.true;
          done();
        }).catch(done);
      });

      it("destroys a document", function(done){
        crud.fancy.destroyResource(0, {opts:1})().then(function(){
          fortune.direct.destroy.calledWith("resources", {
            params: {id: 0},
            opts: 1,
            query: {}
          }).should.be.true;
          done();
        }).catch(done);
      });

      it("replaces a document", function(done){
        crud.fancy.replaceResource(0,{data:1},{opts:1})().then(function(){
          fortune.direct.replace.calledWith("resources", {
            params: {id: 0},
            body: {resources: [{data:1}]},
            opts:1,
            query: {}
          }).should.be.true;
          done();
        }).catch(done);
      });

      it("updates a document", function(done){
        crud.fancy.updateResource(0, {data:1}, {opts:1})().then(function(){
          fortune.direct.update.calledWith("resources", {
            params: {id: 0},
            body:[{data:1}],
            opts:1,
            query: {}
          }).should.be.true;
          done();
        }).catch(done);
      });

      it("passes auth credentials", function(done){
        crud.fancy.getResource(1, {access: {policy: ["default"]}})().then(function(){
          fortune.direct.get.calledWith("resources", {
            params: {id: 1},
            query: {},
            access: {
              policy: ["default"]
            }
          }).should.be.true;
          done();
        }).catch(done);
      });

      it("merges collection query into the request query filters", function(){
        crud.fancy.getResources({foo: 1}, {filter: {bar: 1} })(function(config){
          config.request.query.filter.should.be.eql({foo: 1});
          should.not.exist(config.request.query.foo);
        });

        crud.fancy.destroyResources({foo: 1}, {filter: {bar: 1} })(function(config){
          config.request.query.filter.should.be.eql({foo: 1});
          should.not.exist(config.request.query.foo);
        });
      });

      describe("for single-form resources", function(){
        it("gets a single document", function(done){
          crud.fancy.getSingularOnly(0,{opts:true})().then(function(){
            fortune.direct.get.calledWith("singular-only",{
              params: {id: 0},
              opts: true,
              query: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("gets a collection of documents", function(done){
          crud.fancy.getSingularOnly(null,{opts:true})().then(function(){
            fortune.direct.get.calledWith("singular-only",{
              opts: true,
              query: {},
              params: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("creates a document", function(done){
          crud.fancy.createSingularOnly({data:1},{opts:1})().then(function(){
            fortune.direct.create.calledWith("singular-only", {
              body: {"singular-only":  [{data:1}]},
              opts:1,
              query: {},
              params: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("destroys a document", function(done){
          crud.fancy.destroySingularOnly(0, {opts:1})().then(function(){
            fortune.direct.destroy.calledWith("singular-only", {
              params: {id: 0},
              opts: 1,
              query: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("replaces a document", function(done){
          crud.fancy.replaceSingularOnly(0,{data:1},{opts:1})().then(function(){
            fortune.direct.replace.calledWith("singular-only", {
              params: {id: 0},
              body: {"singular-only": [{data:1}]},
              opts:1,
              query: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("updates a document", function(done){
          crud.fancy.updateSingularOnly(0, {data:1}, {opts:1})().then(function(){
            fortune.direct.update.calledWith("singular-only", {
              params: {id: 0},
              body:[{data:1}],
              opts:1,
              query: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("merges collection query into the request query filters", function(){
          crud.fancy.getSingularOnly({foo: 1}, {filter: {bar: 1} })(function(config){
            config.request.query.filter.should.be.eql({foo: 1});
            should.not.exist(config.request.query.foo);
          });

          crud.fancy.destroySingularOnly({foo: 1}, {filter: {bar: 1} })(function(config){
            config.request.query.filter.should.be.eql({foo: 1});
            should.not.exist(config.request.query.foo);
          });
        });
      });

      describe("parent request", function(){
        it("is passed through to the crud callback", function(done){
          var parent = {parentRequest: "is me"};
          
          crud.fancy.getResource(0, {parentRequest: parent})(function(config){
            config.parentRequest.should.be.equal(parent);
            done();
          });
        });
      });

      describe("simple syntax", function(){
        it("gets a single document", function(done){
          crud.simple.get.resources(0,{opts:true})().then(function(){
            fortune.direct.get.calledWith("resources",{
              params: {id: 0},
              opts: true,
              query: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("gets a collection of documents", function(done){
          crud.simple.get.resources(null,{opts:true})().then(function(){
            fortune.direct.get.calledWith("resources",{
              opts: true,
              query: {},
              params: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("creates a document", function(done){
          crud.simple.create.resources({data:1},{opts:1})().then(function(){
            fortune.direct.create.calledWith("resources", {
              body: {resources:  [{data:1}]},
              opts:1,
              query: {},
              params: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("destroys a document", function(done){
          crud.simple.destroy.resources(0, {opts:1})().then(function(){
            fortune.direct.destroy.calledWith("resources", {
              params: {id: 0},
              opts: 1,
              query: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("replaces a document", function(done){
          crud.simple.replace.resources(0,{data:1},{opts:1})().then(function(){
            fortune.direct.replace.calledWith("resources", {
              params: {id: 0},
              body: {resources: [{data:1}]},
              opts:1,
              query: {}
            }).should.be.true;
            done();
          }).catch(done);
        });

        it("updates a document", function(done){
          crud.simple.update.resources(0, {data:1}, {opts:1})().then(function(){
            fortune.direct.update.calledWith("resources", {
              params: {id: 0},
              body:[{data:1}],
              opts:1,
              query: {}
            }).should.be.true;
            done();
          }).catch(done);
        });
      });
      it("rejects a promise if error returned", function(done) {
        fortune.direct.get.returns(when.resolve({ error: "Something wrong happened", detail: "MongoError: database not found" }));
        crud.fancy.getResource(0,{opts:true})().then(function(){
          done(new Error("Promise with error should be rejected"));
        }).catch(function(error) {
          error.message.should.eql("MongoError: database not found");
          done();
        });
      });
      it("rejects a promise with main error if detail is absent", function(done) {
        fortune.direct.get.returns(when.resolve({ error: "Something wrong happened" }));
        crud.fancy.getResource(0,{opts:true})().then(function(){
          done(new Error("Promise with error should be rejected"));
        }).catch(function(error) {
          error.message.should.eql("Something wrong happened");
          done();
        }).catch(done);
      });
    });
  });
};
