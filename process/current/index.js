'use strict';

const AWS = require('aws-sdk');
const log = require('../../shared/log');
const { AttributeValue } = require('dynamodb-data-types');
const _ = require('lodash');

const {
  mapSensorData,
  enhanceSensorData,
} = require('../../shared/sensors');

const s3 = new AWS.S3({
  region: AWS.config.region || process.env.SERVERLESS_REGION || 'us-east-1',
});

module.exports.handler = (event, context, callback) => {
  log(event);

  const image =
    AttributeValue.unwrap(event.Records[0].dynamodb.NewImage);

  const payload = mapSensorData(image);

  if (!image.deviceId) {
    return log('No device id')
      .then(error => callback(error));
  }

  return enhanceSensorData({ deviceId: image.deviceId, sensorData: payload })
    .then((enhancedPayload) => {
      log('payload', enhancedPayload);
      return s3.putObject({
        Bucket: process.env.DATA_BUCKET_NAME,
        Key: `data/${image.deviceId}/current`,
        ContentType: 'application/json',
        Body: JSON.stringify(enhancedPayload),
      }).promise();
    })
    .then(() =>
      callback(null, 'ok'))
    .catch(error =>
      log(error)
        .then(() => callback(error)));
};
