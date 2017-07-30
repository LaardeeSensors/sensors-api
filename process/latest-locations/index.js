'use strict';

const log = require('../../shared/log');
const { getMessage } = require('../../shared/messaging');

module.exports.handler = (event, context, callback) => {
  log(getMessage(event));
  callback(null, 'ok');
};
