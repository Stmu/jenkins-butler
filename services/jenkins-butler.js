var http = require('http'),
    _ = require('underscore'),
    updateTimer;

function JenkinsButler(options) {
  var self = this;

  self.options = options || {};
  self.host = self.options.host || null;
  if (!self.host) throw new Error('JenkinsButler: No host provided.');

  self.username = self.options.username || null;
  if (!self.username) throw new Error('JenkinsButler: No username provided.');

  self.token = self.options.token || null;
  if (!self.token) throw new Error('JenkinsButler: No token provided.');

  self.jobs = self.options.jobs || null;
  if (!self.jobs) throw new Error('JenkinsButler: No jobs provided.');

  self.updateIntervall = self.options.updateIntervall || null;
}

JenkinsButler.prototype.getJobStatus = function(job, callback) {
  console.log('get status ' + JSON.stringify(job));

  callback(null, "result")
}

function updateStatesOfJobs() {
  console.log('update status from all jobs');

  butler.jobs.forEach(function(job){
    butler.getJobStatus(job, function(err, res) {
      console.log('Result of job is' + JSON.stringify(res));
      if (!err) {
        console.log('Job result ' + JSON.stringify(res));
      }
    });
  })
}

function JenkinsButlerService(options) {

}

JenkinsButlerService.prototype.setup = function (config)
{
  butler = new JenkinsButler(config.jenkins);

  updateStatesOfJobs();

  updateTimer = setInterval(updateStatesOfJobs, config.jenkins.updateIntervall * 1000);
}

JenkinsButlerService.prototype.shutdown = function() {
  if (updateTimer) {
    console.log('JenkinsButlerService shutdown...')
    clearInterval(updateTimer);
  }
}

exports = module.exports = new JenkinsButlerService();
exports.JenkinsButler = JenkinsButler;
exports.ServiceName = 'JenkinsButlerService';
