var express = require('express');
var bodyParser = require('body-parser');
var lgtv = require('lgtv2');
var server = express();
var tv;
var tvIsConnected;

var PORT = 8080;
var TV_BASE_PATH = '/api/alexa/tv';

////// INITIALISE  //////

initialise();

/////////////////////////

function initialise() {
    setUpWebServer();
    setUpTv();
}

function setUpWebServer() {
    server.use(bodyParser.json());

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

    server.post(TV_BASE_PATH, function (request, response) {
       var alexaResponse = launchApp('youtube');
       // TODO
       response.send({
           version: '1.0.0',
           response: alexaResponse || {}
       });
    });
}

function setUpTv() {
    tv = lgtv({
        url: 'ws://192.168.1.107:3000',
        timeout: 500,
        reconnect: 5000
    });

    tv.on('connect', function () {
        console.log("TV Connected");
        tvIsConnected = true;
    });

    tv.on('error', function (e) {
        console.log("TV Error: " + e);
        tvIsConnected = false;
    });
}

function tvRequest(uri, payload, callback) {
    if (tvIsConnected) {
        tv.request(uri, payload, callback);
    } else {
        return alexaSimpleCard('Could not connect to the TV');
    }
}

function alexaSimpleCard(content) {
    return {
        card: {
            type: 'Simple',
            title: 'LG TV',
            content: content
        }
    };
}

function turnOff(request, response) {
    tv.request('ssap://system/turnOff', function() {
        tv.disconnect();
    });
    response.send('');
}

function launchApp(appName) {
    var id = null;
    switch (appName) {
        case 'live-tv':
            id = 'com.webos.app.livetv';
            break;
        case 'tv-guide':
            id = 'com.webos.app.tvguide';
            break;
        case 'iplayer':
            id = 'bbc';
            break;
        case 'netflix':
            id = 'netflix';
            break;
        case 'amazon':
            id = 'lovefilm';
            break;
        case 'demand5':
            id = 'demand5';
            break;
        case 'nowtv':
            id = 'now.tv';
            break;
        case 'youtube':
            id = 'youtube.leanback.v4';
            break;
        case 'google-play':
            id = 'googleplaymovieswebos';
            break;
    }

    if (id) {
        return tvRequest('ssap://system.launcher/launch', {id: id});
    } else {
        return alexaSimpleCard('Did not recognise the app ' + appName);
    }
}

function enterKey(request, response) {
    tv.request('ssap://com.webos.service.ime/sendEnterKey');
    response.send('');
}

function enterText(request, response) {
    var text = request.params.text;
    console.log("Input text " + text);
    tv.request('ssap://com.webos.service.ime/insertText', {text: text});
    response.send('');
}

function clearText(request, response) {
    for (var i=0; i < 100; i++) {
        tv.request('ssap://com.webos.service.ime/deleteCharacters', {count: 1});
    }
    response.send('');
}

function mute() {
    console.log('Mute');
    tv.request('ssap://audio/setMute', {mute:true});
}

function unmute(request, response) {
    console.log('Unmute');
    tv.request('ssap://audio/setMute', {mute: false});
    response.send('');
}

function setVolume(request, response) {
    var volume = parseInt(request.params.volume);
    console.log("Set volume " + volume);
    tv.request('ssap://audio/setVolume', {volume: volume});
    response.send('');
}

function volumeChange(request, response) {
    var change = parseInt(request.params.change);
    console.log("Change volume " + change);
    if (change >= 0) {
        for (var i=0; i < change; i++) {
            tv.request('ssap://audio/volumeUp');
        }
    } else {
        for (var i=change; i < 0; i++) {
            tv.request('ssap://audio/volumeDown');
        }
    }
    response.send('');
}

function play(request, response) {
    tv.request('ssap://media.controls/play');
    response.send('');
}

function pause(request, response) {
    tv.request('ssap://media.controls/pause');
    response.send('');
}

function stop(request, response) {
    tv.request('ssap://media.controls/stop');
    response.send('');
}

function rewind(request, response) {
    tv.request('ssap://media.controls/rewind');
    response.send('');
}

function fastForward(request, response) {
    tv.request('ssap://media.controls/fastForward');
    response.send('');
}
