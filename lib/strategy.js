var util = require('util');
var qs = require('querystring');
var dot = require('dot-object');
var request = require('request');
var Microformats = require('microformat-node');
var Strategy = require('passport-strategy');

/**
 * Creates an instance of `IndieAuthStrategy`.
 *
 * @see http://indiewebcamp.com/IndieAuthProtocol
 *
 * @constructor
 * @param {Object} options - The options object
 * @param {String} options.clientId - The application's client id
 * @param {String} options.redirectUri - The redirect URI for delegated
 * authorization
 * @param {String} [options.responseType='id'] - The response type of the
 * auth request. Valid values are `'id'` (identification only), or
 * `'code'` (identification + authorization)
 * @param {String} [options.defaultAuthEndpoint='https://indieauth.com/auth']
 * - The fallback authorization service to use if not discovered.
 * @param {Boolean} [options.passReqtoCallback] - If `true`, passes the request
 * object as the first parameter to the verify callback
 * @param {callback1|callback2} verify - The verify callback
 */
function IndieAuthStrategy(options, verify) {

  /**
   * The verify callback
   *
   * @callback callback1
   * @param {String} uid - The user's authorized domain
   * @param {String|null} token - The user's access token
   * @param {Object} profile - PortableContacts profile data
   * @param {Function} done - Callback after verify step
   */

  /**
   * The verify callback with request object
   *
   * @callback callback2
   * @param {Object} req - The request object if configured
   * @param {String} uid - The user's authorized domain
   * @param {String|null} token - The user's access token
   * @param {Object} profile - PortableContacts profile data
   * @param {Function} done - Callback after verify step
   */

  Strategy.call(this);

  validateArguments();

  this.name = 'indieauth';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
  this._clientId = options.clientId;
  this._redirectUri = options.redirectUri;
  this._defaultAuthEndpoint = options.defaultAuthEndpoint;
  this._responseType = options.responseType;

  /**
   * @private
   */
  function validateArguments() {
    if (!!options && options.constructor !== Object) {
      throw new TypeError('IndieAuthStrategy requires an options object');
    }

    if (typeof verify !== 'function') {
      throw new TypeError('IndieAuthStrategy requires a verify callback');
    }

    if (!options.clientId) {
      throw new TypeError('IndieAuthStrategy requires a clientId option');
    }

    // TODO: Verify clientId as a valid URI

    // Add trailing slash if not present
    options.clientId = options.clientId
      .replace(/\/?$/, '/');

    if (!options.redirectUri) {
      throw new TypeError('IndieAuthStrategy requires a redirectUri option');
    }
    // TODO: Verify redirectUri as a valid URI
    // TODO: Parse client page and warn if no rel=redirect_uri is present

    options.defaultAuthEndpoint = (
      options.defaultAuthEndpoint || 'https://indieauth.com/auth'
    );

    // TODO: Verify defaultAuthEndpoint as valid URI

    options.responseType = options.responseType || 'id';

    if (options.responseType !== 'id' && options.responseType !== 'code') {
      throw new TypeError('responseType must be one of either "id" or "code"');
    }
  }

}

util.inherits(IndieAuthStrategy, Strategy);

/**
 * Authenticate request.
 *
 * @param {Object} req - The request to authenticate.
 * @param {Object} [options] - Strategy-specific options.
 */
Strategy.prototype.authenticate = function(req, options) {

  var requestParams = {};
  var authEndpoint;
  var tokenEndpoint;

  options = options || {};

  if (req.method === 'POST' && req.body) {
    requestParams = req.body;
  } else if (req.method === 'GET' && req.query) {
    requestParams = req.query;
  } else {
    return this.fail({ message: 'Missing request parameters', }, 400);
  }

  if (!requestParams.me) {
    return this.fail({ message: 'Missing required "me" parameter', }, 400);
  }

  // Add trailing slash if not present
  requestParams.me = requestParams.me
    .replace(/\/?$/, '/');

  var strategy = this;

  parseUserPage(requestParams.me, function parseUserPageCB(err, mfData) {
    if (err) { return strategy.fail({ message: err.message, }); }

    if (mfData.rels && mfData.rels.authorization_endpoint) {
      // Get discovered authorization endpoint
      authEndpoint = mfData.rels.authorization_endpoint[0];
    }

    if (mfData.rels && mfData.rels.token_endpoint && authEndpoint) {
      // Get discovered token endpoint
      tokenEndpoint = mfData.rels.token_endpoint[0];
    }

    // Use fallback auth endpoint
    authEndpoint = authEndpoint || strategy._defaultAuthEndpoint;

    // Use fallback auth endpoint
    authEndpoint = authEndpoint || strategy._defaultAuthEndpoint;

    if (!requestParams.code) {

      var authParams = {
        me: requestParams.me,
        /* eslint-disable camelcase */
        client_id: strategy._clientId,
        redirect_uri: strategy._redirectUri,
        response_type: strategy._responseType,
        /* eslint-enable camelcase */
      };

      // TODO: Let state parameter be configurable
      var state = requestParams.state || requestParams._csrf;

      if (state) {
        authParams.state = state;
      }

      var requestUrl = authEndpoint + '?' + qs.stringify(authParams);

      return strategy.redirect(requestUrl);

    } else {

      var verifyEndpoint = (
        tokenEndpoint || authEndpoint
      );

      verifyAuthCode(verifyEndpoint, {
        code: requestParams.code,
        scope: requestParams.scope,
        /* eslint-disable camelcase */
        client_id: strategy._clientId,
        redirect_uri: strategy._redirectUri,
        /* eslint-enable camelcase */
        state: requestParams.state,
      }, function verifyAuthCodeCB(err, uid, token) {
        if (err) { return strategy.error(err); }

        var profile;

        // TODO: Implement 'profileFields' option
        profile = convertToProfile(mfData);

        if (strategy._passReqToCallback) {
          return strategy._verify(
            req, uid, token, profile, verified.bind(strategy)
          );
        } else {
          return strategy._verify(
            uid, token, profile, verified.bind(strategy)
          );
        }
      });
    }
  });


  /**
   * The verify callback
   *
   * @callback verified
   * @param {Error|null} err - The Error object
   * @param {Object|null} user - The deserialized user object
   * @param {Object} [info] - The info object
   */
  function verified(err, user, info) {
    if (err) { return this.error(err); }
    if (!user) { return this.fail(info); }

    info = info || {};

    return this.success(user, info);
  }
};


/**
 * Return PortableContacts compatible profile from parsed
 * microformat data
 *
 * @private
 * @param {Object} mfData - The parsed microformat data
 * @return {Object} - PortableContacts structured contact data
 */
function convertToProfile(mfData) {
  var profile;
  var properties;

  profile = {
    provider: 'indieauth',
    _json: mfData,
  };

  if (!mfData || !mfData.items.length) { return profile; }

  mfData.items.map(function(item) {
    if (item.type && item.type[0] === 'h-card') {
      properties = item.properties;
    }
  });

  if (!properties) { return profile; }

  // TODO: Add organization element support
  var singularProps = {
    'id': 'uid',
    'nickname': 'displayName',
    'name': 'name.formatted',
    'honorific-prefix': 'name.honorificPrefix',
    'given-name': 'name.givenName',
    'additional-name': 'name.middleName',
    'family-name': 'name.familyName',
    'honorific-suffix': 'name.honorificSuffix',
    'street-address': 'address.streetAddress',
    'locality': 'address.locality',
    'region': 'address.region',
    'postal-code': 'address.postalCode',
    'country-name': 'address.country',
    'bday': 'birthday',
    'anniversary': 'anniversary',
    'gender-identity': 'gender',
    'note': 'note',
  };

  // TODO: Support plural element types (address, organization)
  var pluralProps = {
    'email': 'emails',
    'photo': 'photos',
    'tel': 'phoneNumbers',
    'url': 'urls',
  };

  return Object.keys(properties)
    .reduce(function(profile, key) {
      if (singularProps[key]) {
        dot.copy(key + '[0]', singularProps[key], properties, profile);
      } else if (pluralProps[key]) {
        var target = pluralProps[key];

        profile[target] = profile[target] || [];

        properties[key].forEach(function(value) {
          profile[target].push({ value: value, });
        });
      }

      return profile;
    }, profile);
}


/**
 * Sends verification request back to authorization_endpoint
 *
 * @private
 * @param {String} url - The user's token or auth endpoint
 * @param {Object} params - The parameters object
 * @param {String} params.code - The verification code from the auth request
 * @param {String} params.clientId - The app's client ID. Must be identical to
 * the one used in the initial request
 * @param {String} params.redirectUri - The app's redirect URI. Must be
 * identical to the one used in the initial request
 * @param {String} [params.state] - The state token. Must be identical to the
 * one used in the initial request
 * @param {callback} callback - The verifyAuthCode callback
 */
function verifyAuthCode(url, params, callback) {

  /**
   * The verifyAuthCode callback
   *
   * @callback callback
   * @param {Error|null} err - The Error object
   * @param {String|null} uid - The user's domain
   * @param {String|null} token - The user's access token
   */

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (!url) {
    return callback(
      new TypeError('url is required for verification'),
      null, null
    );
  }

  if (!params.code) {
    return callback(
      new TypeError('Missing required "code" parameter'),
      null, null
    );
  }

  request.post(url, {
    form: params,
  }, function(err, response, body) {
    if (err) { return callback(err, null, null); }

    if (response.statusCode !== 200) {
      return callback({ message: response.body, }, null, null);
    }

    var bodyData = qs.parse(body);

    if (!bodyData.me) {
      return callback(
        { message: 'Malformed response from authorization server.', },
        null, null
      );
    }

    return callback(null, bodyData.me, bodyData.access_token);
  });
}


/**
 * Parse user domain response for microformat data, including endpoint discovery
 *
 * @private
 * @param {String} url - The user's domain
 * @param {callback} callback - The parseUserPage callback
 * @return {Promise<Error,Object>} - Promise for the parsed microformat data
 */
function parseUserPage(url, callback) {

  /**
   * The parseUserPage callback
   *
   * @param {Error|null} err - The Error object
   * @param {Object|null} mfData - The parsed microformat data
   */

  // Remove trailing slash for request
  var requestUrl = url.replace(/\/+$/, '');

  request.get(requestUrl, function(err, response, body) {
    if (err) { return callback(err, null); }

    if (!body) {
      return callback(
        new TypeError('request to user page must return a body'),
        null
      );
    }

    Microformats.get({
      html: body,
    }, function(err, mfData) {
      if (err) { return callback(err, null); }

      return callback(null, mfData);
    });
  });
}


/**
 * Expose `Strategy`.
 */
module.exports = IndieAuthStrategy;
