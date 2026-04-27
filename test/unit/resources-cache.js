var resourcesCache = require("../../lib/cache/resources-cache"),
    should = require("should");


module.exports = function(util){
  describe("resources-cache", function(){
    var cache;

    beforeEach(function(){
      cache = {
        get: util.sandbox.stub(),
        set: util.sandbox.stub().resolves(),
        clear: util.sandbox.stub().resolves()
      };
    });

    it("should return parsed cached resources without ttl", async function(){
      cache.get.withArgs("fortune-client:resources:http://api.test", null).resolves(JSON.stringify([
        { route: "users" }
      ]));

      const result = await resourcesCache.get(cache, "http://api.test");

      result.should.eql([
        { route: "users" }
      ]);
    });

    it("should return cached resources when ttl has not expired", async function(){
      cache.get.withArgs("fortune-client:resources:http://api.test:last-refresh", null).resolves(
        new Date(Date.now() - 1000).toISOString()
      );
      cache.get.withArgs("fortune-client:resources:http://api.test", null).resolves(JSON.stringify([
        { route: "users" }
      ]));

      const result = await resourcesCache.get(cache, "http://api.test", {
        ttlMs: 24 * 60 * 60 * 1000
      });

      result.should.eql([
        { route: "users" }
      ]);
      cache.clear.callCount.should.eql(0);
    });

    it("should clear cached resources when ttl has expired", async function(){
      cache.get.withArgs("fortune-client:resources:http://api.test:last-refresh", null).resolves(
        new Date(Date.now() - 1001).toISOString()
      );

      const result = await resourcesCache.get(cache, "http://api.test", {
        ttlMs: 1000
      });

      should(result).be.null;
      cache.clear.callCount.should.eql(2);
      cache.clear.firstCall.args[0].should.eql("fortune-client:resources:http://api.test");
      cache.clear.secondCall.args[0].should.eql("fortune-client:resources:http://api.test:last-refresh");
    });
  });
};
