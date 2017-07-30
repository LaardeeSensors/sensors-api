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
    if (!devices[item.deviceId]) {
      devices[item.deviceId] = [];
    }
    devices[item.deviceId].push(item);
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

const calculateSeaLevelSensor = ({ sensors, altitude }) => {
  const seaLevelPressureSensors =
    _.filter(sensors, { type: 'absolutePressure', unit: 'hPa' })
      .map((sensor) =>
        ({
          type: 'seaLevelPressure',
          value: pressureAtSeaLevel({ pressure: sensor.value, altitude }),
          unit: sensor.unit,
        }));

  return [].concat(sensors, seaLevelPressureSensors);
};

const enhanceSensorDataWithConfiguration = ({ configuration, sensorData }) => {
  if (configuration.deviceId !== sensorData.deviceId) {
    throw new Error('Invalid deviceId');
  }
  const { name, location, altitude, coordinates } = configuration;
  Object.assign(sensorData, { sensors: _.map(sensorData.sensors, sensor => sensor) });
  const sensors = calculateSeaLevelSensor({ sensors: sensorData.sensors, altitude });
  return Object.assign({},
    mapSensorData(sensorData),
    { name, sensors, location, altitude, coordinates });
};

const enhanceSensorData = ({ sensorData }) =>
  getSensorConfiguration({ deviceId: sensorData.deviceId })
    .then(({ name, location, altitude, coordinates }) => {
      const sensors = calculateSeaLevelSensor({ sensors: sensorData.sensors, altitude });
      return Object.assign({}, sensorData, { name, location, altitude, sensors, coordinates });
    });

module.exports = {
  devicesByDeviceId,
  mapSensorData,
  enhanceSensorData,
  enhanceSensorDataWithConfiguration,
};
