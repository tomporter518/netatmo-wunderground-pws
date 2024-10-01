
var netatmo = require('netatmo')
var PWS = require('wunderground-pws');

const { readFile } = require('fs');

var netatmoConfig;
var wundergroundAuth;

var netatmo_pws = function (args) {
    this.setAuthVars(args);
  };

netatmo_pws.prototype.setAuthVars = function(args) {
    if(args) {
        if(typeof args.netatmo === "string") {
            netatmoConfig = args.netatmo;
        } else {
            console.error("Netatmo config filename missing");
        }

        if(typeof args.wunderground === 'string') {
            readFile(args.wunderground, "utf8", (error, data) => {
                if(error) {
                    console.error("Wunderground config read error:" + error);
                return;
                } else if(data) {
                  wundergroundAuth = JSON.parse(data);
        }
             });
        } else {
            console.error("Wunderground config filename missing");
        }
    }
}

var pws;
var api;

//Data vars
var winddirection;
var windspeed;
var windgust;
var humidity;
var dewptf;
var tempf;
var rainin;
var dailyrainin;
var baromin;
var softwaretype = 'netatmo-wunderground-pws';

//Get data from Netatmo weather station
netatmo_pws.prototype.getNetatmoData = function () {
    try {
        if(!api) {
            api = new netatmo(netatmoConfig);

            api.on("error", function(error) {
                console.error('Netatmo threw an error: ' + error);
            });

            api.on("warning", function(warning) {
                console.log('Netatmo threw a warning: ' + warning);
            });

            api.on("info", function(info) {
                console.log('Netatmo logged info: ' + info);
            });
        } else if(api.getAccessToken() === 'error') {
            api.authenticate_refresh();
	}

        console.debug("Getting Netatmo data...");
        api.getStationsData(function(err, devices) {
            if(err) {
                return;
            }

            let dev = devices[0];
            baromin = dev.dashboard_data.Pressure * 0.0295299830714;

            for (let mod of dev.modules) {
                if (mod.type == "NAModule1") {   //Outdoor module
                    if (mod.reachable) {
                        console.debug("Got outdoor data...");
                        let data = mod.dashboard_data;
                        tempf = convertFromCtoF(data.Temperature);
                        humidity = data.Humidity;
                        dewptf = (data.Temperature - (14.55 + 0.114 * data.Temperature) * (1 - (0.01 * data.Humidity)) - Math.pow((2.5 + 0.007 * data.Temperature) * (1 - (0.01 * data.Humidity)), 3) - (15.9 + 0.117 * data.Temperature) * Math.pow(1 - (0.01 * data.Humidity), 14));
                        dewptf = convertFromCtoF(dewptf);
                    }
                    else{
                        console.error("Outdoor module is unreachable.");
                    }
                }
                else if (mod.type == "NAModule3") {  //Rain module
                    if (mod.reachable) {
                        console.debug("Got rain module data...");
                        let data = mod.dashboard_data;
                        rainin = convertFromMmtoIn(data.sum_rain_1);
                        dailyrainin = convertFromMmtoIn(data.sum_rain_24);
                    }
                    else{
                        console.error("Rain module is unreachable.");
                    }
                }
                else if (mod.type == "NAModule2") {  //Wind module
                    if (mod.reachable) {
                        console.debug("Got wind module data...");
                        let data = mod.dashboard_data;
                        winddirection = data.WindAngle;
                        windspeed = convertFromKphToMph(data.WindStrength);
                        windgust = convertFromKphToMph(data.GustStrength);
                    }
                    else{
                        console.error("Wind module is unreachable.");
                    }
                }
            }
            setObservations();
        });
    } catch (error) {
        console.error(error.message);
    }
}

function convertFromCtoF(value) {
    return value * 9 /5 + 32;
}

function convertFromKphToMph(value) {
    return value * 0.621371;
}

function convertFromMmtoIn(value) {
    return value * 0.0393701;
}

//Send to Wunderground
function setObservations() {
    try {
        pws = undefined;
        pws = new PWS(wundergroundAuth.stationId, wundergroundAuth.userPassword);
        console.debug("Sending to Weather Underground...");
        console.debug("Temp: " + tempf);
        console.debug("Humidity: " + humidity);
        console.debug("DewPt: " + dewptf);
        console.debug("Windspeed: " + windspeed);
        console.debug("WindGust: " + windgust);
        console.debug("rain: " + rainin);
        console.debug("dailyRain: " + dailyrainin);
        pws.resetObservations();
        pws.setObservations({
            winddir: winddirection,
            windspeedmph: windspeed,
            windgustmph: windgust,
            humidity: humidity,
            dewptf: dewptf,
            tempf: tempf,
            rainin: rainin,
            dailyrainin: dailyrainin,
            baromin: baromin,
            softwaretype: softwaretype
        });

        pws.sendObservations(function(err, success) {
            if (err) {
                console.error("Error sending data to Weather Underground: " + err.message);
            }
            else{
                console.debug("Data successfully sent!");
            }

        });
    } catch (error) {
        console.error(error.message);
    }
}

module.exports = netatmo_pws;
