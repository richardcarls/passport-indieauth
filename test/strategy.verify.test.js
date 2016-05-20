/* global describe, it, before, beforeEach */

var uri = require('url');
var qs = require('querystring');

var chai = require('chai');
var expect = chai.expect;
var nock = require('nock');

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
    
    describe('receiving authorization result', function () {
	
	var strategy = new IndieAuthStrategy({
	    clientId: mockClientId + '/',
	    redirectUri: mockRedirectUri,
	}, function(domain, scope, mfData, done) {
	    var user = {
		me: domain,
		scope: scope,
	    };
	    
	    return done(null, user, mfData);
	});
	
	var authRequest;

	beforeEach('mock the user\'s home page', function(done) {
	    nock(mockUserId)
		.get('/')
		.replyWithFile(200, __dirname + '/mocks/user-homepage.html');
	    
	    done();
	});

	beforeEach('mock the verify call', function(done) {
	    nock(mockAuthEndpoint)
		.post('', {
		    code: mockAuthCode,
		    client_id: mockClientId + '/',
		    redirect_uri: mockRedirectUri,
		})
		.reply(200, qs.stringify({ me: mockUserId + '/', }));
	    
	    done();
	});

	describe('with minimum required parameters', function() {

            it('should succeed', function(done) {
                chai.passport.use(strategy)
		    .success(function(user, info) {
			expect(user.me).to.equal(mockUserId + '/');
			
			done();
		    })
		    .req(function(req) {
			req.query = {
			    code: mockAuthCode,
			    me: mockUserId + '/',
			};
			req.session = {};
		    }).authenticate();
	    });

	}); // with minimum required parameters
	
	describe('without a code parameter', function() {
	    
	    it('should fail', function(done) {
		chai.passport.use(strategy)
		    .fail(function(info) {
			expect(info.message).to.equal('Missing request parameters');
			
			done();
		    })
		    .req(function(req) {
			req.session = {};
		    })
		    .authenticate();
		
	    });

	}); // without a code parameter

	describe('without a me parameter', function() {
	    
	    it('should fail', function(done) {
		chai.passport.use(strategy)
		    .fail(function(info) {
			expect(info.message).to.equal('Missing required "me" parameter');
			
			done();
		    })
		    .req(function(req) {
			req.query = { code: mockAuthCode, };
			req.session = {};
		    })
		    .authenticate();
		
	    });

	}); // without a code parameter
	
    }); // receiving authorization result

});
