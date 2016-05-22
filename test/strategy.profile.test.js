/* global describe, it, beforeEach */

var chai = require('chai');
var expect = chai.expect;
var nock = require('nock');

chai.use(require('chai-passport-strategy'));

var qs = require('querystring');

var IndieAuthStrategy = require('../');

var mockClientId = 'https://example-client.com';
var mockRedirectUri = 'https://example-client.com/auth';
var mockUserId = 'https://example-user.com';
var mockAuthEndpoint = 'https://example-auth-endpoint.com/head/auth';
var mockScope = 'post edit';
var mockAuthCode = '1234';

// Profile values
var mockMfData = require('./mocks/mf-data.json');
var mockProfile = require('./mocks/profile.json');
mockProfile._json = mockMfData;

describe('@rcarls/passport-indieauth', function() {

  describe('the authorized user', function () {

    var result;

    var strategy = new IndieAuthStrategy({
      clientId: mockClientId + '/',
      redirectUri: mockRedirectUri,
    }, function(domain, scope, profile, done) {
      var user = {
        me: domain,
        scope: scope,
        profile: profile,
      };

      return done(null, user, null);
    });

    beforeEach('mock the verify call', function(done) {
      nock(mockAuthEndpoint)
        .post('', function(body) {
          return !!(body.code === mockAuthCode &&
                    body.client_id === mockClientId + '/' &&
                    body.redirect_uri === mockRedirectUri);
        })
        .reply(200, function(uri, body) {
          var response = { me: mockUserId + '/', };
          body = qs.parse(body);

          if (body.scope) { response.scope = body.scope; }

          return qs.stringify(response);
        });

      done();
    });

    beforeEach('mock the user\'s home page', function(done) {
      nock(mockUserId)
        .get('/')
        .replyWithFile(200, __dirname + '/mocks/user-homepage.html');

      done();
    });

    beforeEach('perform authorization', function(done) {
      chai.passport.use(strategy)
        .success(function(user, info) {
          result = user;

          done();
        })
        .req(function(req) {
          req.query = {
            code: mockAuthCode,
            me: mockUserId + '/',
            scope: mockScope,
          };
          req.session = {};
        }).authenticate();
    });

    it('should have a domain', function() {
      expect(result).to.have.property('me', mockUserId + '/');
    });

    it('should have authorized scopes', function() {
      expect(result).to.have.property('scope', mockScope);
    });

    it('should have Contact schema profile data', function() {
      expect(result).to.have.property('profile')
        .which.deep.equals(mockProfile);
    });


  }); // the authorized user

}); // @rcarls/passport-indieauth
