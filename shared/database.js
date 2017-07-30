'use strict';

const AWS = require('aws-sdk');
const log = require('./log');
const _ = require('lodash');

const { enhanceSensorDataWithConfiguration } = require('./sensors');

const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: AWS.config.region || process.env.SERVERLESS_REGION || 'us-east-1',
});

const insertSensorData = (data) => {
  const Item = Object.assign({ created: Date.now() }, data);
  const params =
    Object.assign(
      { TableName: process.env.RAW_DATA_TABLE_NAME },
      { Item });
  return dynamodb.put(params).promise();
};

const getSensorData = ({ from, to, deviceId }) => {
  const params =
    Object.assign(
      { TableName: process.env.RAW_DATA_TABLE_NAME },
      {
        ProjectionExpression: '#mac, #timestamp, #sensors, #deviceId',
        FilterExpression: '#timestamp between :from and :to',
        ExpressionAttributeNames: {
          '#mac': 'mac',
          '#timestamp': 'timestamp',
          '#sensors': 'sensors',
          '#deviceId': 'deviceId',
        },
        ExpressionAttributeValues: {
          ':from': from,
          ':to': to,
        },
      });

  if (deviceId) {
    Object.assign(params, {
      FilterExpression: '#timestamp between :from and :to and #deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':from': from,
        ':to': to,
        ':deviceId': deviceId,
      },
    });
  }

  return dynamodb.scan(params).promise()
    .then(data => data.Items);
};

const getSensorConfiguration = ({ deviceId }) => {
  const params =
    Object.assign(
      { TableName: process.env.SENSORS_TABLE_NAME },
      {
        ProjectionExpression:
          '#mac, #deviceId, #configuration, #name, #location, #coordinates, #altitude',
        ExpressionAttributeNames: {
          '#mac': 'mac',
          '#name': 'name',
          '#deviceId': 'deviceId',
          '#configuration': 'configuration',
          '#location': 'location',
          '#coordinates': 'coordinates',
          '#altitude': 'altitude',
        },
      });

  if (deviceId) {
    Object.assign(params, {
      FilterExpression: '#deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': deviceId,
      },
    });
  }

  return dynamodb.scan(params).promise()
    .then(data => (deviceId ? data.Items[0] : data.Items));
};

const getEnhancedSensorData = ({ from, to, deviceId }) =>
  getSensorConfiguration({ deviceId })
    .then(configurationItems =>
      getSensorData({ from, to, deviceId })
        .then(sensorData => sensorData.reduce((result, data) => {
          const configurationItem = _.find(configurationItems, { deviceId: data.deviceId });
          if (configurationItem) {
            const d = enhanceSensorDataWithConfiguration({ configuration: configurationItem, sensorData: data });
            log(d);
            result.push(d);
          }
          return result;
        }, [])));


module.exports = {
  getSensorData,
  getSensorConfiguration,
  insertSensorData,
  getEnhancedSensorData,
};
