'use strict';
var should = require('should');
var sinon = require('sinon');
var middleware = require('../../lib/normalize-filter').Middleware;

describe('normalize-filter', function(){
  var fn, req;
  beforeEach(function(){
    fn = middleware();
    req = {
      qs: {
        filter: {

        }
      }
    };
  });
  it('should pass through if req does not have qs', function(){
    req.qs = null;
    fn(req).should.equal(req);
    should.not.exist(req.qs);
  });
  it('should pass through if req does not have qs.filter', function(){
    req.qs.filter = null;
    fn(req).should.equal(req);
    should.not.exist(req.qs.filter);
  });
  it('should pass through if req.filter is not an object', function(){
    req.qs.filter = 'value';
    fn(req).should.equal(req);
    req.qs.filter.should.equal('value');
  });
  it('should drop qs.filter', function(){
    fn(req).should.equal(req);
    should.not.exist(req.qs.filter);
  });
  it('should flatten qs.filter values prepending "filter" keyword', function(){
    req.qs.filter = {
      a: 'b',
      b: {
        c: 'd'
      },
      'dot.ted': 'e',
      nested: {
        'dot.ted': 'f'
      }
    };
    fn(req).should.equal(req);
    req.qs['filter[a]'].should.equal('b');
    req.qs['filter[b][c]'].should.equal('d');
    req.qs['filter[dot.ted]'].should.equal('e');
    req.qs['filter[nested][dot.ted]'].should.equal('f');
  });
});