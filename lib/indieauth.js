var qs = require('querystring');
var Q = require('q');
var request = require('request');
var Microformats = require('microformat-node');


/**
 * Sends verification request back to authorization_endpoint
 *
 * @param {String} authEndpoint - The user's auth endpoint
 * @param {Object} params - The parameters object
 * @param {String} params.code - The verification code from the auth request
 * @param {String} params.clientId - The app's client ID. Must be identical to
 *     the one used in the initial request
 * @param {String} params.redirectUri - The app's redirect URI. Must be
 *     identical to the one used in the initial request
 * @param {String} [params.state] - The state token. Must be identical to the
 *     one used in the initial request
 * @param {callback} callback - The verifyAuthCode callback
 */
module.exports.verifyAuthCode = function(authEndpoint, params, callback) {

  /**
   * The verifyAuthCode callback
   * 
   * @callback callback
   * @param {Error|null} err - The Error object
   * @param {String|null} domain - The user's domain
   * @param {String|null} scope - The requested scopes (space-separated)
   * @param {Object|null} mfData - The parsed microformat data
   * @return {Promise<String[], Error>} - Promise for the domain, scope and info
   */

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (!authEndpoint) {
    return callback(
      new TypeError('authEndpoint is required for verification'),
      null, null, null
    );
  }
  
  if (!params.code) {
    return callback(
      new TypeError('Missing required "code" parameter'),
      null, null, null
    );
  }
  
  if (!params.clientId) {
    return callback(
      new TypeError('Missing required "clientId" parameter'),
      null, null, null
    );
  }
  
  if (!params.redirectUri) {
    return callback(
      new TypeError('Missing required "redirectUri" parameter'),
      null, null, null
    );
  }

  request.post(authEndpoint, {
    form: params,
  }, function(err, response, body) {
    if (err) { return callback(err, null, null, null); }

    if (response.statusCode !== 200) {
      return callback({ message: response.body, }, null, null, null);
    }
    
    var bodyData = qs.parse(body);
    
    if (!bodyData.me) {
      return callback(
	{ message: 'Malformed response from authorization server.', },
	null, null, null
      );
    }

    var mfData = Microformats.get(body);
    
    return callback(null, bodyData.me, bodyData.scope, mfData);
  });
  
};


/**
 * Parse user domain response for microformat data, including endpoint discovery
 * 
 * @param {String} domain - The user's domain
 * @param {callback} callback - The parseUserPage callback
 * @return {Promise<Error,Object>} - Promise for the parsed microformat data
 */
module.exports.parseUserPage = function(domain, callback) {

  /**
   * The parseUserPage callback
   * 
   * @param {Error|null} err - The Error object
   * @param {Object|null} mfData - The parsed microformat data
   */

  // Remove trailing slash for request
  var url = domain.replace(/\/+$/, '');
  
  request.get(url, function(err, response, body) {
    if (err) { return callback(err, null); }
    
    Microformats.get({
      html: body,
    }, function(err, mfData) {
      if (err) { return callback(err, null); }
      
      return callback(null, mfData);
    });
  });
};
