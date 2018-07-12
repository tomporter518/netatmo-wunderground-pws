#!/usr/bin/php
<?php
date_default_timezone_set('UTC');
/**
 * oAuth settings from http://dev.netatmo.com/dev/listapps
 */
define('APP_ID', 'CLIENT ID HERE');
define('APP_SECRET', 'CLIENT SECRET HERE');
define('USERNAME', 'USERNAME HERE');
define('PASSWORD', 'PASSWORD HERE');
define('TOKEN_URL', 'https://api.netatmo.net/oauth2/token');
define('DEVICELIST_URL', 'https://api.netatmo.net/api/devicelist');

/**
 * Station ID from http://www.wunderground.com/wxstation/signup.html
 */
define('STATION_URL', 'http://weatherstation.wunderground.com/weatherstation/updateweatherstation.php');
define('STATION_ID', 'STATION ID HERE');
define('STATION_PASSWORD', 'PASSWORD HERE');
define('DEBUG', 1);

if (APP_ID == '' || APP_SECRET == '' || USERNAME == '' || PASSWORD == '' || STATION_ID == '' || STATION_PASSWORD == '') {
  fwrite(STDERR, "APP_ID, APP_SECRET, USERNAME, PASSWORD, STATION_ID, STATION_PASSWORD cannot be empty.\n");
  exit(1);
}

$opts = array(
  'http' => array(
    'method' => 'POST',
    'header' => 'Content-type: application/x-www-form-urlencoded',
    'content' => http_build_query(array(
      'grant_type' => "password",
      'client_id' => APP_ID,
      'client_secret' => APP_SECRET,
      'username' => USERNAME,
      'password' => PASSWORD
    ))
  )
);
if (DEBUG) print_r($opts);

$context = stream_context_create($opts);
$response = file_get_contents(TOKEN_URL, FALSE, $context);
$response_json = json_decode($response, TRUE);
if (DEBUG) print_r($response_json);

if (!$response || empty($response_json['access_token'])) {
  fwrite(STDERR, "Couldn't retrieve the access_token. Please check your username and password.\n");
  exit(1);
}

$access_token = $response_json['access_token'];
$device_list = json_decode(file_get_contents(DEVICELIST_URL . '?access_token=' . $access_token));
if (!$device_list || sizeof($device_list->body->devices) == 0) {
  fwrite(STDERR, "Couldn't find any devices\n");
  exit(1);
}

if (sizeof($device_list->body->modules) == 0 || empty($device_list->body->modules[0]->_id)) {
  fwrite(STDERR, "Couldn't find outdoor devices\n");
  exit(1);
}

$indoor_id = $device_list->body->devices[0]->_id;
$outdoor_id = $device_list->body->modules[0]->_id;

$last_data = $device_list->body->devices[0]->last_data_store;
if (DEBUG) print_r($last_data);

$params = array(
  'ID' => STATION_ID,
  'PASSWORD' => STATION_PASSWORD,
  'action' => 'updateraw',
  'dateutc' => date("Y-m-d H:i:s",$last_data->$outdoor_id->K),
  'humidity' => $last_data->$outdoor_id->b,
  'temp' => $last_data->$outdoor_id->a,
  'baromhPa' => $last_data->$indoor_id->e,
  'indoortemp' => $last_data->$indoor_id->a,
  'indoorhumidity' => $last_data->$indoor_id->b,
  'softwaretype' => 'Netatmo'
);

// calculate dew point using temperature and humidity (optional)
// source: http://www.aprweather.com/pages/calc.htm
$params['dewpt'] = ($params['temp'] - (14.55 + 0.114 * $params['temp']) * (1 - (0.01 * $params['humidity'])) - pow((2.5 + 0.007 * $params['temp']) * (1 - (0.01 * $params['humidity'])), 3) - (15.9 + 0.117 * $params['temp']) * pow(1 - (0.01 * $params['humidity']), 14));

// conversion to F
$params['tempf'] = $params['temp'] * 9 / 5 + 32;
$params['dewptf'] = $params['dewpt'] * 9 / 5 + 32;
$params['indoortempf'] = $params['indoortemp'] * 9 / 5 + 32;
$params['baromin'] = $params['baromhPa'] * 0.0295299830714;
// remove SI after conversion
unset($params['temp'],$params['dewpt'],$params['indoortemp'],$params['baromhPa']);
ksort($params);
if (DEBUG) print_r($params);

$response = file_get_contents(STATION_URL . '?' . http_build_query($params));
if (DEBUG) print $response;

?>