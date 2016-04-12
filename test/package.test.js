/* global describe, it */
'use strict';

var expect = require('chai').expect;

var IndieAuthStrategy = require('../');


describe('@rcarls/passport-indieauth', function() {

  it('should export Strategy constructor directly from package', function() {
    expect(IndieAuthStrategy).to.be.a('function');
    expect(IndieAuthStrategy).to.equal(IndieAuthStrategy.Strategy);
  });
  
});
