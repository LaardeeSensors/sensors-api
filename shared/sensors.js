'use strict';

const moment = require('moment');
const _ = require('lodash');

const devicesByDeviceId = (items) =>
  items.reduce((result, item) => {
    const devices = Object.assign({}, result);
    if (!devices[item.mac]) {
      devices[item.mac] = { items: [] };
    }
    devices[item.mac].items.push(item);
    return devices;
  }, {});

const mapSensorData = (data) => {
  const {
    timestamp,
    sensors,
    deviceId,
  } = data;
  return {
    timestamp: moment(timestamp * 1000).format(),
    sensors: _.map(sensors, sensor => sensor),
    deviceId,
  };
};

module.exports = {
  devicesByDeviceId,
  mapSensorData,
};
