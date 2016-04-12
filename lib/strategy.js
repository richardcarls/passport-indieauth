/* jshint node: true */
'use strict';

var util = require('util'),
    qs = require('querystring'),
    Strategy = require('passport-strategy'),
    request = require('request'),
    Microformats = require('microformat-node');

/**
 * Creates an instance of `IndieAuthStrategy`.
 *
 * @constructor
 * @param {Object} options - The options object
 * @param {String} options.clientId - The application's client id
 * @param {String} options.redirectUri - The redirect URI for delegated
 *     authorization
 * @param {Boolean} [options.passReqtoCallback] - If `true`, passes the request
 *     object as the first parameter to the verify callback
 * @param {callback1|callback2} verify - The verify callback
 */
function IndieAuthStrategy(options, verify) {

  /**
   * The verify callback
   * 
   * @callback callback1
   * @param {String} domain - The user's authorized domain
   * @param {Array} scopes - The user's authorized scopes
   * @param {Function} done - Callback after verify step
   */
  
  /**
   * The verify callback with request object
   * 
   * @callback callback2
   * @param {Object} req - The request object if configured
   * @param {String} domain - The user's authorized domain
   * @param {Array} scopes - The user's authorized scopes
   * @param {Function} done - Callback after verify step
   */
  
  if (!!options && options.constructor !== Object) { throw new TypeError('IndieAuthStrategy requires an options object'); }
  if (typeof verify !== 'function') { throw new TypeError('IndieAuthStrategy requires a verify callback'); }
  
  if (!options.clientId) { throw new TypeError('IndieAuthStrategy requires a clientId option'); }
  if (!options.redirectUri) { throw new TypeError('IndieAuthStrategy requires a redirectUri option'); }

  this._clientId = options.clientId;
  this._redirectUri = options.redirectUri;
  
  Strategy.call(this);

  this.name = 'indieauth';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
}

util.inherits(IndieAuthStrategy, Strategy);

/**
 * Authenticate request.
 *
 * @param {Object} req The request to authenticate.
 * @param {Object} [options] Strategy-specific options.
 */
Strategy.prototype.authenticate = function(req, options) {
  options = options || {};

  var domain,
      authEndpoint,
      scopes;
  
  var self = this;

  // Handle initial authorization request
  if (!req.user) {
    var hasMeParam = (req.body && req.body.me) ||
	(req.query && req.query.me);
    
    if (!hasMeParam) {
      return self.fail({ message: 'Missing required "me" parameter', }, 400);
    }
    
    domain = req.body.me || req.query.me;
    
    request.get(domain, function(err, response, body) {
      if (err) { return self.error(err); }
      
      Microformats.get({
	html: body,
      }, function(err, mfData) {
	if (err) { return self.error(err); }
	
	console.log(mfData.rels);
	if (!mfData.rels || !mfData.rels.authorization_endpoint) {
	  return self.fail({ message: 'Could not find an "authorization_endpoint" link', });
	}

	// Grab the first link
	authEndpoint = mfData.rels.authorization_endpoint[0];

	return self.redirect(authEndpoint + '?' + qs.stringify({
	  me: domain,
	  client_id: self._clientId,
	  redirect_uri: self._redirectUri,
	}));
      });
    });
  } else { 
    try {
      if (self._passReqToCallback) {
	self._verify(req, domain, scopes, verified);
      } else {
	self._verify(domain, scopes, verified);
      }
    } catch(err) {
      return self.error(err);
    }
  }

  /**
   * @private
   */
  function verified(err, user, info) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(info); }

    return self.success(user, info);
  }
};


/**
 * Expose `Strategy`.
 */
module.exports = IndieAuthStrategy;
