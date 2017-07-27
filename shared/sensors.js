'use strict';

const moment = require('moment');
const _ = require('lodash');
const log = require('./log');

const {
  getSensorConfiguration,
} = require('./database');

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

const pressureAtSeaLevel = ({ pressure, altitude }) =>
  pressure / Math.pow(1 - (altitude / 44330.0), 5.255);

/*

with temperature http://keisan.casio.com/exec/system/1224575267

 */

const enhanceSensorData = ({ deviceId, data }) =>
  getSensorConfiguration({ deviceId })
    .then(({ name, location, altitude, coordinates }) => {
      const seaLevelPressureSensors =
        _.filter(data.sensors, { type: 'absolutepressure', unit: 'hPa' })
          .map((sensor) =>
            ({
              type: 'seaLevelPressure',
              value: pressureAtSeaLevel({ pressure: sensor.value, altitude }),
              unit: sensor.unit,
            }));
      const sensors = [].concat(data.sensors, seaLevelPressureSensors);
      return Object.assign({}, data, { name, location, altitude, sensors, coordinates });
    });

module.exports = {
  devicesByDeviceId,
  mapSensorData,
  enhanceSensorData,
};
