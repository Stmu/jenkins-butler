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

JenkinsButler.prototype.buildRequestOptions = function (job) {
  var buildType = job.showOnBuilding ? "lastBuild" : "lastCompletedBuild"
  var options = {
    hostname: this.host,
    port: this.port,
    path: '/job/' + job.job + '/' + buildType + '/api/json?token=' + this.token,
    headers: {
      'Authorization': 'Basic ' + new Buffer(this.username + ':' + this.token).toString('base64')
    }
  };
  return options;
}

JenkinsButler.prototype.getJobStatus = function (job, callback) {
  console.log('get status ' + JSON.stringify(job));

  http.get(this.buildRequestOptions(job), function (res) {

    if (res.statusCode != 200) {
      callback('Failed to fetch jenkins data, http status: ' + res.statusCode);
      return;
    }

    var response = '';

    res.on('data', function (data) {
      response += data;
    });

    res.on('end', function () {
      var resi = JSON.parse(response);

      callback(null, resi.building ? "BUILDING" : resi.result);
    })

  }).on('error', function (e) {
    console.error('Error: ' + e);
    callback(e);
    return;
  }).on('end', function (e) {
    console.error('End:' + e);
    callback(e);
    return;
  });
}

function updateStatesOfJobs(options) {
  console.log('update status from all jobs');
  butler.jobs.forEach(function (job, index) {
    butler.getJobStatus(job, function (err, result) {
      console.log('[' + index + "]." + job.job + ' is ' + JSON.stringify(result));

      if (!err) {
        setLEDForJob(job, result, options, function (reqErr) {
          if (reqErr)
            console.log("request error. " + JSON.stringify(reqErr));
        });
      } else {
        console.log("ERROR: " + err);
      }
    });
  });
}

function setLEDForJob(job, result, options, callback) {
  switch (result) {
    case "UNSTABLE":
      http.get(buildLedRequestOptions(options, job, options.leds.unstable)).on('error', onRequestError).on('end', callback);
      break;
    case "FAILURE":
      http.get(buildLedRequestOptions(options, job, options.leds.failed)).on('error', onRequestError).on('end', callback);
      break;
    case "SUCCESS":
      http.get(buildLedRequestOptions(options, job, options.leds.success)).on('error', onRequestError).on('end', callback);
      break;
    case "ABORTED":
      http.get(buildLedRequestOptions(options, job, options.leds.aborted)).on('error', onRequestError).on('end', callback);
      break;
    case "BUILDING":
      http.get(buildLedRequestOptions(options, job, options.leds.building)).on('error', onRequestError).on('end', callback);
      break;
    default:
      console.log('something is happen... Request: ' + JSON.stringify(options) + " JOB: " + JSON.stringify(job))
      http.get(buildLedRequestOptions(options, job, "000000")).on('error', onRequestError).on('end', callback);
  }
}

function onRequestError(err) {
  console.log("Got error: " + err.message);
}

function buildLedRequestOptions(options, job, color) {
  console.log("build request to set led for " + JSON.stringify(job) + " to " + color);

  return {
    hostname: options.leds.host,
    port: options.leds.port,
    path: '/led/from/' + job.leds.start + '/to/' + job.leds.end + '/fill/' + color
  };
}

// function buildLedRequestOptionsPost(options) {
//   return {
//     hostname: options.leds.host,
//     port: options.leds.port,
//     method: "POST",
//     path: "/api/range",
//     headers: {
//       'Content-Type': "application/json"
//     }
//   };
// }
//
// function makeLedsShining(start, end, color, options) {
//   req = http.request(buildLedRequestOptionsPost(options));
//
//   req.on('error', function(e) {
//     console.log('problem with request: ' + e.message);
//   });
//
//   var post_data = JSON.stringify({
//     "from": start,
//     "to": end,
//     "rgb": color
//   });
//
//   req.write(post_data);
//   req.end();
// }

function JenkinsButlerService(options) {

}

JenkinsButlerService.prototype.setup = function (config) {
  butler = new JenkinsButler(config.jenkins);
  updateStatesOfJobs(config);
  updateTimer = setInterval(updateStatesOfJobs, config.jenkins.updateIntervall * 1000, config);
}

JenkinsButlerService.prototype.shutdown = function (config) {
  if (updateTimer) {
    console.log('JenkinsButlerService shutdown...')
    clearInterval(updateTimer);

    http.get({
      hostname: config.leds.host,
      port: config.leds.port,
      path: '/api/black'
    }, function (res) {
      console.log("Result: " + res.statusCode)
    });
  }
}

exports = module.exports = new JenkinsButlerService();
exports.JenkinsButler = JenkinsButler;
exports.ServiceName = 'JenkinsButlerService';
