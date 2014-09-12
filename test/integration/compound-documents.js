var _ = require("lodash");

module.exports = function(util){
  describe("compound documents", function(){
    var client, ids;
    
    beforeEach(function(done){
      client = util.client;
      ids = util.ids;
      
      client.updateBand(ids.bands[0], {
        op: "add",
        path: "/bands/0/members/-",
        value: ids.users[0]
      }).then(function(){
        client.updateBand(ids.bands[0],{
          op: "add",
          path: "/bands/0/genres/-",
          value: ids.genres[0]
        });
      }).then(function(){
        done();
      });
    });
    
    it("are linked externally", function(done){
      client.getBand(ids.bands[0],{query: {include:"members"}}).then(function(body){
        body.linked.should.be.an.Object;
        body.linked.users.should.be.an.Array;
        body.linked.users.length.should.equal(1);
        body.linked.users[0].id.should.be.equal(ids.users[0]);

        done();
      });
    });


    it("support the light syntax for includes", function(done){
      return client.getBand(ids.bands[0],{include:"members"}).then(function(body){
        body.linked.should.be.an.Object;
        body.linked.users.should.be.an.Array;
        body.linked.users.length.should.equal(1);
        body.linked.users[0].id.should.be.equal(ids.users[0]);

        return client.getBand(ids.bands[0], {include: ["members","genres"]});
      }).then(function(body){
        body.linked.users.length.should.equal(1);
        body.linked.users[0].id.should.be.equal(ids.users[0]);
        
        body.linked.genres.length.should.equal(1);
        body.linked.genres[0].id.should.be.equal(ids.genres[0]);

        done();
      });
    });

    it("can be created in one call", function(done){
      client.createBand({
        name: "New band",
        genres: [0,2]
      }, {
        linked: {
          genres: [
            {id: 0, name: "genre0"},
            {id: 1, name: "genre1"},
            {id: 2, name: "genre2"}
          ]
        }
      }).then(function(data){
        return client.getBand(data.bands[0].id, {include: "genres"});
      }).then(function(data){
        data.bands[0].links.genres.length.should.be.equal(2);
        data.linked.genres.length.should.be.equal(2);

        _.pluck(data.linked.genres, "name").should.containDeep(["genre0","genre2"]);
        done();
      });
    });

  });
};
