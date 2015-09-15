'use strict';

module.exports = {
  jenkins: {
    "host": "localhost",
    "port": 8080,
    "username": "admin",
    "token": "a3c2ace72dc17dc77903116f14bd19f4",
    "updateIntervall": 5,
    "jobs": [{
      "job": "Test",
      "showOnBuilding" : true
      "leds": {
        "start": 0,
        "end": 4
      }
    }, {
      "job": "my-test-job1",
      "leds": {
        "start": 5,
        "end": 9
      }
    }]
  },
  leds: {
    "host": "localhost",
    "port": 3000,
    "failed": "red",
    "success": "006666",
    "aborted": "ABABAB",
    "building": "yellow",
    "unstable": "gray",
    // unused
    "blink_at_building": true
  }
};
