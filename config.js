'use strict';

module.exports = {
  jenkins: {
    "host": "localhost",
    "port": 8080,
    "username": "admin",
    "token": "a3c2ace72dc17dc77903116f14bd19f4",
    "updateIntervall": 5,
    "jobs": [
      // {
      //   "job": "Test",
      //   "showOnBuilding": true,
      //   "leds": {
      //     "start": 0,
      //     "end": 4
      //   }
      // },
      // {
      //   "job": "my-test-job1",
      //   "leds": {
      //     "start": 5,
      //     "end": 9
      //   }
      // }
    ]
  },
  gitlab:{
    "host" : "gitlab.ise.de",
    "port" : 443,
    "token" : "waWwxqVQ4pD6eB17oFRt",
    "updateintervall" : 10,
    "jobs": [
      {
        "project_id": "363",
        "showOnBuilding": true,
        "leds": {
          "start": 0,
          "end": 10
        }
      }
    ]
  },
  gitlab1:{
    "host" : "localhost",
    "port" : 443,
    "token" : "abcdefg",
    "updateintervall" : 10,
    "jobs": [
      {
        "project_id": "id1",
        "showOnBuilding": true,
        "leds": {
          "start": 0,
          "end": 4
        }
      }
    ]
  },
  tfs: {
    "baseUrl": "https://tfsvs.domain.com/tfs/TEAM/_apis/",
    "username": "user",
    "password": "pass",
    "domain": "domain",
    "updateintervall": 5,
     "jobs": [
    //   {
    //     "job": "Job1",
    //     "showOnBuilding": true,
    //     "leds": {
    //       "start": 10,
    //       "end": 15
    //     }
    //   },
    //   {
    //     "job": "Job2",
    //     "showOnBuilding": true,
    //     "leds": {
    //       "start": 16,
    //       "end": 20
    //     }
    //   }
     ]
  },
  leds: {
    "host": "172.24.224.27",
    "port": 3000,
    "failed": "red",
    "success": "006666",
    "aborted": "ABABAB",
    "building": "yellow",
    "unstable": "gray",
    // current unused
    "blink_at_building": true
  }
};
