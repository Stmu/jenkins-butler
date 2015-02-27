var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');

var config = require('./config');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var path = require('path');
var fs = require('fs');
var Services = [];

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;

// Load Services
var servicesPath = path.join(__dirname, 'services');
fs.readdirSync(servicesPath).forEach(function(file) {
    if (~file.indexOf('.js')) {
        Services.push(require(path.join(servicesPath, file)));
    }
});

  // Run Services
  Services.forEach(function(service) {
      service.setup(config);
  });

function shutdown() {
    Services.forEach(function(service) {
        service.shutdown(config);
    });

    process.exit();
}

process.on('SIGINT', shutdown);

// function updateJobLeds(index)
// {
//   auth = "Basic " + new Buffer(config.jenkins.username + ":" + config.jenkins.password).toString("base64");
//
//   job = config.jobs[index];
//
//   req = {
//     url: 'http://' + config.jenkins.host + ':' + config.jenkins.port + '/job/' + job + '/lastBuild/api/json',
//     headers: {
//       'Authorization': auth,
//     }
//   };
//
//   console.log("Requesting job " + job + " ...");
//   request(req, function (error, response, body)
//   {
//     if (!error && response.statusCode == 200)
//     {
//       var jenkinsLastBuild = JSON.parse(body);
//       if (!jenkinsLastBuild.building)
//       {
//         console.log(job + " is currently not building and result is " + jenkinsLastBuild.result);
//         switch(jenkinsLastBuild.result)
//         {
//           case "UNSTABLE":
//             console.log("SET LED " + index + " TO UNSTABLE");
//             request.get({url: 'http://localhost:3000/led/' + index + '/fill/yellow'});
//             break;
//           case "FAILURE":
//             console.log("SET LED " + index + " TO FAILURE");
//             request.get({url: 'http://localhost:3000/led/' + index + '/fill/red'});
//             break;
//           case "SUCCESS":
//             console.log("SET LED " + index + " TO SUCCESS");
//             request.get({url: 'http://localhost:3000/led/' + index + '/fill/blue'});
//             break;
//           default:
//             console.log("SET LED " + index + " TO UNKNOWN");
//             request.get({url: 'http://localhost:3000/led/' + index + '/fill/white'});
//         }
//       }
//       else
//       {
//         console.log(job + " is currently building...");
//         request.get({url: 'http://localhost:3000/led/' + index + '/blink/yellow'});
//       }
//     }
//     else
//     {
//       console.log("Error while requesting info for job '" + job + "'.");
//       request.get({url: 'http://localhost:3000/led/' + index + '/fill/black'});
//     }
//
//     nextLedIndex = index + 1;
//     if (config.jobs.length == nextLedIndex)
//     {
//       nextLedIndex = 0;
//       console.log("Restarting job update cycle.");
//     }
//
//     console.log("Starting recursive call for led index " + nextLedIndex);
//     setTimeout(function()
//     {
//       updateJobLeds(nextLedIndex);
//     }, 4000);
//   });
//
// }
//
// updateJobLeds(0);
