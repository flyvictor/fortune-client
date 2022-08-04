'use strict';
const sinon = require('sinon');
const should = require('should');
const denormalize = require('../../lib/denormalize');

module.exports = function(util) {
  describe('Denormalize', function(){
    describe('_getLinkedResources', function(){
      it('should return linked resources documents for provided primary name and link name', function(){
        const primary = 'users';
        const link = 'lover';
        const body = {linked: {users: [{id: 'userId'}]}, links: {'users.lover': {type: 'users'}}};
        denormalize._getLinkedResources(primary, link, body).should.eql([
          {id: 'userId'}
        ]);
      });
    });
    describe('_rebaseLinks', function(){
      it('should convert top-level links to sub links', function(){
        const links = {
          'addresses.inhabitants': {type: 'users'},
          'addresses.inhabitants.instruments': {type: 'instruments'}
        };
        denormalize._rebaseLinks(links, 'addresses', 'inhabitants').should.eql({
          'users.instruments': {type: 'instruments'}
        });
      });
      it('should return empty object if no nested references are matched', function(){
        const links = {
          'addresses.inhabitants': {type: 'users'}
        };
        denormalize._rebaseLinks(links, 'addresses', 'inhabitants').should.eql({});
      });

      it('yield correct sub-links', function(){
        const links = {
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
      let body, config, user;
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
        const accountOwner = {
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

      it('should cut circular links after denormalize', function(){
        config.request.denormalize = true;
        config.request.denormalizeCheckCircLinks = true;
        body.events[0].id = "event1";
        user.links = { event: "event1" };
        body.links[ 'events.user.event' ] = { type: 'events' };
        denormalize.denormalize( config, { body: body } );
        body.events[ 0 ].links.user.links.event.should.be.eql( "event1" );
      });

      it('should not denormalize layers for the same objects more that one time', function(){
        const rebaseLinksSpy = sinon.spy(denormalize, '_rebaseLinks');

        // create deep relations with two branches and a few objects in each level:
        // events - user - account owner - office - country
        // events - source - country
        const accountOwner = {
          id: 'xyz123',
          title: 'Miss',
          lastName: 'Victor',
          ownedAccounts: [ 'abcdef', 'zyx567' ],
          links: { office: 'office-1' }
        };
        const office = {
          id: 'office-1',
          name: 'office 1',
          links: {
            country: 'country-1'
          }
        };
        const country = {
          id: 'country-1',
          name: 'UK'
        }

        const source = { id: 'source-1', links: {country: 'country-1'}};
        body.linked.sources = [source];
        body.links[ 'events.source' ] = { type: 'sources' };
        body.links[ 'events.source.country' ] = { type: 'countries' };

        user.links = { accountOwner: "xyz123" };
        body.events[0].links.source = 'source-1';
        body.events.push({ id: 'event-2', links: { user: 'zyx567', source: 'source-1' } });
        body.events.push({ id: 'event-3', links: { user: 'zyx567', source: 'source-1' } });
        body.events.push({ id: 'event-4', links: { user: 'zyx567', source: 'source-1' } });

        body.linked.users.push( accountOwner );
        body.linked.users.push({ id: "zyx567", lastName: "zyx567", title: "zyx567", links: { accountOwner: "xyz123" } });
        body.linked.offices = [office];
        body.linked.countries = [country];

        body.links[ 'events.user.accountOwner' ] = { type: 'users' };
        body.links[ 'events.user.accountOwner.office' ] = { type: 'offices' };
        body.links[ 'events.user.accountOwner.office.country' ] = { type: 'countries' };
        config.request.denormalize = true;
        denormalize.denormalize( config, { body: body } );

        // events.source + sources.country + events.user + events.office + users.accountOwner + users.office + offices.country
        rebaseLinksSpy.callCount.should.eql(6);

        office.links.country.should.eql(country);
        source.links.country.should.eql(country);
        accountOwner.links.office.should.eql(office);
        for (let i = 0; i < 4; i++) {
          body.events[ i ].links.user.links.accountOwner.should.be.eql(accountOwner);
          body.events[ i ].links.source.should.eql(source);
        }
      });
    });
  });
};
