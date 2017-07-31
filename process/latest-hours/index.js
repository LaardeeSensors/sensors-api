'use strict';

const AWS = require('aws-sdk');
const log = require('../../shared/log');
const moment = require('moment');
const _ = require('lodash');

const s3 = new AWS.S3({
  region: AWS.config.region || process.env.SERVERLESS_REGION || 'us-east-1',
});

const {
  getEnhancedSensorData,
} = require('../../shared/database');

const {
  devicesByDeviceId,
} = require('../../shared/sensors');

module.exports.handler = (event, context, callback) => {
  log(event, context);
  const to = parseInt(moment().format('X'), 10);
  const from = parseInt(moment()
    .subtract(parseInt(event.type, 10), 'hours')
    .format('X'), 10);

  return getEnhancedSensorData({ from, to, deviceId: event.deviceId })
    .then(devicesByDeviceId)
    .then(log)
    .then((devices) => {
      log('devices', devices);
      const promises =
        Object.keys(devices).map(deviceId => s3.putObject({
          Bucket: process.env.DATA_BUCKET_NAME,
          Key: `sensors/${deviceId}/${event.type}`,
          ContentType: 'application/json',
          Body: JSON.stringify(devices[deviceId]),
        }).promise());
      return Promise.all(promises);
    })
    .then(() => callback(null, 'ok'));
};
