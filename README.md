# Sensors API

# [WIP]

## API Endpoints

| Endpoint | Method | Comment |
| ---| :---: | --- |
| **By sensor** |
| /sensors/{deviceId}/latest | GET | Latest data from sensor |
| /sensors/{deviceId}/1h | GET | Latest hour data from sensor |
| /sensors/{deviceId}/3h | GET | Latest three hours data from sensor |
| /sensors/{deviceId}/6h | GET | Latest six hours data from sensor |
| /sensors/{deviceId}/12h | GET | Latest 12 hours data from sensor |
| /sensors/{deviceId}/24h | GET | Latest 24 hours data from sensor |
| /sensors/{deviceId}/{date} | GET | Summary from specific (date format: `2017-07-25`) |
| **By location** |
| /sensors/{locationName}/latest | GET | Latest data from all location's sensors |
| /sensors/{locationName}/1h | GET | Latest hour data from all location's sensors |
| /sensors/{locationName}/3h | GET | Latest three hours data from all location's sensors |
| /sensors/{locationName}/6h | GET | Latest six hours data from all location's sensors |
| /sensors/{locationName}/12h | GET | Latest 12 hours data from all location's sensors |
| /sensors/{locationName}/24h | GET | Latest 24 hours data from  all location's sensors |
| **Device** |
| /devices | POST | Insert data from device |
| /devices/{deviceId} | GET | Get device configuration |
| /devices/register | POST | Register device mac + something? |

