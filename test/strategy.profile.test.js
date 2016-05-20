/* global describe, it, before, beforeEach */

var chai = require('chai');
var expect = chai.expect;
var nock = require('nock');

chai.use(require('chai-passport-strategy'));

var util = require('util');
var qs = require('querystring');

var IndieAuthStrategy = require('../');

var mockClientId = 'https://example-client.com';
var mockRedirectUri = 'https://example-client.com/auth';
var mockUserId = 'https://example-user.com';
var mockAuthEndpoint = 'https://example-auth-endpoint.com/head/auth';
var mockScope = 'post edit';
var mockState = 'abc';
var mockAuthCode = '1234';

// Profile values
var mockProfile = { provider: 'indieauth',
	            photos: 
                    [ { value: '/images/john_doe1.jpg' },
                      { value: '/images/john_doe2.jpg' } ],
                    name: 
                    { formatted: 'Mr.John “The Default” Joe Doe Ph.D',
                      honorificPrefix: 'Mr.',
                      givenName: 'John',
                      middleName: 'Joe',
                      familyName: 'Doe',
                      honorificSuffix: 'Ph.D' },
                    displayName: '“The Default”',
                    gender: 'Male',
                    note: 'Lorem ipsum dolar sit amet',
                    emails: 
                    [ { value: 'john.doe@example.com' },
                      { value: 'john.doe2@example.com' } ],
                    birthday: '1985-11-02T00:00:00-05:00',
                    anniversary: '2013-09-28T00:00:00-05:00',
                    phoneNumbers: [ { value: '555-555-5555' }, { value: '+1 (666) 666-6666' } ],
                    urls: 
                    [ { value: 'https://example-user.com' },
                      { value: 'https://plus.google.com/+JohnDoe' } ] };

var mockMfData = { items: 
                   [ { type: [ 'h-card' ],
                       properties: 
                       { photo: [ '/images/john_doe1.jpg', '/images/john_doe2.jpg' ],
                         name: [ 'Mr.John “The Default” Joe Doe Ph.D' ],
                         'honorific-prefix': [ 'Mr.' ],
                         'given-name': [ 'John' ],
                         nickname: [ '“The Default”' ],
                         'additional-name': [ 'Joe' ],
                         'family-name': [ 'Doe' ],
                         'honorific-suffix': [ 'Ph.D' ],
                         'gender-identity': [ 'Male' ],
                         adr: 
                         [ { value: '123 Main St.\n\tApt. B\n\tExampleton\n\tDefaulting\n\t12345\n\tTest Nation',
                             type: [ 'h-adr' ],
                             properties: 
                             { 'street-address': [ '123 Main St.' ],
                               'extended-address': [ 'Apt. B' ],
                               locality: [ 'Exampleton' ],
                               region: [ 'Defaulting' ],
                               'postal-code': [ '12345' ],
                               'country-name': [ 'Test Nation' ],
                               name: [ '123 Main St.\n\tApt. B\n\tExampleton\n\tDefaulting\n\t12345\n\tTest Nation' ] 
                             } } ],                                                                                                  
                         note: [ 'Lorem ipsum dolar sit amet' ],
                         email: [ 'john.doe@example.com', 'john.doe2@example.com' ],
                         bday: [ '1985-11-02T00:00:00-05:00' ],
                         anniversary: [ '2013-09-28T00:00:00-05:00' ],
                         tel: [ '555-555-5555', '+1 (666) 666-6666' ],
                         url: 
                         [ 'https://example-user.com',
                           'https://plus.google.com/+JohnDoe' ],
                         uid: [ 'https://example-user.com' ] } } ],
                   rels: 
                   { authorization_endpoint: 
                     [ 'https://example-auth-endpoint.com/head/auth',
                       'https://example-auth-endpoint.com/body/auth' ],
                     micropub: [ 'https://example-user.com/micropub' ],
                     me: 
                     [ 'https://example-user.com',
                       'https://plus.google.com/+JohnDoe' ] },
                   'rel-urls': 
                   { 'https://example-auth-endpoint.com/head/auth': { rels: [ 'authorization_endpoint' ] },
                     'https://example-user.com/micropub': { rels: [ 'micropub' ] },
                     'https://example-user.com': { text: 'Homepage', rels: [ 'me' ] },
                     'https://plus.google.com/+JohnDoe': { text: 'Google', rels: [ 'me' ] },
                     'https://example-auth-endpoint.com/body/auth': { rels: [ 'authorization_endpoint' ] } } };

describe('@rcarls/passport-indieauth', function() {
  
  describe('the authorized user', function () {
    
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

    describe('with default profile option', function() {
      var result;

      var strategy = new IndieAuthStrategy({
        clientId: mockClientId + '/',
        redirectUri: mockRedirectUri,
      }, function(domain, scope, profile, done) {
        user = {
          me: domain,
          scope: scope,
          profile: profile,
        };
        
        return done(null, user, null);
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

    }); // with default profile option

    describe('with mfData profile option', function() {
      var result;

      var strategy = new IndieAuthStrategy({
        clientId: mockClientId + '/',
        redirectUri: mockRedirectUri,
        mfDataAsProfile: true,
      }, function(domain, scope, profile, done) {
        user = {
          me: domain,
          scope: scope,
          profile: profile,
        };
        
        return done(null, user, null);
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
      
      it('should have mfData profile data', function() {
        expect(result).to.have.property('profile')
          .which.deep.equals(mockMfData);
      });

    }); // with mfData profile option
    
  }); // the authorized user

}); // @rcarls/passport-indieauth
