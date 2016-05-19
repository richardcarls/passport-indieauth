#@rcarls/passport-indieauth

An [IndieAuth](http://indiewebcamp.com/IndieAuth) authentication strategy for [Passport](http://passportjs.org/).

This module exports a Passport `Strategy` class to be used by applications that utilize Passport
middleware for authentication. By plugging into Passport, developers can easily integrate IndieAuth
into any [Node.js](https://nodejs.org/en/) application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including the popular [Express](http://expressjs.com/).

This strategy only implements the client-side of the [IndieAuth protocol](http://indiewebcamp.com/IndieAuthProtocol), and relies on endpoint discovery to determine how
to delegate authentication. **A fallback authentication endpoint will be configurable in future versions.**

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
```

#### Configuration Options
- `clientId` {String} - The application's client id. Must be a valid URL that accepts HTTP or HTTPS requests.
  The convention is to include a trailing slash after the domain name, but is not required.
  (ex: `https://example-client.com/`)
- `redirectUri` {String} - The authorization redirect URI.
- `passReqToCallback` {Boolean} - If `true`, passes the request object to the verify callback. (optional)

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

#### Using IndieAuth
See the [IndieWebCamp wiki entry for IndieAuth](http://indiewebcamp.com/IndieAuth) and [setup instructions](https://indieauth.com/setup) to start using
your own domain for web sign-in. In addition to your client id being your web application's domain name, the protocol requires the inclusion of
a `<link rel="redirect_uri" />` tag on your root page. (note: this is not currently required if using indieauth.com, but it is part of the protocol).

Users may optionally specify a `rel="authorization_endpoint"` on your home page to use an authentication service of your
choosing.

#### Other Usage Notes
- The strategy currently uses a `_csrf` request property as the `state` parameter in authentication requests to the discovered service to
  [prevent CSRF attacks](http://tools.ietf.org/html/rfc6749#section-10.12). It is recommended to use a middleware like [csurf](https://www.npmjs.com/package/csurf)
  to generate csrf tokens to embed on your login page. **Note: The state parameter will be configurable in future versions.**
- For allowing unauthenticated requests, specify [passport-anonymous](https://www.npmjs.com/package/passport-anonymous) after indieauth:

	```javascript
	passport.authenticate(['indieauth', 'anonymous']);
	```

- The `profile` argument supplied to the verify callback is the parsed microformats data from the user's home page. See
  [microformat-node](https://github.com/glennjones/microformat-node#output) for the structure of this data. Common usage would be to save the user's
  name and photo URL from the [representative h-card](https://indiewebcamp.com/representative_h-card), or the discovered
  [micropub](https://indiewebcamp.com/Micropub) endpoint.

## Related Modules
- [passport-indieauth](https://github.com/mko/passport-indieauth) - IndieAuth authentication strategy for Passport.
- [relmeauth](https://www.npmjs.com/package/relmeauth) - A rel=me auth middleware implementation in node.js. Works with any connect-type web application

## Tests

```shell
$ npm install
$ npm test
```

## Contributing


#### Tests
The test suite is located in the `test/` directory. All new features are expected to have corresponding test cases. Ensure that all tests are
passing by running the test command.

```shell
npm test
```

## Credits
- [Richard Carls](https://richardcarls.com)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2016 Richard Carls <[https://richardcarls.com](https://richardcarls.com)>
