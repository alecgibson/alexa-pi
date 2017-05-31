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
    server.get('/health', function(request, response) {
        console.log("Health Check");
        response.send('OK');
    });

    server.post(TV_BASE_PATH, function (request, response) {
        console.log(request);
        var intent = (request && request.request && request.request.intent) || {};
        var intentName = intent.name || '';

        var alexaResponse;
        switch (intentName.toLowerCase()) {
            case 'fastforward':
                alexaResponse = fastForward();
                break;
            case 'launch':
                alexaResponse = launchApp(intent);
                break;
            case 'mute':
                alexaResponse = mute();
                break;
            case 'pause':
                alexaResponse = pause();
                break;
            case 'play':
                alexaResponse = play();
                break;
            case 'rewind':
                alexaResponse = rewind();
                break;
            case 'setvolume':
                alexaResponse = setVolume(intent);
                break;
            case 'turnoff':
                alexaResponse = turnOff();
                break;
            case 'unmute':
                alexaResponse = unmute();
                break;
            case 'volumedown':
                alexaResponse = volumeChange(-5);
                break;
            case 'volumeup':
                alexaResponse = volumeChange(+5);
                break;
            default:
                alexaResponse = alexaOutputSpeech(
                    "I didn't recognise that command."
                );
        }

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
        return alexaOutputSpeech(
            "I can't connect to the TV."
        );
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

function alexaOutputSpeech(text) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: text
        }
    };
}

function turnOff() {
    tvRequest('ssap://system/turnOff', function() {
        tv.disconnect();
    });
}

function launchApp(intent) {
    var appName = slotValue(intent, 'AppToLaunch') || '';

    var id = null;
    switch (appName.toLowerCase()) {
        case 'live tv':
            id = 'com.webos.app.livetv';
            break;
        case 'tv guide':
            id = 'com.webos.app.tvguide';
            break;
        case 'i player':
            id = 'bbc';
            break;
        case 'netflix':
            id = 'netflix';
            break;
        case 'amazon':
            id = 'lovefilm';
            break;
        case 'demand 5':
            id = 'demand5';
            break;
        case 'now tv':
            id = 'now.tv';
            break;
        case 'youtube':
            id = 'youtube.leanback.v4';
            break;
        case 'google play':
            id = 'googleplaymovieswebos';
            break;
    }

    if (id) {
        return tvRequest('ssap://system.launcher/launch', {id: id});
    } else {
        return alexaOutputSpeech("I couldn't find that app.");
    }
}

function enterKey(request, response) {
    tv.request('ssap://com.webos.service.ime/sendEnterKey');
}

function enterText(request, response) {
    var text = request.params.text;
    tv.request('ssap://com.webos.service.ime/insertText', {text: text});
}

function clearText(request, response) {
    for (var i=0; i < 100; i++) {
        tv.request('ssap://com.webos.service.ime/deleteCharacters', {count: 1});
    }
}

function mute() {
    return tvRequest('ssap://audio/setMute', {mute: true});
}

function unmute() {
    return tvRequest('ssap://audio/setMute', {mute: false});
}

function setVolume(intent) {
    var volume = parseInt(slotValue(intent, 'Volume'));
    return tvRequest('ssap://audio/setVolume', {volume: volume});
}

function volumeChange(change) {
    var response;

    if (change >= 0) {
        for (var i=0; i < change; i++) {
            response = tv.request('ssap://audio/volumeUp');
        }
    } else {
        for (var i=change; i < 0; i++) {
            response = tv.request('ssap://audio/volumeDown');
        }
    }

    return response;
}

function play() {
    return tvRequest('ssap://media.controls/play');
}

function pause() {
    return tvRequest('ssap://media.controls/pause');
}

function stop() {
    return tvRequest('ssap://media.controls/stop');
}

function rewind() {
    return tvRequest('ssap://media.controls/rewind');
}

function fastForward() {
    return tvRequest('ssap://media.controls/fastForward');
}

function slotValue(intent, slotName) {
    intent = intent || {};
    var slots = intent.slots || {};
    var slot = slots[slotName] || {};
    return slot.value;
}
