var winston = require('winston');
var path = require('path');
var config = require('../../config/environment');
const fs = require('fs');

var debugLogPath = path.join(config.root, 'server', 'logs', 'debug.log');

fs.exists(debugLogPath, function (exists) {
  if(!exists) {
    fs.writeFile(debugLogPath, '', {flag: 'wx'}, function(err) {
      if (err) { console.log('Error creating logs/debug.log', err) };
    })
  }
});

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
    	json: false,
    	timestamp: false,
    	colorize : true,
    	showLevel: false,
    	prettyPrint: true,
    	// silent: false,
    }),
  //   new winston.transports.DailyRotateFile({
		//   datePattern: '.yyyy-MM-ddTHH',
		//   filename: path.join(config.root, 'server', 'logs', 'debug.log'),
		//   json: false,
		//   showLevel: false,
		//   maxFiles: 5,
		//   prettyPrint: true
		// })
    new (winston.transports.File)({
      filename: debugLogPath,
      maxsize: 1000000, //1MB
      maxFiles: 3,
      prettyPrint: true
    })
  ],
  // exceptionHandlers: [
  //   new winston.transports.DailyRotateFile({
		//   datePattern: '.yyyy-MM-ddTHH',
		//   filename: path.join(config.root, 'server', 'logs', 'exceptions.log'),
		//   json: false,
		//   showLevel: false,
		//   maxFiles: 5
		// })
  // ],
  exitOnError: false
});

module.exports = logger;
