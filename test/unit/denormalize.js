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

      it('yield correct sub-links', function(){
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
    describe('denormalize layer', function(){
      var body, config, user;
      beforeEach( function(){
        user = { id: "abcdef", lastName: "Jones", title: "Mr" };
        body = {
          events: [{ links: { user: 'abcdef' } }],
          links: { 'events.user': { type: 'users' } },
          linked: { users: [ user ] }
        };
        config = {
          request: {},
          resource: 'events'
        };
      });
      it('should not denormalize body if denormalize disabled', function(){
        denormalize.denormalize( config, { body: body } );
        body.events[ 0 ].links.user.should.be.eql( user.id );
      });
      it('should denormalize body if denormalize enabled', function(){
        config.request.denormalize = true;
        denormalize.denormalize( config, { body: body } );
        body.events[ 0 ].links.user.should.be.eql( user );
      });
      /*
       * There was a bug where if a linked resource was requsted as a child of a
       * resource of the same type, it wasn't correctly handled.
       * eg: include: 'user,user.accountOwner', both user and accountOwner are
       * users.
       */
      it('should denormalize resources linked to same type as self', function(){
        var accountOwner = {
          id: 'xyz123',
          title: 'Miss',
          lastName: 'Victor',
          ownedAccounts: [ 'abcdef' ],
        };
        config.request.denormalize = true;
        body.links[ 'events.user.accountOwner' ] = { type: 'users' };
        user.links = { accountOwner: "xyz123" };
        body.linked.users.push( accountOwner );
        denormalize.denormalize( config, { body: body } );
        body.events[ 0 ].links.user.links.accountOwner.should.be.eql( accountOwner );
      });

    });

  });
};
