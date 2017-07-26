'use strict';

const _ = require('lodash');

const { getSensorData } = require('../../shared/database');
const AWS = require('aws-sdk');
const log = require('../../shared/log');

const { devicesByDeviceId } = require('../../shared/sensors');

const { mapSensorData } = require('../../shared/sensors');

const {
  getSensorConfiguration,
} = require('../../shared/database');

const s3 = new AWS.S3({
  region: AWS.config.region || process.env.SERVERLESS_REGION || 'us-east-1',
});

const calculateAverage = (items) => {
  const devices = devicesByDeviceId(items);
  // @todo REFACTOR AVERAGES!!!
  const averages =
    _(devices)
      .map(({ items: averageItems }) => {
        const mappedAverageItems = averageItems.map(mapSensorData);
        return mappedAverageItems.reduce((result, { timestamp, sensors, deviceId }) => {
          const averageResult = Object.assign({}, result);
          if (!averageResult[deviceId]) {
            averageResult[deviceId] = {
              timestamps: [],
              temperature: [],
              absolutepressure: [],
            };
          }

          const avg = averageResult[deviceId];

          avg.timestamps.push(timestamp);

          avg.start = _.first(avg.timestamps);
          avg.end = _.last(avg.timestamps);

          avg.temperature.push(_.find(sensors, { type: 'temperature' }).value);
          avg.absolutepressure.push(_.find(sensors, { type: 'absolutepressure' }).value);
          avg.averageTemperature =
            _.sum(avg.temperature) / avg.temperature.length;
          avg.averageAbsolutepressure =
            _.sum(avg.absolutepressure) / avg.absolutepressure.length;

          return averageResult;
        }, {});
      }).value();

  return Promise.all(_.map(averages, (average) =>
    _.map(average, (value, deviceId) => {
      const payload = {
        sensors: [
          {
            type: 'temperature',
            value: value.averageTemperature,
            unit: 'C',
          },
          {
            type: 'absolutepressure',
            value: value.averageAbsolutepressure,
            unit: 'hPa',
          },
        ],
        start: value.start,
        end: value.end,
        deviceId,
      };

      return getSensorConfiguration({ deviceId })
        .then(({ name }) => {
          const enhancedPayload = Object.assign({}, payload, { name });
          log('payload', enhancedPayload);
          return s3.putObject({
            Bucket: process.env.DATA_BUCKET_NAME,
            Key: `data/${deviceId}/average/1h`,
            ContentType: 'application/json',
            Body: JSON.stringify(enhancedPayload),
          }).promise();
        });
    })));
};

module.exports.handler = (event, context, callback) => {
  const to = Math.round(Date.now() / 1000);
  const from = to - 3600;
  return getSensorData({ from, to })
    .then(calculateAverage)
    .then(() => callback(null, 'ok'))
    .catch(error =>
      log(error)
        .then(() => callback(error)));
};
