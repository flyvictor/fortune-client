module.exports = function(util){
  describe("compound documents", function(){
    var client, ids;
    
    beforeEach(function(done){
      client = util.client;
      ids = util.ids;
      
      client.updateBands(ids.bands[0], {
        op: "add",
        path: "/bands/0/members/-",
        value: ids.users[0]
      }).then(function(){
        client.updateBands(ids.bands[0],{
          op: "add",
          path: "/bands/0/genres/-",
          value: ids.genres[0]
        });
      }).then(function(){
        done();
      });
    });
    
    it("are linked externally", function(done){
      client.getBands(ids.bands[0],{query: {include:"members"}}).then(function(body){
        body.linked.should.be.an.Object;
        body.linked.users.should.be.an.Array;
        body.linked.users.length.should.equal(1);
        body.linked.users[0].id.should.be.equal(ids.users[0]);

        done();
      });
    });

    it("support the light syntax for includes", function(done){
      return client.getBands(ids.bands[0],{include:"members"}).then(function(body){
        body.linked.should.be.an.Object;
        body.linked.users.should.be.an.Array;
        body.linked.users.length.should.equal(1);
        body.linked.users[0].id.should.be.equal(ids.users[0]);

        return client.getBands(ids.bands[0], {include: ["members","genres"]});
      }).then(function(body){
        body.linked.users.length.should.equal(1);
        body.linked.users[0].id.should.be.equal(ids.users[0]);
        
        body.linked.genres.length.should.equal(1);
        body.linked.genres[0].id.should.be.equal(ids.genres[0]);

        done();
      });
    });
  });
};
