# Netatmo-Wunderground-PWS
Connects Netatmo data to a Weather Underground PWS

# Usage
Install the library:

`npm install --save netatmo-wunderground-pws`

Require it:

```javascript
var netatmoWunderground = require('netatmo-wunderground-pws')
```

Set your credentials
```javascript
var authInfo = {
    "netamo_client_id": "YourClientId",
    "netamo_client_secret": "YourclientSecret",
    "netamo_username": "YourUsername",
    "netamo_password": "YourPassword",
    "wundergroundStationId": "YourStation",
    "wundergroundUserPassword": "YourSiteLoginPassword"
  };
  
  netatmoWundergroundUploader = new netatmoWunderground(authInfo);
```

Example to get data
```javascript
//Send data on startup
netatmoWundergroundUploader.getNetatmoData();

//Refresh and upload data every 2.5 minutes
setInterval(function() {
    netatmoWundergroundUploader.getNetatmoData();
  }, 150000);
```

For a full working node project, go here: https://github.com/brbeaird/netatmo-wunderground-agent
