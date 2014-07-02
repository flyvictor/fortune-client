var setup = require("./setup"),
    should = require("should"),
    fortuneClient = require("../../lib/fortune-client"),
    _ = require("lodash");


module.exports = function(util){
  describe("Fortune-client", function(){
    var client, resourceNames, ids = {};

    beforeEach(function(done){

      client = fortuneClient([setup.apps.users.fortune,
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

        done();
      });
    });

    it("requests resource metadata", function(){
      _.pluck(client.resources, "name").should.be.eql(resourceNames);
    });


    it("allows getting a collection of resources", function(done){
      client.getUsers().then(function(data){
        data.users.length.should.be.equal(setup.apps.users.resources.users.length);
        done();
      }).catch(function(err){ console.trace(err); });;
    });

    it("allows getting a single document", function(done){
      var id = ids.users[0];

      client.getUsers(id).then(function(data){
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

    it("allows destroying a document", function(done){
      var count, id;
      
      client.getUsers().then(function(data){
        count = data.users.length;
        count.should.be.above(0);
        return client.destroyUsers(id = data.users[0].id);
      }).then(function(){
        return client.getUsers();
      }).then(function(data){
        data.users.length.should.be.equal(count - 1);
        _.contains(_.pluck(data.users, "id"), id).should.be.false;
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
      
      client.getUsers(ids.users[0]).then(function(data){
        user = data.users[0];
        return client.replaceUsers(user.id, _.extend({}, user, {name: "1234"}));
      }).then(function(data){
        return client.getUsers(ids.users[0]);
      }).then(function(data){ 
        data.users[0].name.should.be.equal("1234");
        done();
      }).catch(function(err){ console.trace(err); });
    });

    it("allows updating a document", function(done){
      client.updateUsers(ids.users[0], [{
        op: "add",
        path: "/users/0/instruments/-",
        value: ids.instruments[0]
      }]).then(function(data){
        data.users[0].links.instruments.length.should.equal(1);
        data.users[0].links.instruments[0].should.equal(ids.instruments[0]);
        done();
      }).catch(function(err){ console.trace(err); });;
    });

    it("links external resources", function(done){
      client.updateBands(ids.bands[0], [{
        op: "add",
        path: "/bands/0/members/-",
        value: ids.users[0]
      }]).then(function(){
        return client.getBands(ids.bands[0],{query: {include:"members"}});
      }).then(function(body){
        body.linked.should.be.an.Object;
        body.linked.users.should.be.an.Array;
        body.linked.users.length.should.equal(1);
        body.linked.users[0].id.should.be.equal(ids.users[0]);

        done();
      });
    });

    it("returns JSON-compatible objects", function(done){
      client.getUsers().then(function(data){
        JSON.stringify(data).should.be.ok;
        done();
      });
    });

    it("reformats dashed resource names", function(done){
      client.getNaNaNaNas().then(function(data){
        data["na-na-na-nas"].length.should.be.above(0);
        done();
      });
    });
  });
};

