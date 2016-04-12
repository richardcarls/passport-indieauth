/* global describe, it */

var expect = require('chai').expect;

var IndieAuthStrategy = require('../');


describe('@rcarls/passport-indieauth', function() {

  describe('constructed', function() {

    describe('with minimum options and verify callback', function() {

      var strategy = new IndieAuthStrategy({
	clientId: 'https://example-client.com/',
	redirectUri: 'https://example-client.com/auth',
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
	    clientId: 'https://example-client.com/',
	    redirectUri: 'https://example-client.com/auth',
	  });
	}).to.throw(TypeError, 'IndieAuthStrategy requires a verify callback');
      });
      
    }); // without a verify callback

    describe('without a clientId option', function() {
      
      it('should throw', function() {
	expect(function() {
	  var strategy = new IndieAuthStrategy({
	    redirectUri: 'https://example-client.com/auth',
	  }, function() {});
	}).to.throw(TypeError, 'IndieAuthStrategy requires a clientId option');
      });
      
    }); // without a clientId option

    describe('without a redirectUri option', function() {
      
      it('should throw', function() {
	expect(function() {
	  var strategy = new IndieAuthStrategy({
	    clientId: 'https://example-client.com/',
	  }, function() {});
	}).to.throw(TypeError, 'IndieAuthStrategy requires a redirectUri option');
      });
      
    }); // without a redirectUri option
    
  });
  
});
