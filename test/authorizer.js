'use strict';

// tests for authorizer
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const lambdaWrapper = mochaPlugin.lambdaWrapper;
const expect = mochaPlugin.chai.expect;
let wrapped;

if (process.env.SERVERLESS_MOCHA_PLUGIN_LIVE) {
  const mod = mochaPlugin.initLiveModule('authorizer');
  wrapped = lambdaWrapper.wrap(mod);
} else {
  const mod = require(process.env.SERVERLESS_TEST_ROOT + '/authorizer/index.js');
  wrapped = lambdaWrapper.wrap(mod, { 
    handler: 'handler' 
  });
}

describe('authorizer', () => {
  before((done) => {
//  lambdaWrapper.init(liveFunction); // Run the deployed lambda

    done();
  });

  it('implement tests here', () => {
    return wrapped.run({}).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});
