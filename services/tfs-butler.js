var http = require('http'),
  _ = require('underscore'),
  updateTimer;

function TfsButler(options) {
  var self = this;

  self.options = options || {};
  self.host = self.options.host || null;
  if (!self.host) throw new Error('TfsButler: No Tfs host provided.');

  self.port = self.options.port || null;
  if (!self.port) throw new Error('TfsButler: No Tfs port provided.');

  self.username = self.options.username || null;
  if (!self.username) throw new Error('TfsButler: No username provided.');

  self.password = self.options.password || null;
  if (!self.password) throw new Error('TfsButler: No password provided.');

  self.teamCollection = self.options.teamCollection || null;
  if (!self.teamCollection) throw new Error('TfsButler: No teamCollection provided.');

  self.jobs = self.options.jobs || null;
  if (!self.jobs) throw new Error('TfsButler: No jobs provided.');

  self.updateIntervall = self.options.updateIntervall || null;
}

function updateStatesOfJobs(butler, options) {
  console.log('update status from all jobs');

  butler.loadBuildStatus(function (err, result) {
    if (err) {
      console.log("ERROR: " + err);
      return;
    }

    butler.jobs.forEach(function (job, index) {
      // todo lookup mapped job/state
      result.lookupbuildinfo[job.job].state

      console.log('[' + index + "]." + job.job + ' is ' + JSON.stringify(result));

      setLEDForJob(job, result, options, function (reqErr) {
        if (reqErr)
          console.log("request error. " + JSON.stringify(reqErr));
      });

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

TfsButler.prototype.loadBuildStatus = function (callback) {
  console.log('get status ...');

  var options = {
    hostname: this.host,
    port: this.port,
    path: '/' + this.teamCollection + '/api/',
    headers: {
      'Authorization': 'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
    }
  }

  http.get(options, function (res) {

    if (res.statusCode != 200) {
      callback('Failed to fetch tfs data, http status: ' + res.statusCode);
      return;
    }

    var response = '';

    res.on('data', function (data) {
      response += data;
    });

    res.on('end', function () {
      // todo parse response and create mapping with jobname and build state
            
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

function TfsButlerService() {

}

TfsButlerService.prototype.setup = function (config) {
  var butler = new TfsButler(config.tfs);
  var handler = updateStatesOfJobs(butler, config);
  updateTimer = setInterval(handler, config.tfs.updateIntervall * 1000, config);
}

TfsButlerService.prototype.shutdown = function (config) {
  if (updateTimer) {
    console.log('TfsButlerService shutdown...')
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

exports = module.exports = new TfsButlerService();
exports.TfsButler = TfsButler;
exports.ServiceName = 'TfsButlerService';