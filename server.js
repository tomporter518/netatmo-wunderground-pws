var express = require('express');
var app = express();
var netatmoWunderground = require('./netatmo-wunderground-pws.js')

netatmoWunderground.getNetatmoData();

//Refresh and upload data every 5 minutes
setInterval(function() {
    netatmoWunderground.getNetatmoData();
  }, 300000);

var port = process.env.PORT || 8000;
app.listen(port, "0.0.0.0");
console.log('Running on http://localhost:8000');