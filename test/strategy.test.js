/* global describe, it */

var expect = require('chai').expect;

var IndieAuthStrategy = require('../');

var mockClientId = 'https://example-client.com';
var mockRedirectUri = 'https://example-client.com/auth';

describe('@rcarls/passport-indieauth', function() {

  describe('constructed', function() {

    describe('with minimum options and verify callback', function() {

      var strategy = new IndieAuthStrategy({
        clientId: mockClientId + '/',
        redirectUri: mockRedirectUri,
      }, function() {});

      it('should be named "indieauth"', function() {
        expect(strategy.name).to.equal('indieauth');
      });

    }); // with minimum options

    describe('without options', function() {

      it('should throw', function() {
        expect(function() {
          var strategy = new IndieAuthStrategy(function(){});
        }).to.throw(TypeError, 'IndieAuthStrategy requires an options object');
      });

    }); // without options

    describe('without a verify callback', function() {

      it('should throw', function() {
        expect(function() {
          var strategy = new IndieAuthStrategy({
            clientId: mockClientId + '/',
            redirectUri: mockRedirectUri,
          });
        }).to.throw(TypeError, 'IndieAuthStrategy requires a verify callback');
      });

    }); // without a verify callback

    describe('without a clientId option', function() {

      it('should throw', function() {
        expect(function() {
          var strategy = new IndieAuthStrategy({
            redirectUri: mockRedirectUri,
          }, function() {});
        }).to.throw(TypeError, 'IndieAuthStrategy requires a clientId option');
      });

    }); // without a clientId option

    describe('without a redirectUri option', function() {

      it('should throw', function() {
        expect(function() {
          var strategy = new IndieAuthStrategy({
            clientId: mockClientId + '/',
          }, function() {});
        }).to.throw(
          TypeError, 'IndieAuthStrategy requires a redirectUri option'
        );
      });

    }); // without a redirectUri option

    describe('with an invalid responseType', function() {

      it('should throw', function() {
        expect(function() {
          var strategy = new IndieAuthStrategy({
            clientId: mockClientId + '/',
            redirectUri: mockRedirectUri,
            responseType: 'invalid',
          }, function() {});
        }).to.throw(
          TypeError, 'response_type must be one of either "id" or "code"'
        );
      });

    }); // with an invalid responseType

  });

});
