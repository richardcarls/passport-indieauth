#passport-indieauth (PRE-PUBLISH)
[![Build Status](https://travis-ci.org/richardcarls/passport-indieauth.svg?branch=master)](https://travis-ci.org/richardcarls/passport-indieauth)
[![Coverage Status](https://coveralls.io/repos/github/richardcarls/passport-indieauth/badge.svg?branch=master)](https://coveralls.io/github/richardcarls/passport-indieauth?branch=master)
[![Code Climate](https://codeclimate.com/github/richardcarls/passport-indieauth/badges/gpa.svg)](https://codeclimate.com/github/richardcarls/passport-indieauth)

An [IndieAuth](http://indiewebcamp.com/IndieAuth) authentication strategy for [Passport](http://passportjs.org/).

This module exports a Passport `Strategy` class to be used by applications that utilize Passport
middleware for authentication. By plugging into Passport, developers can easily integrate IndieAuth
into any [Node.js](https://nodejs.org/en/) application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including the popular [Express](http://expressjs.com/).

This strategy only implements the client-side of the [IndieAuth protocol](http://indiewebcamp.com/IndieAuthProtocol), and relies on endpoint discovery to determine how
to delegate authentication. A fallback authorization endpoint can be configured, and the strategy defaults to using the canonical [indieauth.com](https://indieauth.com).

## Install

```shell
$ npm install @rcarls/passport-indieauth
```

## Usage

#### Configure Strategy
The IndieAuth authentication strategy only requires a client id, usually the domain of the web application, and a
redirect URI for authorization flow. The request object can optionally be passed to the verify callback.

```javascript
require('passport');
require('@rcarls/passport-indieauth');

// ...

passport.use(new IndieAuthStrategy({
		clientId: 'https://example-client.com/',
		redirectUri: 'https://example-client.com/auth',
		passReqToCallback: true,
  }, function(req, domain, scope, profile, done) {
		User.findOrCreate({ url: domain }, function(err, user) {
			return done(err, user);
		});
  });
});
```

#### Configuration Options
- `clientId` {String} - The application's client id. Must be a valid URL that accepts HTTP or HTTPS requests.
  The convention is to include a trailing slash after the domain name, but is not required.
  (ex: `https://example-client.com/`)
- `redirectUri` {String} - The authorization redirect URI.
- `responseType` {String} - The response type of the auth request. Valid values are `'id'` (identification only), or `'code'` (identification + authorization) (optional, defaults to 'id')
- `defaultAuthEndpoint` {String} - The fallback authorization service to use if not discovered. (optional, defaults to 'https://indieauth.com/auth')
- `passReqToCallback` {Boolean} - If `true`, passes the request object to the verify callback. (optional, defaults to false)

#### Authenticate Requests
Use `passport.authenticate()`, specifying the `'indieauth'` strategy, to authenticate requests.

```javascript
// example authenticating a request to a route in Express

app.get('/profile', passport.authenticate('indieauth', { failureRedirect: '/login' }),
  function(req, res) {
	// req.user contains the authenticated user instance
	return res.send('<h1>Logged in as ' + req.user.url + '</h1>');
  });
```

You can use the strategy for both requesting an auth code from a login page, and handling the code verification on the redirect route

```javascript
// put on your login route to capture the request params and kick off the authorization flow
app.post('/login', passport.authenticate('indieauth', { failureRedirect: '/login', failureFlash: true, }));

// put on your redirect route to handle the auth response and verification
app.get('/auth', passport.authenticate('indieauth', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true, }));
```

#### Getting the User Profile
The strategy provides structured profile data consistent with the [Portable Contacts draft spec](http://portablecontacts.net/draft-spec.html) if found when parsing the user's domain response. Note that not all possible mappings are currently implemented at this time. The full parsed JSON data is included in the `_json` property. See [microformat-node](https://github.com/glennjones/microformat-node#output) for the structure of this data, and [h-card draft spec](http://microformats.org/wiki/h-card) for standard properties.

```javascript
passport.use(new IndieAuthStrategy({
		clientId: 'https://example-client.com/',
		redirectUri: 'https://example-client.com/auth',
  }, function(domain, scope, profile, done) {
	  var user = {
		  me: domain,
		  scope: scope,
	  };
	  
	  if (profile.name && profile.name.formatted) {
		  user.name = profile.name.formatted;
	  }
	  
	  if (profile.photos && profile.photos.length) {
		  user.avatarUrl = profile.photos[0].value;
	  }
	  
	  // etc.
  });
});
```

#### Using IndieAuth
See the [IndieWebCamp wiki entry for IndieAuth](http://indiewebcamp.com/IndieAuth) and [setup instructions](https://indieauth.com/setup) to start using your own domain for web sign-in. In addition to your client id being your web application's domain name, the protocol requires the inclusion of a `<link rel="redirect_uri" />` tag on your root page. (note: this is seems to be a "soft" requirement at this point).

Users may optionally specify a `rel="authorization_endpoint"` on thier home page to use an authentication service of thier choosing. To make profile information available, a user will need to have an [h-card](http://microformats.org/wiki/h-card) in the body of thier home page.

#### Other Usage Notes
- The strategy currently uses a `_csrf` request property as the `state` parameter in authentication requests to the discovered service to
  [prevent CSRF attacks](http://tools.ietf.org/html/rfc6749#section-10.12). It is recommended to use a middleware like [csurf](https://www.npmjs.com/package/csurf)
  to generate csrf tokens to embed on your login page.
- For allowing unauthenticated requests, specify [passport-anonymous](https://www.npmjs.com/package/passport-anonymous) after indieauth:

	```javascript
	passport.authenticate(['indieauth', 'anonymous']);
	```

## Related Modules
- [passport-indieauth](https://github.com/mko/passport-indieauth) - IndieAuth authentication strategy for Passport.
- [relmeauth](https://www.npmjs.com/package/relmeauth) - A rel=me auth middleware implementation in node.js. Works with any connect-type web application
- [passport](https://github.com/jaredhanson/passport) - Simple, unobtrusive authentication for Node.js.

## Tests

```shell
$ npm install
$ npm test
```

## Contributing
Please feel free to submit bugs and feature requests through the issues interface. I welcome pull requests, even for small things.

#### Tests
The test suite is located in the `test/` directory. All new features are expected to have corresponding test cases. Ensure that all tests are passing by running the test command. Improvements to the test suite are welcome (I'm new), submit a pull request!

```shell
npm test
```

## Credits
- [Richard Carls](https://richardcarls.com)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2016 Richard Carls <[https://richardcarls.com](https://richardcarls.com)>
