'use strict';

module.exports = {
  jenkins:
  {
    "host": "127.0.0.1",
    "port": "8080",
    "username": "admin",
    "token": "token",
    "updateIntervall": 5000,
    "jobs": [
        {
            "job": "my-test-job",
            "leds": {
                "start": 0,
                "end": 4
            }
        },
        {
            "job": "my-test-job1",
            "leds": {
                "start": 5,
                "end": 9
            }
        }
    ]
}
};
