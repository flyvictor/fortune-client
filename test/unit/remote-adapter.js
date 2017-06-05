var remoteAdapter = require('../../lib/remote-adapter');
var superagent = require('superagent');
var sinon = require('sinon');
var _ = require('lodash');

module.exports = function() {
  describe('remote-adapter', function() {
    var adapter, host, expectedParams;
    var request;

    beforeEach(function() {
      host = 'https://some-url.com';
      adapter = remoteAdapter(host);
      request = {
        set: sinon.stub().returnsThis(),
        query: sinon.stub().returnsThis(),
        use: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
        end: sinon.stub().returnsThis()
      };

      sinon.stub(superagent, 'get').returns(request);
       // .yields(null, { body: { users: [{ id: 'userId' }]}});
      sinon.stub(superagent, 'post').returns(request);
       //.yields(null, { body: { users: [{ id: 'newId' }]}});
      sinon.stub(superagent, 'put').returns(request);
      //.yields(null, { body: { users: [{ id: 'replacedId' }]}});
      sinon.stub(superagent, 'patch').returns(request);
      //.yields(null, { body: { users: [{ id: 'userId', firstName: 'Tom' }]}});
      sinon.stub(superagent, 'delete').returns(request);
      //.yields(null, { body: { users: []}});
    });
    afterEach(function() {
      _.each(['get', 'post', 'put', 'patch', 'delete'], function(method) {
        superagent[method].restore();
      });
    });

    it('should send GET request with proper parameters', function() {
      request.end.yields(null, {text: JSON.stringify({users: [{id: 'userId'}]})});
      return adapter.get('users', { params: { id: 'userId' }}).then(function(res) {
        superagent.get.should.be.calledOnce;
        superagent.get.getCall(0).args[0].should.equal('https://some-url.com/users/userId');
        request.set.getCall(0).args[0].should.eql({});
        request.query.getCall(0).args[0].should.eql({});

        res.should.eql({ body: { users: [{ id: 'userId' }]}});
      });
    });

    it('should send POST request with proper parameters', function() {
      var req = { body: { id: 'newId' }};
      request.end.yields(null, {text: JSON.stringify({users: [{id: 'newId'}]})});
      return adapter.create('users', req).then(function(res) {
        superagent.post.should.be.calledOnce;
        superagent.post.getCall(0).args[0].should.eql('https://some-url.com/users');
        request.set.getCall(0).args[0].should.eql({});
        request.set.getCall(1).args.should.eql(['Content-Type', 'application/json']);
        request.send.getCall(0).args[0].should.equal(JSON.stringify(req.body));

        res.should.eql({ body: { users: [{ id: 'newId' }]}});
      });
    });

    it('should send DELETE request with proper parameters', function() {
      request.end.yields(null, {statusCode: 204});
      return adapter.destroy('users', { params: { id: 'userId' }}).then(function(res) {
        superagent.delete.should.be.calledOnce;
        superagent.delete.getCall(0).args[0].should.eql('https://some-url.com/users/userId');
        request.set.getCall(0).args[0].should.eql({});
        res.should.eql({});
      });
    });

    it('should send PUT request with proper parameters', function() {
      var req = { params: { id: 'userId' }, body: { id: 'replacedId' }};
      request.end.yields(null, {text: JSON.stringify({users: [{id: 'replacedId'}]})});
      return adapter.replace('users', req).then(function(res) {
        superagent.put.should.be.calledOnce;
        superagent.put.getCall(0).args[0].should.eql('https://some-url.com/users/userId');
        request.set.getCall(0).args[0].should.eql({});
        request.set.getCall(1).args.should.eql(['Content-Type', 'application/json']);
        request.send.getCall(0).args[0].should.equal(JSON.stringify(req.body));
        res.should.eql({ body: { users: [{ id: 'replacedId' }]}});
      });
    });

    it('should send PATCH request with proper parameters', function() {
      var req = {
        params: { id: 'userId' },
        body: [{op: 'replace', path: '/users/0/firstName', value: 'Tom'}]
      };
      request.end.yields(null, {text: JSON.stringify({users: [{id: 'userId', firstName: 'Tom'}]})});
      return adapter.update(
        'users',
        req
      ).then(function(res) {
        superagent.patch.should.be.calledOnce;
        superagent.patch.getCall(0).args[0].should.eql('https://some-url.com/users/userId');
        request.set.getCall(0).args[0].should.eql({});
        request.set.getCall(1).args.should.eql(['Content-Type', 'application/json']);
        request.send.getCall(0).args[0].should.equal(JSON.stringify(req.body));
        res.should.eql({ body: { users: [{ id: 'userId', firstName: 'Tom' }]}});
      });
    });

    it('should be able to add/change header for future requests', function() {
      request.end.yields(null, {text: JSON.stringify({})});
      return adapter.get('users', { params: { id: 'userId' }}).then(function() {
        request.set.getCall(0).args[0].should.eql({});

        remoteAdapter.changeHeader('newHeader', '123');
        return adapter.get('users', { params: { id: 'userId' }}).then(function() {
          request.set.getCall(1).args[0].should.eql({
            newHeader: '123'
          });
        });
      });
    });

    it('should be able to delete header for future requests', function() {
      request.end.yields(null, {text: JSON.stringify({})});
      remoteAdapter.changeHeader('newHeader', '123');
      return adapter.get('users', { params: { id: 'userId' }}).then(function() {
        request.set.getCall(0).args[0].should.eql({newHeader: '123'});

        remoteAdapter.deleteHeader('newHeader');
        return adapter.get('users', { params: { id: 'userId' }}).then(function() {
          request.set.getCall(1).args[0].should.eql({});
        });
      });
    });
  });
};