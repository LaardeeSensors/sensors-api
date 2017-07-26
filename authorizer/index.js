'use strict';

const { decrypt } = require('../shared/secrets');
const log = require('../shared/log');

const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {
    principalId,
  };
  if (effect && resource) {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      }],
    };
    Object.assign(authResponse, { policyDocument });
  }
  return authResponse;
};

exports.handler = (event, context, callback) => {
  log(event);
  const token = event.authorizationToken.toLowerCase();
  return decrypt([process.env.AUTHORIZATION_TOKEN])
    .then(([authorizationToken]) => {
      if (token === authorizationToken) {
        return callback(null, generatePolicy('user', 'Allow', event.methodArn));
      }
      return callback('Error: Invalid token');
    })
    .catch(error =>
      log(error)
        .then(callback('Error: Decrypt failed')));
};
