var express = require('express');
var bodyParser = require('body-parser');
var server = express();
var tv;

var PORT = 8080;
var TV_BASE_PATH = '/api/alexa/tv';

////// INITIALISE  //////

initialise();

/////////////////////////

function initialise() {
    setUpWebServer();
    // connectToTv();
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
       console.log(request);
       console.log(request.body);
       response.send(request.body);
    });

    // server.get(TV_BASE_PATH + '/turn-off', turnOff);
    // server.get(TV_BASE_PATH + '/app/:appName', launchApp);
    // server.get(TV_BASE_PATH + '/enter', enterKey);
    // server.get(TV_BASE_PATH + '/text/:text', enterText);
    // server.get(TV_BASE_PATH + '/clear-text', clearText);
    //
    // server.get(TV_BASE_PATH + '/mute', mute);
    // server.get(TV_BASE_PATH + '/unmute', unmute);
    // server.get(TV_BASE_PATH + '/volume/:volume', setVolume);
    // server.get(TV_BASE_PATH + '/volume-change/:change', volumeChange);
    //
    // server.get(TV_BASE_PATH + '/play', play);
    // server.get(TV_BASE_PATH + '/pause', pause);
    // server.get(TV_BASE_PATH + '/stop', stop);
    // server.get(TV_BASE_PATH + '/rewind', rewind);
    // server.get(TV_BASE_PATH + '/fast-forward', fastForward);
}

function connectToTv() {
    // TODO: Handle not finding the TV (eg try to re-connect when issuing commands)
    tv = require('lgtv2')({
        url: 'ws://192.168.1.107:3000'
    });

    tv.on('connect', function() {
        console.log('Connected to TV');
    });
}

function turnOff(request, response) {
    tv.request('ssap://system/turnOff', function() {
        tv.disconnect();
    });
    response.send('');
}

function launchApp(request, response) {
    var appName = request.params.appName;
    console.log("Launch app " + appName);
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
        tv.request('ssap://system.launcher/launch', {id: id});
    }

    response.send('');
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
