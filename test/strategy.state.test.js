/* global describe, it, beforeEach, afterEach */

var chai = require('chai');
var expect = chai.expect;

var nock = require('nock');
var uri = require('url');

chai.use(require('chai-passport-strategy'));

var IndieAuthStrategy = require('../');

var mockClientId = 'https://example-client.com';
var mockRedirectUri = 'https://example-client.com/auth';
var mockUserId = 'https://example-user.com';
var mockState = 'abc';

describe('@rcarls/passport-indieauth', function() {

  var strategy = new IndieAuthStrategy({
    clientId: mockClientId,
    redirectUri: mockRedirectUri,
  }, function(uid, token, profile, done) {});

  beforeEach('mock the user\'s home page', function() {
    nock(mockUserId)
      .get('/')
      .replyWithFile(200, __dirname + '/mocks/homepage-auth-endpoint.html');
  });

  afterEach('cleanup', function() {
    nock.cleanAll();
  });

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
            me: mockUserId,
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
            me: mockUserId,
            state: mockState,
          };
          req.session = {};
        }).authenticate();

    });

  }); // with optional state parameter

}); // @rcarls/passport-indieauth
