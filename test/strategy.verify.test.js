/* global describe, it, beforeEach, afterEach */

var qs = require('querystring');

var chai = require('chai');
var expect = chai.expect;
var nock = require('nock');

chai.use(require('chai-passport-strategy'));

var IndieAuthStrategy = require('../');

var mockClientId = 'https://example-client.com';
var mockRedirectUri = 'https://example-client.com/auth';
var mockUserId = 'https://example-user.com';
var mockAuthEndpoint = 'https://example-auth-endpoint.com/auth';
var mockTokenEndpoint = 'https://example-token-endpoint.com/token';
var mockAuthCode = '1234';
var mockToken = 'abcd';

describe('@rcarls/passport-indieauth', function() {

  var strategy = new IndieAuthStrategy({
    clientId: mockClientId + '/',
    redirectUri: mockRedirectUri,
  }, function(uid, token, profile, done) {
    var user = {
      uid: uid,
      token: token,
    };

    return done(null, user, {});
  });

  describe('verifying with auth endpoint', function () {

    beforeEach('mock the user\'s home page', function() {
      nock(mockUserId)
        .get('/')
        .replyWithFile(200, __dirname + '/mocks/homepage-auth-endpoint.html');
    });

    beforeEach('mock auth endpoint', function() {
      nock(mockAuthEndpoint)
        .post('', {
          code: mockAuthCode,
          client_id: mockClientId + '/',
          redirect_uri: mockRedirectUri,
        })
        .reply(200, qs.stringify({ me: mockUserId + '/', }));
    });

    afterEach('cleanup', function() {
      nock.cleanAll();
    });

    describe('with minimum required parameters', function() {

      it('should succeed', function(done) {
        chai.passport.use(strategy)
          .success(function(user) {
            expect(user.uid).to.equal(mockUserId + '/');

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

    }); // without a me parameter

  }); // verifying with auth endpoint

  describe('verifying with token endpoint', function () {

    beforeEach('mock the user\'s home page', function() {
      nock(mockUserId)
        .get('/')
        .replyWithFile(200, __dirname + '/mocks/homepage-both-endpoints.html');
    });

    beforeEach('mock auth endpoint', function() {
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

    describe('with minimum required parameters', function() {

      it('should succeed', function(done) {
        chai.passport.use(strategy)
          .success(function(user) {
            expect(user).to.have.property('uid', mockUserId + '/');
            expect(user).to.have.property('token', mockToken);

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

  }); // verifying with token endpoint

}); // @rcarls/passport-indieauth
