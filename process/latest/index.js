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

const lambda = new AWS.Lambda({
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
      return Promise.all([
        s3.putObject({
          Bucket: process.env.DATA_BUCKET_NAME,
          Key: `sensors/${enhancedPayload.deviceId}/latest`,
          ContentType: 'application/json',
          Body: JSON.stringify(enhancedPayload),
        }).promise(),
        lambda.invoke({
          FunctionName:
            `${process.env.SERVERLESS_PROJECT}-${process.env.SERVERLESS_STAGE}-latest-hours`,
          InvocationType: 'Event',
          Payload: JSON.stringify({ type: '1h', deviceId: image.deviceId }),
        }).promise(),
      ]);
    })
    .then(() =>
      callback(null, 'ok'))
    .catch(error =>
      log(error)
        .then(() => callback(error)));
};
