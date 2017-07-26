'use strict';

const log = require('../shared/log');
const {
  insertSensorData,
  getSensorConfiguration,
} = require('../shared/database');

module.exports.handler = (event, context, callback) => {
  log(event);
  const response = (statusCode, payload) => ({
    statusCode,
    body: JSON.stringify(payload),
  });

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body);
    return insertSensorData(body)
      .then(() => callback(null, response(200, { message: 'ok' })))
      .catch(error =>
        log(error)
          .then(() => callback(null, response(500, { message: 'error' }))));
  } else if (event.httpMethod === 'GET') {
    const { id } = event.pathParameters;
    return getSensorConfiguration({ deviceId: id })
      .then(sensor => {
        if (typeof sensor === 'undefined') {
          return callback(null, response(500, { message: `invalid sensor id [${id}]` }));
        }
        return callback(null, response(200, sensor));
      });
  }

  return callback(null, response(404, { message: 'error' }));
};
