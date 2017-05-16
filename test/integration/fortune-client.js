var setup = require("./setup"),
    should = require("should"),
    fortuneClient = require("../../lib/fortune-client"),
    _ = require("lodash");


module.exports = function(util){
  describe("Fortune-client in proc", function(){
    var client, resourceNames, ids = {};

    beforeEach(function(done){
      util.client = client = fortuneClient([setup.apps.users.fortune,
                                            setup.apps.bands.fortune]);

      client.ready.then(function(){
        resourceNames = _.pluck(_.union.apply(_,_.map(setup.apps, function(app){
          return app.fortune.resources();
        })), "name");

        _.each(setup.apps, function(app){
          _.each(app.resources, function(documents, name){
            ids[name] = _.pluck(documents, "id");
          });
        });
        util.ids = ids;
        done();
      });
    });

    it("should have generated id", function(){
      _.isString(client.id).should.equal(true);
    });

    it("requests resource metadata", function(){
      _.pluck(client.resources, "name").sort().should.be.eql(resourceNames.sort());
    });


    it("allows getting a collection of resources", function(done){
      client.getUsers().then(function(data){
        data.users.length.should.be.equal(setup.apps.users.resources.users.length);
        done();
      }).catch(function(err){ console.trace(err); });;
    });

    it("allows getting a document based on a query", function(done){
      client.getUsers({name: "Sweeney"}).then(function(data){
        data.users.length.should.be.equal(1);
        data.users[0].name.should.be.equal("Sweeney");
        done();
      });
    });

    it("allows getting a single document", function(done){
      var id = ids.users[0];

      client.getUser(id).then(function(data){
        data.users.length.should.be.equal(1);
        data.users[0].id.should.be.equal(id);
        done();
      });
    });

    it("allows getting a set of documents", function(done){
      client.getUsers([ids.users[0], ids.users[1]]).then(function(body){
        body.users.length.should.be.equal(2);
        done();
      });
    });

    it("allows creating documents", function(done){
      var user1 = {
        name: "Joe",
        email: "joe@abc.com"
      }, user2 = {
        name: "Phil",
        email: "phil@abc.com"
      };

      client.createUsers([user1, user2]).then(function(data){
        data.users.length.should.be.equal(2);
        done();
      });
    });

    it("allows creating a single document", function(done){
      var user = {
        name: "Sam",
        email: "sam@abc.com"
      };

      client.createUser(user).then(function(data){
        data.users.length.should.be.equal(1);
        done();
      });
    });

    it("allows destroying a document", function(done){
      var count, id;

      client.getUsers().then(function(data){
        count = data.users.length;
        count.should.be.above(0);
        return client.destroyUser(id = data.users[0].id);
      }).then(function(){
        return client.getUsers();
      }).then(function(data){
        data.users.length.should.be.equal(count - 1);
        _.contains(_.pluck(data.users, "id"), id).should.be.false;
        done();
      });
    });

    it.skip("allows destroying a set of documents", function(done){
      var ids, count;

      client.getUsers().then(function(data){
        count = data.users.length;
        ids = [data.users[0].id,data.users[1].id];

        return client.destroyUsers(ids);
      }).then(function(){
        return client.getUsers();
      }).then(function(data){
        data.users.length.should.be.equal(count-2);
        _.contains(_.pluck(data.users, "id"), ids[0]).should.be.false;
        _.contains(_.pluck(data.users, "id"), ids[1]).should.be.false;
        done();
      });
    });

    it("allows destroying a collection", function(done){
      client.destroyUsers().then(function(){
        return client.getUsers();
      }).then(function(data){
        data.users.length.should.be.equal(0);
        done();
      });
    });


    it("allows replacing a document", function(done){
      var user;

      client.getUser(ids.users[0]).then(function(data){
        user = data.users[0];
        return client.replaceUser(user.id, _.extend({}, user, {name: "1234"}));
      }).then(function(data){
        return client.getUser(ids.users[0]);
      }).then(function(data){
        data.users[0].name.should.be.equal("1234");
        done();
      }).catch(function(err){ console.trace(err); });
    });

    it("allows updating a document", function(done){
      client.updateUser(ids.users[0], [{
        op: "add",
        path: "/users/0/instruments/-",
        value: ids.instruments[0]
      }]).then(function(data){
        data.users[0].links.instruments.length.should.equal(1);
        data.users[0].links.instruments[0].should.equal(ids.instruments[0]);
        done();
      }).catch(function(err){ console.trace(err); });;
    });

    it("returns JSON-compatible objects", function(done){
      client.getUsers().then(function(data){
        JSON.stringify(data).should.be.ok;
        done();
      });
    });

    it("camelcases dashed resource names", function(done){
      client.getNaNaNaNas().then(function(data){
        data["na-na-na-nas"].length.should.be.above(0);
        done();
      });
    });

    it("supports the light syntax for fields", function(done){
      client.getUsers(null, {fields: "name"}).then(function(data){
        var fields = _.keys(data.users[0]);

        fields.length.should.be.equal(2); // id is included regardless of fields
        _.contains(fields, "name").should.be.true;
        _.contains(fields, "id").should.be.true;

        return client.getUsers(null, {fields: ["name", "email"]});
      }).then(function(data){
        var fields = _.keys(data.users[0]);

        fields.length.should.be.equal(3);
        _.contains(fields, "name").should.be.true;
        _.contains(fields, "id").should.be.true;
        _.contains(fields, "email").should.be.true;
        done();
      });
    });

    it("passes the parent request context option to onRequest", function(done){
      var parent = { parentRequest: "is me" };

      client.onRequest(function(config){
        config.parentRequest.should.be.equal(parent);
        done();
      });

      client.getUsers(null, {parentRequest: parent});
    });

    it("passes the parent request context option to onResponse", function(done){
      var parent = { parentRequest: "is me" };

      client.onResponse(function(config){
        config.parentRequest.should.be.equal(parent);
        done();
      });

      client.getUsers(null, {parentRequest: parent});
    });


    describe("alternative programmatic syntax", function(){
      it("supports alternative programmatic syntax", function(done){
        client.getUsers().then(function(data){
          client.get("users").then(function(data2){
            data2.should.be.eql(data);
          });
        }).then(function(){
          client.getBands().then(function(data){
            client.get("bands").then(function(data2){
              data2.should.be.eql(data);
              done();
            });
          });
        });
      });
      it("supports queries in programmatic syntax", function(done){
        client.getUsers({name: "Bob"}).then(function(reg){
          client.get("users", {name: "Bob"}).then(function(prog){
            reg.should.eql(prog);
            done();
          });
        });
      });
      it("supports additional parameters", function(done){
        client.updateUsers(ids.users[0],[
          {op: 'add', path: '/users/0/links/instruments', value: ids.instruments[0]}
        ]).then(function(){
          client.getUsers({name: "Bob"}, {include: "instruments"}).then(function(reg){
            client.get("users", {name: "Bob"}, {include: "instruments"}).then(function(prog){
              reg.should.eql(prog);
              done();
            });
          });
        });
      });
      it("should not duplicate included resources from different paths", function(done){
        client.updateUsers(ids.users[0], [
          {op: 'replace', path: '/users/0/links/band', value: [ids.bands[0]]},
          {op: 'replace', path: '/users/0/links/bababand', value: [ids.bands[0]]}
        ]).then(function(){
          client.getUsers(ids.users[0], {include: "band,bababand"}).then(function(res){
            res.linked.bands.length.should.equal(1);
            done();
          });
        });
      });
    });

    util.requireSpecs(__dirname, ["compound-documents"]);
  });

  describe("Fortune-client remote", function(){
    var client, resourceNames, ids = {};

    beforeEach(function(done){
      util.client = client = fortuneClient(['http://localhost:9782', 'http://localhost:9783']);

      client.ready.then(function(){
        resourceNames = _.pluck(_.union.apply(_,_.map(setup.apps, function(app){
          return app.fortune.resources();
        })), "name");

        _.each(setup.apps, function(app){
          _.each(app.resources, function(documents, name){
            ids[name] = _.pluck(documents, "id");
          });
        });
        util.ids = ids;
        done();
      });
    });

    it("should have generated id", function(){
      _.isString(client.id).should.equal(true);
    });

    it("requests resource metadata", function(){
      _.pluck(client.resources, "name").sort().should.be.eql(resourceNames.sort());
    });

    it("allows getting a collection of resources", function(done){
      client.getUsers().then(function(data){
        data.users.length.should.be.equal(setup.apps.users.resources.users.length);
        done();
      }).catch(function(err){ console.trace(err); });;
    });

    it("allows getting a document based on a query", function(done){
      client.getUsers({name: "Sweeney"}).then(function(data){
        data.users.length.should.be.equal(1);
        data.users[0].name.should.be.equal("Sweeney");
        done();
      });
    });

    it("allows getting a related document based on a query", function(done){
      client.updateUser(ids.users[0], [{
        op: "add",
        path: "/users/0/instruments/-",
        value: ids.instruments[0]
      }]).then(function(data){
        data.users[0].links.instruments.length.should.equal(1);
        data.users[0].links.instruments[0].should.equal(ids.instruments[0]);
        client.getUsers({
          instruments: {name: 'guitar'}
        }).then(function(res){
          res.users.length.should.equal(1);
          res.users[0].id.should.equal(ids.users[0]);
          done();
        });
      }).catch(function(err){ console.trace(err); });
    });

    it("allows getting a single document", function(done){
      var id = ids.users[0];

      client.getUser(id).then(function(data){
        data.users.length.should.be.equal(1);
        data.users[0].id.should.be.equal(id);
        done();
      });
    });

    it("allows getting a set of documents", function(done){
      client.getUsers([ids.users[0], ids.users[1]]).then(function(body){
        body.users.length.should.be.equal(2);
        done();
      });
    });

    it("allows creating documents", function(done){
      var user1 = {
        name: "Joe",
        email: "joe@abc.com"
      }, user2 = {
        name: "Phil",
        email: "phil@abc.com"
      };

      client.createUsers([user1, user2]).then(function(data){
        data.users.length.should.be.equal(2);
        done();
      });
    });

    it("allows creating a single document", function(done){
      var user = {
        name: "Sam",
        email: "sam@abc.com"
      };

      client.createUser(user).then(function(data){
        data.users.length.should.be.equal(1);
        done();
      });
    });

    it("allows destroying a document", function(done){
      var count, id;

      client.getUsers().then(function(data){
        count = data.users.length;
        count.should.be.above(0);
        return client.destroyUser(id = data.users[0].id);
      }).then(function(){
        return client.getUsers();
      }).then(function(data){
        data.users.length.should.be.equal(count - 1);
        _.contains(_.pluck(data.users, "id"), id).should.be.false;
        done();
      });
    });

    it.skip("allows destroying a set of documents", function(done){
      var ids, count;

      client.getUsers().then(function(data){
        count = data.users.length;
        ids = [data.users[0].id,data.users[1].id];

        return client.destroyUsers(ids);
      }).then(function(){
        return client.getUsers();
      }).then(function(data){
        data.users.length.should.be.equal(count-2);
        _.contains(_.pluck(data.users, "id"), ids[0]).should.be.false;
        _.contains(_.pluck(data.users, "id"), ids[1]).should.be.false;
        done();
      });
    });

    it("allows destroying a collection", function(done){
      client.destroyUsers().then(function(){
        return client.getUsers();
      }).then(function(data){
        data.users.length.should.be.equal(0);
        done();
      });
    });


    it("allows replacing a document", function(done){
      var user;

      client.getUser(ids.users[0]).then(function(data){
        user = data.users[0];
        return client.replaceUser(user.id, _.extend({}, user, {name: "1234"}));
      }).then(function(data){
        return client.getUser(ids.users[0]);
      }).then(function(data){
        data.users[0].name.should.be.equal("1234");
        done();
      }).catch(function(err){ console.trace(err); });
    });

    it("allows updating a document", function(done){
      client.updateUser(ids.users[0], [{
        op: "add",
        path: "/users/0/instruments/-",
        value: ids.instruments[0]
      }]).then(function(data){
        data.users[0].links.instruments.length.should.equal(1);
        data.users[0].links.instruments[0].should.equal(ids.instruments[0]);
        done();
      }).catch(function(err){ console.trace(err); });;
    });

    it("returns JSON-compatible objects", function(done){
      client.getUsers().then(function(data){
        JSON.stringify(data).should.be.ok;
        done();
      });
    });

    it("camelcases dashed resource names", function(done){
      client.getNaNaNaNas().then(function(data){
        data["na-na-na-nas"].length.should.be.above(0);
        done();
      });
    });

    it("supports the light syntax for fields", function(done){
      client.getUsers(null, {fields: "name"}).then(function(data){
        var fields = _.keys(data.users[0]);

        fields.length.should.be.equal(2); // id is included regardless of fields
        _.contains(fields, "name").should.be.true;
        _.contains(fields, "id").should.be.true;

        return client.getUsers(null, {fields: ["name", "email"]});
      }).then(function(data){
        var fields = _.keys(data.users[0]);

        fields.length.should.be.equal(3);
        _.contains(fields, "name").should.be.true;
        _.contains(fields, "id").should.be.true;
        _.contains(fields, "email").should.be.true;
        done();
      });
    });

    it("passes the parent request context option to onRequest", function(done){
      var parent = { parentRequest: "is me" };

      client.onRequest(function(config){
        config.parentRequest.should.be.equal(parent);
        done();
      });

      client.getUsers(null, {parentRequest: parent});
    });

    it("passes the parent request context option to onResponse", function(done){
      var parent = { parentRequest: "is me" };

      client.onResponse(function(config){
        config.parentRequest.should.be.equal(parent);
        done();
      });

      client.getUsers(null, {parentRequest: parent});
    });


    it("supports alternative programmatic syntax", function(done){
      client.getUsers().then(function(data){
        client.get("users").then(function(data2){
          data2.should.be.eql(data);
        });
      }).then(function(){
        client.getBands().then(function(data){
          client.get("bands").then(function(data2){
            data2.should.be.eql(data);
            done();
          });
        });
      });
    });

    describe("denormalization", function(){
      beforeEach(function(done){
        client.updateUser(ids.users[0], [
          {op: 'add', path: '/users/0/instruments', value: ids.instruments[0]},
          {op: 'replace', path: '/users/0/address', value: ids.addresses[0]},
          {op: 'replace', path: '/users/0/lover', value: ids.users[1]}
        ]).then(function(){
          done();
        });
      });
      it('should denormalize one-to-one refs', function(done){
        client.getUser(ids.users[0], {include: 'lover', denormalize: true}).then(function(res){
          res.users[0].links.lover.should.be.an.Object;
          res.users[0].links.lover.id.should.equal(ids.users[1]);
          done();
        });
      });
      it('should denormalize one-to-many refs', function(done){
        client.getUser(ids.users[0], {include: 'address', denormalize: true}).then(function(res){
          res.users[0].links.address.should.be.an.Object;
          res.users[0].links.address.id.should.equal(ids.addresses[0]);
          done();
        })
      });
      it('should denormalize many-to-one refs', function(done){
        client.getUser(ids.users[0], {include: 'instruments', denormalize: true}).then(function(res){
          res.users[0].links.instruments.length.should.equal(1);
          res.users[0].links.instruments[0].should.be.an.Object;
          res.users[0].links.instruments[0].id.should.equal(ids.instruments[0]);
          done();
        });
      });
      it('should denormalize many-to-many refs');
      it('should denormalize deeply linked documents', function(done){
        client.getAddress(ids.addresses[0], {include: 'inhabitants,inhabitants.instruments', denormalize: true}).then(function(res){
          res.addresses[0].links.inhabitants[0].should.be.an.Object;
          res.addresses[0].links.inhabitants[0].links.instruments[0].should.be.an.Object;
          done();
        }).catch(done);
      });
      it('should denormalize external resources'); //does not fetch external resources properly atm
      it('should not fail on circular references', function(done){
        client.getUser(ids.users[0], {include: 'lover,lover.lover', denormalize: true}).then(function(res){
          res.users[0].id.should.equal(ids.users[0]);
          res.users[0].links.lover.should.be.an.Object;
          res.users[0].links.lover.id.should.equal(ids.users[1]);
          res.users[0].links.lover.links.lover.should.be.an.Object;
          res.users[0].links.lover.links.lover.id.should.equal(ids.users[0]);
          done();
        }).catch(done);
      });
    });

    util.requireSpecs(__dirname, ["compound-documents"]);
  });
};

