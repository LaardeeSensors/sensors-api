'use strict';

const log = require('../../shared/log');
const moment = require('moment');
const _ = require('lodash');

const {
  getSensorData,
  getSensorConfiguration,
  getEnhancedSensorData,
} = require('../../shared/database');
const {
  mapSensorData,
  enhanceSensorData,
  devicesByDeviceId,
} = require('../../shared/sensors');

module.exports.handler = (event, context, callback) => {
  log(event, context);
  const to = parseInt(moment().format('X'), 10);
  const from = parseInt(moment()
    .subtract(parseInt(event.type, 10), 'hours')
    .format('X'), 10);

  return getEnhancedSensorData({ from, to })
    .then(log)
    .then(() => callback(null, 'ok'));

  // return getSensorData({ from, to })
  //   .then(items => items.map(mapSensorData))
  //   .then(devicesByDeviceId)
  //   .then((devices) =>
  //     Promise.all(Object.keys(devices).map((deviceId) => {
  //       return enhanceSensorData({ deviceId, data: devices[deviceId].items })
  //         .then(items => Object.assign({}, devices[deviceId], { items }));
  //     })))
  //   // .then(() => getSensorConfiguration({ deviceId }))
  //   // .then(items =>
  //   //   Promise.all(items.map(data => enhanceSensorData({ deviceId: data.deviceId, data }))))
  //   .then(log)
  //   .then(() => callback(null, 'ok'));
};
