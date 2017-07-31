'use strict';

const { getMessage } = require('../../shared/messaging');
const { getSensorConfiguration } = require('../../shared/database');
const AWS = require('aws-sdk');
const log = require('../../shared/log');
const moment = require('moment');
const _ = require('lodash');
const path = require('path');


const s3 = new AWS.S3({
  region: AWS.config.region || process.env.SERVERLESS_REGION || 'us-east-1',
});

module.exports.handler = (event, context, callback) => {
  const message = getMessage(event);
  if (message.Records) {
    const { bucket, object } = message.Records[0].s3;
    const type = path.basename(object.key);
    return s3.getObject({ Bucket: bucket.name, Key: object.key }).promise()
      .then(({ Body }) => {
        const body = JSON.parse(Body);
        const { location, deviceId: initialDeviceId } = type === 'latest' ? body : body[0];
        return getSensorConfiguration({ location })
          .then((configurations) =>
            configurations
              .map(({ deviceId }) => deviceId)
              .filter(deviceId => deviceId !== initialDeviceId))
          .then(deviceIds => ({ deviceIds, initialObject: body, location }));
      })
      .then(({ deviceIds, initialObject, location }) =>
        Promise.all(deviceIds.map(deviceId =>
          s3.getObject({ Bucket: bucket.name, Key: `sensors/${deviceId}/${type}` }).promise()))
            .then(objects => objects.map(({ Body }) => JSON.parse(Body)))
            .then((objects) => {
              objects.push(initialObject);
              return { payload: objects, location };
            }))
      .then(({ payload, location }) => s3.putObject({
        Bucket: bucket.name,
        Key: `locations/${location}/${type}`,
        ContentType: 'application/json',
        Body: JSON.stringify(payload),
      }).promise())
      .then(() => callback(null, 'ok'));
  }
  return callback(null, 'error');
};
