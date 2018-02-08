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

GitlabButler.prototype.getJobStatus = function (job, options) {
  console.log('get pipeline status for project' + JSON.stringify(job));

  var gitlab_api_call = {
    uri: 'https://' + this.host + ':' + this.port + '/api/v4/projects/' + job.project_id + '/pipelines',
    headers: {
      'PRIVATE-TOKEN': this.token
    },
    json: true
  };

  rp(gitlab_api_call)
    .then(pipelines => {
      const led_count = job.leds.end - job.leds.start;

      return pipelines
        .sort((a, b) => {
          if (a.id < b.id) return -1;
          if (a.id > b.id) { return 1 }
          else { return 0 }
        })
        .reverse()
        .slice(0, led_count)
        .map((p, index) => {pipeline:{status: p.status; index: job.leds.start + index }})
    })
    .catch(err => {
      console.error('Error: ' + err);
    })
    .then(pipes => {
      pipes.forEach((pipeline) => {
        const color = mapStateToColor(options, pipeline.status);

        const led_request = {
          uri: `http://${options.leds.host}:${options.leds.port}/led/${pipeline.index}/fill/${color}`
        }

        rp(led_request).then(_ => {
          return 0;
        }).error(err => {
          console.log(err);
        });
      });
    });
}

function mapStateToColor(options, state) {
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
      return options.leds.pending;
    }
  }
}

function updateStatesOfJobs(options) {
  options.gitlab.jobs.forEach((job, index) => {
    butler.getJobStatus(job, options);
  });
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

    // make it black... we are shutdown...
    rp({
      uri: `http://${options.leds.host}:${options.leds.port}/api/black`
    })
      .then(_ => {
        console.log("Result: " + res.statusCode)
      });

  }
}

exports = module.exports = new GitlabButlerService();
exports.GitlabButler = GitlabButler;
exports.ServiceName = 'GitlabButlerService';
