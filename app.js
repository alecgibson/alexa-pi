var express = require('express');
var server = express();
var tv;

var PORT = 8080;
var TV_BASE_PATH = '/api/alexa/tv';

////// INITIALISE  //////

initialise();

/////////////////////////

function initialise() {
    setUpWebServer();
    connectToTv();
}

function setUpWebServer() {
    definePaths();

    server.listen(PORT, function() {
        console.log('Listening on port ' + PORT);
    });
}

function definePaths() {
    server.get('/', function(request, response) {
        console.log("Hit home");
        response.send('Hello, world!');
    });
    server.get(TV_BASE_PATH + '/mute', mute);
    server.get(TV_BASE_PATH	+ '/unmute', unmute);
}

function connectToTv() {
    tv = require('lgtv2')({
        url: 'ws://192.168.1.107:3000'
    });

    tv.on('connect', function() {
        console.log('Connected to TV');

        // TODO: Store for incremental volume change?
        tv.subscribe('ssap://audio/getVolume', function (err, res) {
            if (res.changed.indexOf('volume') !== -1) console.log('Volume changed', res.volume);
        });
    });
}

function mute(request, response) {
    console.log('Mute');
    tv.request('ssap://audio/setMute', {mute:true});
    response.send('');
}

function unmute(request, response) {
    console.log('Unmute');
    tv.request('ssap://audio/setMute', {mute: false});
    response.send('');
}
