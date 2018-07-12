var netatmoWunderground = require('netatmo-wunderground-pws')

//Set auth vars
var authInfo = {
    "netamo_client_id": "5b42502b13475df99e8be0b6",
    "netamo_client_secret": "dresEOmwhGWfGxAsPC46e0bgOizmYjJosqbwVrFJdMkk",
    "netamo_username": "brbeaird@gmail.com",
    "netamo_password": "DwBm6t8Lob",
    "wundergroundStationId": "KTNMURFR76",
    "wundergroundUserPassword": "satisfiedinhimwunder1!"
  };

netatmoWundergroundUploader = new netatmoWunderground(authInfo);

//Send data on startup
netatmoWundergroundUploader.getNetatmoData();

//Refresh and upload data every 2.5 minutes
setInterval(function() {
    netatmoWundergroundUploader.getNetatmoData();
  }, 150000);