/* global describe, it, beforeEach */

var chai = require('chai');
var expect = chai.expect;
var nock = require('nock');

var uri = require('url');

chai.use(require('chai-passport-strategy'));

var IndieAuthStrategy = require('../');

var mockClientId = 'https://example-client.com';
var mockRedirectUri = 'https://example-client.com/auth';
var defaultAuthEndpoint = 'https://indieauth.com/auth';
var mockUserId = 'https://example-user.com';
var mockAuthEndpoint = 'https://example-auth-endpoint.com/auth';

describe('@rcarls/passport-indieauth', function() {

  var strategy = new IndieAuthStrategy({
    clientId: mockClientId,
    redirectUri: mockRedirectUri,
  }, function(uid, token, profile, done) {});

  describe('to authorize a user', function() {

    describe('with minimum request parameters', function() {

      before('mock the user\'s home page', function() {
        nock(mockUserId)
          .get('/')
          .replyWithFile(200, __dirname + '/mocks/homepage-no-endpoints.html');
      });

      after('cleanup', function() {
        nock.cleanAll();
      });

      it('should include required parameters with redirect', function() {
        chai.passport.use(strategy)
          .redirect(function(url) {
            var endpointQuery = uri.parse(url, true).query;

            expect(endpointQuery).to.have.property('me', mockUserId + '/');
            expect(endpointQuery).to.have.property('client_id', mockClientId + '/');
            expect(endpointQuery).to.have.property('redirect_uri', mockRedirectUri);

            done();
          })
          .req(function(req) {
            req.method = 'POST';
            req.body = {
              me: mockUserId,
            };
            req.session = {};
          }).authenticate();

      });

    }); // with minimum request parameters

    describe('without minimum request parameters', function() {

      var strategy = new IndieAuthStrategy({
        clientId: mockClientId + '/',
        redirectUri: mockRedirectUri,
      }, function(uid, token, profile, done) {});

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

    describe('with a homepage', function() {

      var endpointUrl;

      before('mock the user\'s home page', function() {
        nock(mockUserId)
          .get('/')
          .replyWithFile(200, __dirname + '/mocks/homepage-no-endpoints.html') // Test #1
          .get('/')
          .replyWithFile(200, __dirname + '/mocks/homepage-auth-endpoint.html'); // Test #2
      });

      beforeEach('examine redirect', function(done) {
        chai.passport.use(strategy)
          .redirect(function(url) {
            endpointUrl = uri.parse(url);
            delete endpointUrl.search;

            endpointUrl = uri.format(endpointUrl);
            done();
          })
          .req(function(req) {
            req.method = 'POST';
            req.body = {
              me: mockUserId,
            };
            req.session = {};
          }).authenticate();
      });

      after('cleanup', function() {
        nock.cleanAll();
      });

      describe('with no endpoints', function() {

        it('should use the default auth endpoint', function() {
          expect(endpointUrl).to.equal(defaultAuthEndpoint);
        });

      }); // with no endpoints

      describe('with only authorization endpoint', function() {

        it('should use the discovered auth endpoint', function() {
          expect(endpointUrl).to.equal(mockAuthEndpoint);
        });

      }); // with only authorization endpoint

    }); // for a user with a homepage

  }); // to authorize a user

}); // @rcarls/passport-indieauth
