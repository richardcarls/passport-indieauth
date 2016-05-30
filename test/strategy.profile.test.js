/* global describe, it, beforeEach, afterEach */

var chai = require('chai');
var expect = chai.expect;
var nock = require('nock');

chai.use(require('chai-passport-strategy'));

var qs = require('querystring');

var IndieAuthStrategy = require('../');

var mockClientId = 'https://example-client.com';
var mockRedirectUri = 'https://example-client.com/auth';
var mockUserId = 'https://example-user.com';
var mockTokenEndpoint = 'https://example-token-endpoint.com/token';
var mockAuthCode = '1234';
var mockToken = 'abcd';

// Profile values
var mockMfData = require('./mocks/mf-data.json');
var mockProfile = require('./mocks/profile.json');
mockProfile._json = mockMfData;

describe('@rcarls/passport-indieauth', function() {

  var strategy = new IndieAuthStrategy({
    clientId: mockClientId + '/',
    redirectUri: mockRedirectUri,
  }, function(uid, token, profile, done) {
    var user = {
      uid: uid,
      token: token,
      profile: profile,
    };

    return done(null, user, null);
  });

  describe('the authorized user', function () {

    beforeEach('mock the user\'s home page', function() {
      nock(mockUserId)
        .get('/')
        .replyWithFile(200, __dirname + '/mocks/user-homepage.html');
    });

    beforeEach('mock the verify call', function() {
      nock(mockTokenEndpoint)
        .post('', {
          code: mockAuthCode,
          client_id: mockClientId + '/',
          redirect_uri: mockRedirectUri,
        })
        .reply(200, qs.stringify({
          me: mockUserId + '/',
          access_token: mockToken,
        }));
    });

    afterEach('cleanup', function() {
      nock.cleanAll();
    });

    it('should have a uid', function(done) {
      chai.passport.use(strategy)
        .success(function(user) {
          expect(user).to.have.property('uid', mockUserId + '/');

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

    it('should have Contact schema profile data', function(done) {
      chai.passport.use(strategy)
        .success(function(user) {
          expect(user).to.have.property('profile')
            .which.deep.equals(mockProfile);

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

  }); // the authorized user

}); // @rcarls/passport-indieauth
