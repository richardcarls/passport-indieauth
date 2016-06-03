/* global describe, it, before, after */

var chai = require('chai');
var nock = require('nock');

chai.use(require('chai-passport-strategy'));

var qs = require('querystring');
var IndieAuthStrategy = require('../');

var mockClientId = 'https://example-client.com';
var mockRedirectUri = 'https://example-client.com/auth';
var defaultAuthEndpoint = 'https://indieauth.com/auth';
var mockUserId = 'https://example-user.com';
var mockAuthEndpoint = 'https://example-auth-endpoint.com/auth';
var mockTokenEndpoint = 'https://example-token-endpoint.com/token';
var mockAuthCode = '1234';
var mockToken = 'abcd';

describe('@rcarls/passport-indieauth', function() {

  var strategy = new IndieAuthStrategy({
    clientId: mockClientId,
    redirectUri: mockRedirectUri,
  }, function(uid, token, profile, done) {});

  describe('to verify an auth code', function() {

    describe('for a user with a homepage', function() {

      describe('with no endpoints', function() {

        var scope;

        before('mock the user\'s home page', function() {
          nock(mockUserId)
            .get('/')
            .replyWithFile(200, __dirname + '/mocks/homepage-no-endpoints.html');
        });

        before('mock the endpoint', function() {
          scope = nock(defaultAuthEndpoint)
            .post('', {
              code: mockAuthCode,
              client_id: mockClientId + '/',
              redirect_uri: mockRedirectUri,
            })
            .reply(200, qs.stringify({ me: mockUserId + '/', }));
        });

        after('cleanup', function() {
          nock.cleanAll();
        });

        it('should use the default auth endpoint', function(done) {
          scope.on('replied', function(req) {
            done();
          });

          chai.passport.use(strategy)
            .req(function(req) {
              req.query = {
                code: mockAuthCode,
                me: mockUserId + '/',
              };
              req.session = {};
            }).authenticate();
        });

      }); // with no endpoints

      describe('with only authorization endpoint', function() {

        var scope;

        before('mock the user\'s home page', function() {
          nock(mockUserId)
            .get('/')
            .replyWithFile(200, __dirname + '/mocks/homepage-auth-endpoint.html');
        });

        before('mock the endpoint', function() {
          scope = nock(mockAuthEndpoint)
            .post('', {
              code: mockAuthCode,
              client_id: mockClientId + '/',
              redirect_uri: mockRedirectUri,
            })
            .reply(200, qs.stringify({ me: mockUserId + '/', }));
        });

        after('cleanup', function() {
          nock.cleanAll();
        });

        it('should use the discovered auth endpoint', function(done) {
          scope.on('replied', function(req) {
            done();
          });

          chai.passport.use(strategy)
            .req(function(req) {
              req.query = {
                code: mockAuthCode,
                me: mockUserId + '/',
              };
              req.session = {};
            }).authenticate();
        });

      }); // with only authorization endpoint

      describe('with both authorization and token endpoints', function() {

        before('mock the user\'s home page', function() {
          nock(mockUserId)
            .get('/')
            .replyWithFile(200, __dirname + '/mocks/homepage-both-endpoints.html');
        });

        before('mock the endpoint', function() {
          scope = nock(mockTokenEndpoint)
            .post('', {
              code: mockAuthCode,
              client_id: mockClientId + '/',
              redirect_uri: mockRedirectUri,
            })
            .reply(200, qs.stringify({
              me: mockUserId + '/',
              token: mockToken,
            }));
        });

        after('cleanup', function() {
          nock.cleanAll();
        });

        it('should use the discovered token endpoint', function(done) {
          scope.on('replied', function(req) {
            done();
          });

          chai.passport.use(strategy)
            .req(function(req) {
              req.query = {
                code: mockAuthCode,
                me: mockUserId + '/',
              };
              req.session = {};
            }).authenticate();
        });

      }); // with both authorization and token endpoints

      describe('with only token endpoint', function() {

        var scope;

        before('mock the user\'s home page', function() {
          nock(mockUserId)
            .get('/')
            .replyWithFile(200, __dirname + '/mocks/homepage-token-endpoint.html');
        });

        before('mock the endpoint', function() {
          scope = nock(defaultAuthEndpoint)
            .post('', {
              code: mockAuthCode,
              client_id: mockClientId + '/',
              redirect_uri: mockRedirectUri,
            })
            .reply(200, qs.stringify({ me: mockUserId + '/', }));
        });

        after('cleanup', function() {
          nock.cleanAll();
        });

        it('should use the default endpoint', function(done) {
          scope.on('replied', function(req) {
            done();
          });

          chai.passport.use(strategy)
            .req(function(req) {
              req.query = {
                code: mockAuthCode,
                me: mockUserId + '/',
              };
              req.session = {};
            }).authenticate();
        });

      }); // with only token endpoint

    }); // for a user with a homepage

  }); // to verify an auth code

}); // @rcarls/passport-indieauth
