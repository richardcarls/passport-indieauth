/* global describe, it */

var uri = require('url'),
    qs = require('querystring');

var chai = require('chai'),
    expect = chai.expect,
    nock = require('nock');

chai.use(require('chai-passport-strategy'));

var IndieAuthStrategy = require('../');

describe('@rcarls/passport-indieauth', function() {

  describe('using default session store', function() {

    describe('issuing new authorization request', function() {
      
      var strategy = new IndieAuthStrategy({
	clientId: 'https://example-client.com',
	redirectUri: 'https://example-client.com/auth',
      }, function(domain, scopes, info, done) {});
      
      beforeEach('mock the user\'s home page', function(done) {
	nock('https://example-user.com')
	  .get('/')
	  .replyWithFile(200, __dirname + '/mocks/user-homepage.html');
	
	done();
      });
      
      beforeEach('mock the authorization response', function(done) {
	nock('https://example-authorization-endpoint.com')
	  .get('/head/auth')
	  .reply(200, {
	    code: '1234',
	  });

	done();
      });

      describe('with minimum request parameters', function() {
	var authEndpointUrl;
	
	beforeEach('examine redirect', function(done) {
	  chai.passport.use(strategy)
	    .redirect(function(url) {
	      authEndpointUrl = url;
	      done();
	    }).req(function(req) {
	      req.body = {
		me: 'https://example-user.com',
	      };
	      req.session = {};
	    }).authenticate();
	});
	
	it('should find authorization endpoint and redirect', function() {
	  var url = uri.parse(authEndpointUrl);
	  delete url.search;
	  
	  expect(uri.format(url)).to.equal('https://example-auth-endpoint.com/head/auth');
	});

	it('should include required parameters', function() {
	  var url = uri.parse(authEndpointUrl, true);
	  
	  expect(url.query.me).to.equal('https://example-user.com');
	  expect(url.query.client_id).to.equal('https://example-client.com');
	  expect(url.query.redirect_uri).to.equal('https://example-client.com/auth');
	});
	
      });

      describe('without required request parameters', function() {

	var strategy = new IndieAuthStrategy({
	  clientId: 'https://example-client.com',
	  redirectUri: 'https://example-client.com/auth',
	}, function(domain, scopes, info, done) {});

	it('should fail without "me" parameter', function(done) {
	  chai.passport.use(strategy)
	    .fail(function(info) {
	      expect(info.message).to.equal('Missing required "me" parameter');
	      done();
	    }).req(function(req) {
	      req.session = {};
	    }).authenticate();
	});
	
      });
      
    });
    
  });
  
});
