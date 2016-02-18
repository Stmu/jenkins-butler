var http = require('http'),
    _ = require('underscore'),
    updateTimer,
    httpntlm = require('httpntlm'),
    butler;

function TfsButler(options) {
    var self = this;

    self.options = options || {};
    self.host = self.options.baseUrl || null;
    if (!self.host) throw new Error('TfsButler: No Tfs host provided.');

    self.username = self.options.username || null;
    if (!self.username) throw new Error('TfsButler: No username provided.');

    self.password = self.options.password || null;
    if (!self.password) throw new Error('TfsButler: No password provided.');

    self.domain = self.options.domain || null;
    if (!self.domain) throw new Error('TfsButler: No domain provided.');

    self.jobs = self.options.jobs || null;
    if (!self.jobs) throw new Error('TfsButler: No jobs provided.');

    self.updateIntervall = self.options.updateIntervall || null;
}

TfsButler.prototype.loadBuildStatus = function (job, tfsoptions, callback) {
    console.log('get status for job ' + job.job);

    httpntlm.get({
        url: tfsoptions.baseUrl + "build/builds?api-version=1.0&definition=" + job.job + "&$top=20&api-version=1.0",
        username: tfsoptions.username,
        password: tfsoptions.password,
        domain: tfsoptions.domain
    }, function (err, res) {
        if (err) {
            callback(err);
            return;
        }

        if (res.statusCode != 200) {
            callback('Failed to fetch tfs data, http status: ' + res.statusCode);
            return;
        }

        var data = JSON.parse(res.body);
        callback(null, data.value[0].status);
    });
};

TfsButler.prototype.updateStatesOfJobs = function (options) {
    console.log('update status from all jobs');

    options.tfs.jobs.forEach(function (entry) {
        butler.loadBuildStatus(entry, options.tfs, function (error, status) {
            if (error) {
                console.error(error);
                return;
            }
            console.log("status: " + entry.job + " " + status);
            setLEDForJob(entry, status, options, function (reqErr) {
                if (reqErr) {
                    console.log("request error. " + JSON.stringify(reqErr));
                }
            });
        });
    });
};

function setLEDForJob(job, result, options, callback) {
    switch (result) {
        case "partiallySucceeded":
            http.get(buildLedRequestOptions(options, job, options.leds.unstable)).on('error', onRequestError).on('end', callback);
            break;
        case "failed":
            http.get(buildLedRequestOptions(options, job, options.leds.failed)).on('error', onRequestError).on('end', callback);
            break;
        case "succeeded":
            http.get(buildLedRequestOptions(options, job, options.leds.success)).on('error', onRequestError).on('end', callback);
            break;
        case "stopped":
            http.get(buildLedRequestOptions(options, job, options.leds.aborted)).on('error', onRequestError).on('end', callback);
            break;
        case "inProgress":
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

function TfsButlerService() {

}

TfsButlerService.prototype.setup = function (config) {
    butler = new TfsButler(config.tfs);
    butler.updateStatesOfJobs(config);
    updateTimer = setInterval(butler.updateStatesOfJobs, config.tfs.updateintervall * 1000, config);
};

TfsButlerService.prototype.shutdown = function (config) {
    if (updateTimer) {
        console.log('TfsButlerService shutdown...');
        clearInterval(updateTimer);

        http.get({
            hostname: config.leds.host,
            port: config.leds.port,
            path: '/api/black'
        }, function (res) {
            console.log("Result: " + res.statusCode)
        });
    }
};

exports = module.exports = new TfsButlerService();
exports.TfsButler = TfsButler;
exports.ServiceName = 'TfsButlerService';