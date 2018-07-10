
var config = require('./config.json');
var netatmo = require('netatmo')
var PWS = require('wunderground-pws');
var pws = new PWS(config.wundergroundStationId, config.wundergroundUserPassword);

//Set Netatmo auth vars
var auth = {
    "client_id": config.netatmoClientId,
    "client_secret": config.netatmoClientSecret,
    "username": config.netatmoUsername,
    "password": config.netatmoPassword
  };

var api = new netatmo(auth);

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
var softwaretype=  'netatmo-wunderground-pws';

//Get data from Netatmo weather station
function getNetatmoData(){
    console.debug("Getting Netatmo data...");
    api.getStationsData(function(err, devices) {    
        let dev = devices[0];
        baromin = dev.dashboard_data.Pressure * 0.0295299830714;
        
        for (let mod of dev.modules){
            if (mod.type == "NAModule1"){   //Outdoor module
                console.debug("Got outdoor data...");
                let data = mod.dashboard_data;                
                tempf = convertFromCtoF(data.Temperature);
                humidity = data.Humidity;
                dewptf = (data.Temperature - (14.55 + 0.114 * data.Temperature) * (1 - (0.01 * data.Humidity)) - Math.pow((2.5 + 0.007 * data.Temperature) * (1 - (0.01 * data.Humidity)), 3) - (15.9 + 0.117 * data.Temperature) * Math.pow(1 - (0.01 * data.Humidity), 14));
                dewptf = convertFromCtoF(dewptf);            
            }
            else if (mod.type == "NAModule3"){  //Rain module
                console.debug("Got rain module data...");
                let data = mod.dashboard_data;
                rainin = data.Rain;
                dailyrainin = data.sum_rain_24;            
            }
            else if (mod.type == "NAModule2"){  //Wind module
                console.debug("Got wind module data...");
                let data = mod.dashboard_data;
                winddirection = data.WindAngle;
                windspeed = data.WindStrength;
                windgust = data.GustStrength
            }        
        }
        setObservations();    
    });
}

function convertFromCtoF(value){
    return value * 9 /5 + 32
} 

//Send to Wunderground
function setObservations(){
    console.debug("Sending to Weather Underground...");
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

    pws.sendObservations(function(err, success){
        console.log("Data sent!");
    });
}

module.exports = getNetatmoData();