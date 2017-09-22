var rp = require('request-promise'),
  _ = require('underscore'),
  updateTimer;

function GitlabButler(options) {
  var self = this;

  self.options = options || {};
  self.host = self.options.host || null;
  if (!self.host) throw new Error('gitlab Butler: No gitlab  host provided.');

  self.port = self.options.port || null;
  if (!self.port) throw new Error('gitlab Butler: No gitlab  port provided.');

  self.token = self.options.token || null;
  if (!self.token) throw new Error('gitlab Butler: No token provided.');

  self.jobs = self.options.jobs || null;
  if (!self.jobs) throw new Error('gitlab Butler: No jobs provided.');

  self.updateIntervall = self.options.updateIntervall || null;
}

GitlabButler.prototype.getJobStatus = function (job, options, callback) {
  console.log('get status ' + JSON.stringify(job));

  var gitlab_api_call = {
    uri: 'https://' + this.host + ':' + this.port + '/api/v4/projects/' + job.project_id + '/pipelines',
    headers: {
      'PRIVATE-TOKEN': this.token
    },
    json: true
  };

  rp(gitlab_api_call)
    .then(function (pipelines) {
      const led_count = job.leds.end - job.leds.start;

      return pipelines.sort((a, b) => {
        if (a.id < b.id) return -1;
        if (a.id > b.id) { return 1 }
        else { return 0 }
      })
        .reverse()
        .slice(0, led_count)
    })
    .catch(function (err) {
      console.error('Error: ' + err);
      callback(err);
    })
    .then(pipes => {
      for (led = 0; led < pipes.length; led++) {

        const pipeline = pipes[led];
        console.log(pipeline.status);

        const color = getColorOfState(options, pipeline.status);
        console.log(color);
        const led_request = {
          uri: `http://${options.leds.host}:${options.leds.port}/led/${led}/fill/${color}`
        }
        console.log(led_request.uri);
        rp(led_request).then(_ => {
          led = led + 1;
          console.log("new led: " + led);
        }).error(err => {
          console.log(err);
          callback(err);
        })
      }

      pipes.forEach(pipeline => {
        callback(null, pipeline.status ? "running" : pipeline.status);
      })

    });
}

function getColorOfState(options, state) {
  switch (state) {
    case "success": {
      return options.leds.success;
    }
    case "failed": {
      return options.leds.failed;
    }
    case "running": {
      return options.leds.building;
    }
    case "canceled": {
      return options.leds.aborted;
    }
    case "pending": {
      return options.leds.aborted;
    }
  }
}

function updateStatesOfJobs(options) {

  butler.jobs.forEach(function (job, index) {
    butler.getJobStatus(job, options, function (err, result) {
        console.log("....");
    });
  });
}

function onRequestError(err) {
  console.log("Got error: " + err.message);
}

function GitlabButlerService(options) {

}

GitlabButlerService.prototype.setup = function (config) {
  butler = new GitlabButler(config.gitlab);
  updateStatesOfJobs(config);
  updateTimer = setInterval(updateStatesOfJobs, config.gitlab.updateIntervall * 1000, config);
}

GitlabButlerService.prototype.shutdown = function (config) {
  if (updateTimer) {
    console.log('GitlabButlerService shutdown...')
    clearInterval(updateTimer);
  }
}

exports = module.exports = new GitlabButlerService();
exports.GitlabButler = GitlabButler;
exports.ServiceName = 'GitlabButlerService';
