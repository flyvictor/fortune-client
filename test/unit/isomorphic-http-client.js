require('should');
const sinon = require('sinon');
const client = require('../../lib/isomorphic-http-client');

describe('isomorphic-http-client', function(){
  describe('main', function(){
    beforeEach(function(){
      sinon.stub(client, '_send').returns(Promise.resolve({}));
      sinon.stub(client, '_createOAuthHeader').returns('signature');
    });
    afterEach(function(){
      client._send.restore();
      client._createOAuthHeader.restore();
    });
    it('GET', function(){
        return client.get({
          uri: 'http://host.com',
          qs: {filter: {a: 1}},
          headers: {a: 1},
          oauth: {consumer_key: 'key', consumer_secret: 'secret'}
        }).then(function(){
          client._send.callCount.should.equal(1);
          client._send.getCall(0).args[0].should.eql({
            fullUrl: 'http://host.com?filter[a]=1',
            method: 'GET',
            headers: {
              a: 1,
              Authorization: 'signature'
            }
          });
        });
      });
    it('POST', function(){
      return client.post({
        uri: 'http://host.com/path',
        headers: {a: 1},
        oauth: {consumer_key: 'key', consumer_secret: 'secret'},
        body: {a: 1}
      }).then(function(){
        client._send.callCount.should.equal(1);
        client._send.getCall(0).args[0].should.eql({
          fullUrl: 'http://host.com/path?',
          method: 'POST',
          headers: {
            a: 1,
            'content-type': 'application/json',
            Authorization: 'signature'
          },
          body: {a: 1}
        });
      });
    });
    it('PATCH', function(){
      return client.patch({
        uri: 'http://host.com/path',
        headers: {a: 1},
        oauth: {consumer_key: 'key', consumer_secret: 'secret'},
        body: [{a: 1}]
      }).then(function(){
        client._send.callCount.should.equal(1);
        client._send.getCall(0).args[0].should.eql({
          fullUrl: 'http://host.com/path?',
          method: 'PATCH',
          headers: {
            a: 1,
            'content-type': 'application/json',
            Authorization: 'signature'
          },
          body: [{a: 1}]
        });
      });
    });
    it('PUT', function(){
      return client.put({
        uri: 'http://host.com/path',
        method: 'PUT',
        headers: {a: 1},
        oauth: {consumer_key: 'key', consumer_secret: 'secret'},
        body: {a: 1}
      }).then(function(){
        client._send.callCount.should.equal(1);
        client._send.getCall(0).args[0].should.eql({
          fullUrl: 'http://host.com/path?',
          method: 'PUT',
          headers: {
            a: 1,
            'content-type': 'application/json',
            Authorization: 'signature'
          },
          body: {a: 1}
        });
      });
    });
    it('DELETE', function(){
      return client.delete({
        uri: 'http://host.com/path',
        headers: {a: 1},
        oauth: {consumer_key: 'key', consumer_secret: 'secret'}
      }).then(function(){
        client._send.callCount.should.equal(1);
        client._send.getCall(0).args[0].should.eql({
          fullUrl: 'http://host.com/path?',
          method: 'DELETE',
          headers: {
            a: 1,
            Authorization: 'signature'
          }
        });
      });
    });
  });
  describe('utils', function(){
    describe('query', function(){
      it('should correctly stringify key-value pairs', function(){
        client._querystringStringify({a: 1}).should.equal('a=1');
        client._querystringStringify({a: 1, b: 2, c: 3}).should.equal('a=1&b=2&c=3');
      });
      it('should correctly stringify deep objects', function(){
        client._querystringStringify({a: {b: 1}}).should.equal('a[b]=1')
      });
      it('should correctly stringify arrays', function(){
        client._querystringStringify({a: [1, 2]}).should.equal('a[0]=1&a[1]=2');
        client._querystringStringify({a: [{b: 1}, {c: 2}]}).should.equal('a[0][b]=1&a[1][c]=2');
        client._querystringStringify({a: [{b: 1}, {c: 2}]}).should.equal('a[0][b]=1&a[1][c]=2');
      });
    });
    describe('OAuth signature', function(){
      describe('_createBaseString', function(){
        let oauth;
        beforeEach(function(){
          oauth = {nonce: 'abcd', consumer_key: 'key', timestamp: 123};
        });
        it('should build correct base strig for signature in simple case', function(){
          const config = {method: 'GET', uri: 'http://host.com/path'};
          client._createBaseString(config, oauth).should.equal(
            'GET&http%3A%2F%2Fhost.com%2Fpath&oauth_consumer_key%3Dkey%26oauth_nonce%3Dabcd%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D123%26oauth_token%3D%26oauth_version%3D1.0'
          );
        });
        it('should include querystring params on GET requests', function(){
          const config = {method: 'GET', qs: {filter: {a: {b: 1}}}, uri: 'http://host.com/path'};
          client._createBaseString(config, oauth).should.equal(
            'GET&http%3A%2F%2Fhost.com%2Fpath&filter%255Ba%255D%255Bb%255D%3D1%26oauth_consumer_key%3Dkey%26oauth_nonce%3Dabcd%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D123%26oauth_token%3D%26oauth_version%3D1.0'
          );
        });
        it('should not include querystring params on other request methods', function(){
          const config = {method: 'POST', qs: {filter: {a: {b: 1}}}, uri: 'http://host.com/path'};
          client._createBaseString(config, oauth).should.equal(
            'POST&http%3A%2F%2Fhost.com%2Fpath&oauth_consumer_key%3Dkey%26oauth_nonce%3Dabcd%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D123%26oauth_token%3D%26oauth_version%3D1.0'
          );
        });
      });
    });
  });
});