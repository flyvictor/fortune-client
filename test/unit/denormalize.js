'use strict';
var should = require('should');
var denormalize = require('../../lib/denormalize');

module.exports = function(util) {
  describe('Denormalize', function(){
    describe('_getLinkedResources', function(){
      it('should return linked resources documents for provided primary name and link name', function(){
        var primary = 'users';
        var link = 'lover';
        var body = {linked: {users: [{id: 'userId'}]}, links: {'users.lover': {type: 'users'}}};
        denormalize._getLinkedResources(primary, link, body).should.eql([
          {id: 'userId'}
        ]);
      });
    });
    describe('_rebaseLinks', function(){
      it('should convert top-level links to sub links', function(){
        var links = {
          'addresses.inhabitants': {type: 'users'},
          'addresses.inhabitants.instruments': {type: 'instruments'}
        };
        denormalize._rebaseLinks(links, 'addresses', 'inhabitants').should.eql({
          'users.instruments': {type: 'instruments'}
        });
      });
      it('should return empty object if no nested references are matched', function(){
        var links = {
          'addresses.inhabitants': {type: 'users'}
        };
        denormalize._rebaseLinks(links, 'addresses', 'inhabitants').should.eql({});
      });

      it('should not fail', function(){
        var links = {
          'charges.card': { type: 'cards' },
          'charges.quote': { type: 'quotes' },
          'charges.user': { type: 'users' },
          'charges.paymentType': { type: 'payment-types' },
          'charges.accountCredit': { type: 'account-credits' },
          'charges.quote.quoteLegs': { type: 'quote-legs' },
          'charges.quote.quoteLegs.arrAirport': { type: 'airports' },
          'charges.quote.quoteLegs.deptAirport': { type: 'airports' }
        };
        denormalize._rebaseLinks(links, 'charges', 'card').should.eql({});
        denormalize._rebaseLinks(links, 'charges', 'quote').should.eql({
          'quotes.quoteLegs': { type: 'quote-legs' },
          'quotes.quoteLegs.arrAirport': {type: 'airports'},
          'quotes.quoteLegs.deptAirport': {type: 'airports'}
        });
      });
    });
  });
};
