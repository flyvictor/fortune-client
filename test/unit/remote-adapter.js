var remoteAdapter = require('../../lib/remote-adapter');
var request = require('request');
var sinon = require('sinon');
var _ = require('lodash');

module.exports = function() {
  xdescribe('remote-adapter', function() {
    var adapter, host, expectedParams;

    beforeEach(function() {
      host = 'https://some-url.com';
      adapter = remoteAdapter(host);
      sinon.stub(request, 'get').yields(null, { body: { users: [{ id: 'userId' }]}});
      sinon.stub(request, 'post').yields(null, { body: { users: [{ id: 'newId' }]}});
      sinon.stub(request, 'put').yields(null, { body: { users: [{ id: 'replacedId' }]}});
      sinon.stub(request, 'patch').yields(null, { body: { users: [{ id: 'userId', firstName: 'Tom' }]}});
      sinon.stub(request, 'delete').yields(null, { body: { users: []}});
    });
    afterEach(function() {
      _.each(['get', 'post', 'put', 'patch', 'delete'], function(method) {
        request[method].restore();
      });
    });

    it('should send GET request with proper parameters', function() {
      expectedParams = {
        json: true,
        uri: 'https://some-url.com/users/userId',
        qs: undefined
      };
      return adapter.get('users', { params: { id: 'userId' }}).then(function(res) {
        request.get.should.be.calledOnce;
        request.get.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: [{ id: 'userId' }]}});
      });
    });

    it('should send POST request with proper parameters', function() {
      expectedParams = {
        json: true,
        uri: 'https://some-url.com/users',
        body: {
          id: 'newId'
        }
      };
      return adapter.create('users', { body: { id: 'newId' }}).then(function(res) {
        request.post.should.be.calledOnce;
        request.post.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: [{ id: 'newId' }]}});
      });
    });

    it('should send DELETE request with proper parameters', function() {
      var expectedParams = {
        json: true,
        uri: 'https://some-url.com/users/userId',
      };
      return adapter.destroy('users', { params: { id: 'userId' }}).then(function(res) {
        request.delete.should.be.calledOnce;
        request.delete.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: []}});
      });
    });

    it('should send PUT request with proper parameters', function() {
      var expectedParams = {
        json: true,
        uri: 'https://some-url.com/users/userId',
        body: {
          id: 'replacedId'
        }
      };
      return adapter.replace('users', { params: { id: 'userId' }, body: { id: 'replacedId' }}).then(function(res) {
        request.put.should.be.calledOnce;
        request.put.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: [{ id: 'replacedId' }]}});
      });
    });

    it('should send PATCH request with proper parameters', function() {
      var expectedParams = {
        json: true,
        uri: 'https://some-url.com/users/userId',
        body: [
          {op: 'replace', path: '/users/0/firstName', value: 'Tom'}
        ]
      };
      return adapter.update(
        'users',
        {
          params: { id: 'userId' },
          body: [{op: 'replace', path: '/users/0/firstName', value: 'Tom'}]
        }
      ).then(function(res) {
        request.patch.should.be.calledOnce;
        request.patch.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: [{ id: 'userId', firstName: 'Tom' }]}});
      });
    });

    it('should be able to add/change header for future requests', function() {
      expectedParams = {
        json: true,
        uri: 'https://some-url.com/users/userId',
        qs: undefined
      };
      return adapter.get('users', { params: { id: 'userId' }}).then(function() {
        request.get.should.be.calledOnce;
        request.get.getCall(0).args[0].should.eql(expectedParams);
        remoteAdapter.changeHeader('newHeader', '123');
        expectedParams.headers = {
          newHeader: '123'
        };
        return adapter.get('users', { params: { id: 'userId' }}).then(function() {
          request.get.should.be.calledTwice;
          request.get.getCall(1).args[0].should.eql(expectedParams);
        });
      });
    });

    it('should be able to delete header for future requests', function() {
      remoteAdapter.changeHeader('newHeader', '123');
      expectedParams = {
        json: true,
        uri: 'https://some-url.com/users/userId',
        qs: undefined,
        headers: {
          newHeader: '123'
        }
      };
      return adapter.get('users', { params: { id: 'userId' }}).then(function() {
        request.get.should.be.calledOnce;
        request.get.getCall(0).args[0].should.eql(expectedParams);
        remoteAdapter.deleteHeader('newHeader');
        delete expectedParams.headers.newHeader
        return adapter.get('users', { params: { id: 'userId' }}).then(function() {
          request.get.should.be.calledTwice;
          request.get.getCall(1).args[0].should.eql(expectedParams);
        });
      });
    });
  });
  xdescribe('remote-adapter with secured host', function() {
    var adapter, host, expectedParams;

    beforeEach(function() {
      host = {
        url: 'https://some-url.com',
        headers: {
          customHeader: '123'
        },
        oauth: {
          consumer_key: 'key',
          consumer_secret: 'secret'
        }
      };
      adapter = remoteAdapter(host);
      sinon.stub(request, 'get').yields(null, { body: { users: [{ id: 'userId' }]}});
      sinon.stub(request, 'post').yields(null, { body: { users: [{ id: 'newId' }]}});
      sinon.stub(request, 'put').yields(null, { body: { users: [{ id: 'replacedId' }]}});
      sinon.stub(request, 'patch').yields(null, { body: { users: [{ id: 'userId', firstName: 'Tom' }]}});
      sinon.stub(request, 'delete').yields(null, { body: { users: []}});
    });
    afterEach(function() {
      _.each(['get', 'post', 'put', 'patch', 'delete'], function(method) {
        request[method].restore();
      });
    });

    it('should send GET request with proper parameters', function() {
      expectedParams = {
        headers: {
          customHeader: '123'
        },
        json: true,
        oauth: {
          consumer_key: 'key',
          consumer_secret: 'secret'
        },
        uri: 'https://some-url.com/users/userId',
        qs: undefined
      };
      return adapter.get('users', { params: { id: 'userId' }}).then(function(res) {
        request.get.should.be.calledOnce;
        request.get.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: [{ id: 'userId' }]}});
      });
    });

    it('should send POST request with proper parameters', function() {
      expectedParams = {
        headers: {
          customHeader: '123'
        },
        json: true,
        oauth: {
          consumer_key: 'key',
          consumer_secret: 'secret'
        },
        uri: 'https://some-url.com/users',
        body: {
          id: 'newId'
        }
      };
      return adapter.create('users', { body: { id: 'newId' }}).then(function(res) {
        request.post.should.be.calledOnce;
        request.post.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: [{ id: 'newId' }]}});
      });
    });

    it('should send DELETE request with proper parameters', function() {
      var expectedParams = {
        headers: {
          customHeader: '123'
        },
        json: true,
        oauth: {
          consumer_key: 'key',
          consumer_secret: 'secret'
        },
        uri: 'https://some-url.com/users/userId',
      };
      return adapter.destroy('users', { params: { id: 'userId' }}).then(function(res) {
        request.delete.should.be.calledOnce;
        request.delete.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: []}});
      });
    });

    it('should send PUT request with proper parameters', function() {
      var expectedParams = {
        headers: {
          customHeader: '123'
        },
        json: true,
        oauth: {
          consumer_key: 'key',
          consumer_secret: 'secret'
        },
        uri: 'https://some-url.com/users/userId',
        body: {
          id: 'replacedId'
        }
      };
      return adapter.replace('users', { params: { id: 'userId' }, body: { id: 'replacedId' }}).then(function(res) {
        request.put.should.be.calledOnce;
        request.put.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: [{ id: 'replacedId' }]}});
      });
    });

    it('should send PATCH request with proper parameters', function() {
      var expectedParams = {
        headers: {
          customHeader: '123'
        },
        json: true,
        oauth: {
          consumer_key: 'key',
          consumer_secret: 'secret'
        },
        uri: 'https://some-url.com/users/userId',
        body: [
          {op: 'replace', path: '/users/0/firstName', value: 'Tom'}
        ]
      };
      return adapter.update(
        'users',
        {
          params: { id: 'userId' },
          body: [{op: 'replace', path: '/users/0/firstName', value: 'Tom'}]
        }
      ).then(function(res) {
        request.patch.should.be.calledOnce;
        request.patch.getCall(0).args[0].should.eql(expectedParams);
        res.should.eql({ body: { users: [{ id: 'userId', firstName: 'Tom' }]}});
      });
    });

    it('should be able to add/change header for future requests', function() {
      expectedParams = {
        headers: {
          customHeader: '123'
        },
        json: true,
        oauth: {
          consumer_key: 'key',
          consumer_secret: 'secret'
        },
        uri: 'https://some-url.com/users/userId',
        qs: undefined
      };
      return adapter.get('users', { params: { id: 'userId' }}).then(function() {
        request.get.should.be.calledOnce;
        request.get.getCall(0).args[0].should.eql(expectedParams);
        remoteAdapter.changeHeader('customHeader', '456');
        expectedParams.headers.customHeader = '456';
        return adapter.get('users', { params: { id: 'userId' }}).then(function() {
          request.get.should.be.calledTwice;
          request.get.getCall(1).args[0].should.eql(expectedParams);
        });
      });
    });

    it('should be able to delete header for future requests', function() {
      expectedParams = {
        headers: {
          customHeader: '123'
        },
        json: true,
        oauth: {
          consumer_key: 'key',
          consumer_secret: 'secret'
        },
        uri: 'https://some-url.com/users/userId',
        qs: undefined
      };
      return adapter.get('users', { params: { id: 'userId' }}).then(function() {
        request.get.should.be.calledOnce;
        request.get.getCall(0).args[0].should.eql(expectedParams);
        remoteAdapter.deleteHeader('customHeader');
        delete expectedParams.headers.customHeader;
        return adapter.get('users', { params: { id: 'userId' }}).then(function() {
          request.get.should.be.calledTwice;
          request.get.getCall(1).args[0].should.eql(expectedParams);
        });
      });
    });
  });
};