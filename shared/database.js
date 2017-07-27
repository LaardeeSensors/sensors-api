'use strict';

const AWS = require('aws-sdk');
const log = require('./log');

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

const getSensorData = ({ from, to }) => {
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
        FilterExpression: '#deviceId = :deviceId',
        ExpressionAttributeNames: {
          '#mac': 'mac',
          '#name': 'name',
          '#deviceId': 'deviceId',
          '#configuration': 'configuration',
          '#location': 'location',
          '#coordinates': 'coordinates',
          '#altitude': 'altitude',
        },
        ExpressionAttributeValues: {
          ':deviceId': deviceId,
        },
      });
  return dynamodb.scan(params).promise()
    .then(data => data.Items[0]);
};

module.exports = {
  getSensorData,
  getSensorConfiguration,
  insertSensorData,
};
