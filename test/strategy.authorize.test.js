/* global describe, it */

var chai = require('chai');
var expect = chai.expect;
var nock = require('nock');

var uri = require('url');
var qs = require('querystring');

chai.use(require('chai-passport-strategy'));

var IndieAuthStrategy = require('../');

var mockClientId = 'https://example-client.com';
var mockRedirectUri = 'https://example-client.com/auth';
var mockUserId = 'https://example-user.com';
var mockAuthEndpoint = 'https://example-auth-endpoint.com/head/auth';
var mockScope = 'post edit';
var mockState = 'abc';
var mockAuthCode = '1234';

describe('@rcarls/passport-indieauth', function() {
    
    describe('issuing new authorization request', function() {

	var strategy = new IndieAuthStrategy({
	    clientId: mockClientId + '/',
	    redirectUri: mockRedirectUri,
	}, function(domain, scopes, mfData, done) {});
	
	beforeEach('mock the user\'s home page', function(done) {
	    nock(mockUserId)
		.get('/')
		.replyWithFile(200, __dirname + '/mocks/user-homepage.html');
	    
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
			req.method = 'POST';
			req.body = {
			    me: mockUserId + '/',
			};
			req.session = {};
		    }).authenticate();
	    });
	    
	    it('should redirect to authorization endpoint', function() {
		var url = uri.parse(authEndpointUrl);
		delete url.search;
		
		expect(uri.format(url)).to.equal(mockAuthEndpoint);
	    });

	    it('should include required parameters with redirect', function() {
		var url = uri.parse(authEndpointUrl, true);
		
		expect(url.query.me).to.equal(mockUserId + '/');
		expect(url.query.client_id).to.equal(mockClientId + '/');
		expect(url.query.redirect_uri).to.equal(mockRedirectUri);
	    });
	    
	}); // with minimum request parameters
	
	describe('with optional scope parameter', function() {

	    it('should work as space-deliniated string', function(done) {
		chai.passport.use(strategy)
		    .redirect(function(url) {
			var query = uri.parse(url, true).query;
			
			expect(query).to.have.property('scope', mockScope);
			
			done();
		    }).req(function(req) {
			req.method = 'POST';
			req.body = {
			    me: mockUserId + '/',
			    scope: mockScope,
			};
			req.session = {};
		    }).authenticate();
	    });
	    
	    it('should work as array syntax', function(done) {
		chai.passport.use(strategy)
		    .redirect(function(url) {
			var query = uri.parse(url, true).query;
			
			expect(query).to.have.property('scope', mockScope);
			
			done();
		    }).req(function(req) {
			req.method = 'POST';
			req.body = {
			    me: mockUserId + '/',
			    scope: mockScope.split(' '),
			};
			req.session = {};
		    }).authenticate();
		
	    });

	    it('should work as object syntax', function(done) {
		chai.passport.use(strategy)
		    .redirect(function(url) {
			var query = uri.parse(url, true).query;
			
			expect(query).to.have.property('scope', mockScope);
			
			done();
		    }).req(function(req) {
			req.method = 'POST';
			req.body = {
			    me: mockUserId + '/',
			    scope: mockScope.split(' ')
				.reduce(function(result, value) {
				    result[value] = true;
				    
				    return result;
				}, {}),
			};
			req.session = {};
		    }).authenticate();
		
	    });
	    
	}); // with optional scope parameter

	describe('with optional state parameter', function() {

	    it('should work with default _csrf property', function(done) {
		chai.passport.use(strategy)
		    .redirect(function(url) {
			var query = uri.parse(url, true).query;
			
			expect(query).to.have.property('state', mockState);
			
			done();
		    }).req(function(req) {
			req.method = 'POST';
			req.body = {
			    me: mockUserId + '/',
			    _csrf: mockState,
			};
			req.session = {};
		    }).authenticate();
	    });
	    
	    it('should work with explicit state property', function(done) {
		chai.passport.use(strategy)
		    .redirect(function(url) {
			var query = uri.parse(url, true).query;
			
			expect(query).to.have.property('state', mockState);
			
			done();
		    }).req(function(req) {
			req.method = 'POST';
			req.body = {
			    me: mockUserId + '/',
			    state: mockState,
			};
			req.session = {};
		    }).authenticate();
		
	    });
	    
	}); // with optional state parameter

	describe('without minimum request parameters', function() {
	    
	    var strategy = new IndieAuthStrategy({
		clientId: mockClientId + '/',
		redirectUri: mockRedirectUri,
	    }, function(domain, scopes, mfData, done) {});

	    it('should fail', function(done) {
		chai.passport.use(strategy)
		    .fail(function(info) {
			expect(info.message).to.equal('Missing request parameters');
			done();
		    }).req(function(req) {
			req.session = {};
		    }).authenticate();
	    });
	    
	}); // without required request parameters
	
    }); // issuing new authorization request

});
