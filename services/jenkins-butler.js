var http = require('http'),
  _ = require('underscore'),
  updateTimer;

function JenkinsButler(options) {
  var self = this;

  self.options = options || {};
  self.host = self.options.host || null;
  if (!self.host) throw new Error('JenkinsButler: No Jenkins host provided.');

  self.port = self.options.port || null;
  if (!self.port) throw new Error('JenkinsButler: No Jenkins port provided.');

  self.username = self.options.username || null;
  if (!self.username) throw new Error('JenkinsButler: No username provided.');

  self.token = self.options.token || null;
  if (!self.token) throw new Error('JenkinsButler: No token provided.');

  self.jobs = self.options.jobs || null;
  if (!self.jobs) throw new Error('JenkinsButler: No jobs provided.');

  self.updateIntervall = self.options.updateIntervall || null;
}

JenkinsButler.prototype.buildRequestOptions = function(job) {
  var options = {
    hostname: this.host,
    port: this.port,
    path: '/job/' + job.job + '/lastBuild/api/json?token=' + this.token,
    headers: {
      'Authorization': 'Basic ' + new Buffer(this.username + ':' + this.token).toString('base64')
    }
  };
  return options;
}

JenkinsButler.prototype.getJobStatus = function(job, callback) {
  console.log('get status ' + JSON.stringify(job));

  http.get(this.buildRequestOptions(job), function(res) {

    if (res.statusCode != 200) {
      callback('Failed to fetch jenkins data, http status: ' + res.statusCode);
      return;
    }

    res.on('data', function(data) {
      var response = JSON.parse(data);
      callback(null, response.building ? "BUILDING" : response.result);
    });

  }).on('error', function(e) {
    console.error('Error: ' + e);
    callback(e);
    return;
  }).on('end', function(e) {
    console.error('End:' + e);
    callback(e);
    return;
  });
}

function updateStatesOfJobs(options) {
  console.log('update status from all jobs');

  butler.jobs.forEach(function(job) {
    butler.getJobStatus(job, function(err, result) {
      console.log('Result of ' + job.job + ' is ' + JSON.stringify(result));

      if (!err) {
        setLEDForJob(job, result, options);
      } else {
        console.error(err);
      }
    });
  })
}

function setLEDForJob(job, result, options) {

  switch (result) {
    case "UNSTABLE":
      http.get(buildLedRequestOptions(options, job, options.leds.unstable));
      //makeLedsShining(job.leds.start, job.leds.end, options.leds.unstable, options);
      break;
    case "FAILURE":
      http.get(buildLedRequestOptions(options, job, options.leds.failure));
      //makeLedsShining(job.leds.start, job.leds.end, options.leds.failed, options);
      break;
    case "SUCCESS":
      http.get(buildLedRequestOptions(options, job, options.leds.success));
      //makeLedsShining(job.leds.start, job.leds.end, options.leds.success, options);
      break;
    case "BUILDING":
      http.get(buildLedRequestOptions(options, job, options.leds.building));
      //makeLedsShining(job.leds.start, job.leds.end, options.leds.building, options);
      break;
    default:
      http.get(buildLedRequestOptions(options, job, "#000000"));
      //makeLedsShining(job.leds.start, job.leds.end, "#000000", options);
  }
}

function buildLedRequestOptions(options, job, color) {
  return {
    hostname: options.leds.host,
    port: options.leds.port,
    path: '/led/from/' + job.leds.start + '/to/' + job.leds.end + '/fill/' + color
  };
}

function buildLedRequestOptionsPost(options) {
  return {
    hostname: options.leds.host,
    port: options.leds.port,
    method: "POST",
    path: "/api/range",
    headers: {
      'Content-Type': "application/json"
    }
  };
}

function makeLedsShining(start, end, color, options) {
  req = http.request(buildLedRequestOptionsPost(options));

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  var post_data = JSON.stringify({
    "from": start,
    "to": end,
    "rgb": color
  });

  req.write(post_data);
  req.end();
}

function JenkinsButlerService(options) {

}

JenkinsButlerService.prototype.setup = function(config) {
  butler = new JenkinsButler(config.jenkins);
  updateStatesOfJobs(config);
  updateTimer = setInterval(updateStatesOfJobs, config.jenkins.updateIntervall * 1000, config);
}

JenkinsButlerService.prototype.shutdown = function(config) {
  if (updateTimer) {
    console.log('JenkinsButlerService shutdown...')
    clearInterval(updateTimer);
    http.get({
      hostname: config.leds.host,
      port: config.leds.port,
      path: '/api/black'
    });
  }
}

exports = module.exports = new JenkinsButlerService();
exports.JenkinsButler = JenkinsButler;
exports.ServiceName = 'JenkinsButlerService';
