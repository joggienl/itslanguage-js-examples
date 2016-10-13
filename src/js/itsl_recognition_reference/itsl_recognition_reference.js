'use strict';

/* eslint-disable
 no-unused-vars
 */

/* global
 document,
 */

(function() {
  /*
   * This is demo code performing several streaming operations.
   */
  var its = require('itslanguage');
  var creds = require('../settings/settings');
  var comps = require('../components/audio-components');
  var sdk = null;

  function setDefaultSettings() {
    // Setup default configuration
    document.getElementById('apiUrl').value = creds.API_URL;
    document.getElementById('tenantId').value = creds.API_TENANT_ID;
    document.getElementById('principal').value = creds.API_PRINCIPAL;
    document.getElementById('credentials').value = creds.API_CREDENTIALS;
    document.getElementById('wsUrl').value = creds.API_WS_URL;
  }

  function applyCredentials() {
    var config = {};
    config.apiUrl = document.getElementById('apiUrl').value;
    config.authPrincipal = document.getElementById('principal').value;
    config.authCredentials = document.getElementById('credentials').value;
    // Setup the SDK.
    sdk = new its.Sdk(config);
  }

// Attach handlers
  document.addEventListener('DOMContentLoaded', function() {
    setDefaultSettings();
    applyCredentials();

    document.getElementById('applyCredentials').onclick = function() {
      applyCredentials();
    };

    document.getElementById('createChoiceChallenge').onclick = function() {
      var organisationId = document.getElementsByName(
        'organisationId')[0].value;
      var choices = document.getElementsByName(
        'choices')[0].value.split('|');
      choices = choices.map(function(v) {
        return v.trim();
      });
      var challengeId = document.getElementById('choiceChallengeId').value;
      var challenge = new its.ChoiceChallenge(
        organisationId, challengeId || null, null, choices);
      sdk.createChoiceChallenge(challenge, function(challenge) {
        document.getElementById('choiceChallengeId').value = challenge.id;
      });
    };

    document.getElementById('connection').value = 'Closed';
    document.getElementById('applyToken').onclick = function() {
      var config = {};
      config.apiUrl = document.getElementById('apiUrl').value;
      config.wsUrl = document.getElementById('wsUrl').value || null;
      config.wsToken = document.getElementById('tokenId').value;
      config.authPrincipal = document.getElementById('principal').value;
      config.authCredentials = document.getElementById('credentials').value;
      // Setup the SDK.
      sdk = new its.Sdk(config);

      document.getElementById('connection').value = 'Connecting';
      sdk.addEventListener('websocketError', function() {
        document.getElementById('connection').value = 'Error';
      });
      sdk.addEventListener('websocketOpened', function() {
        document.getElementById('connection').value = 'Open';
      });
      sdk.addEventListener('websocketClosed', function() {
        document.getElementById('connection').value = 'Closed';
      });
    };

    // Default audio recorder.
    var recorderUI = null;

    // Only record in WAVE format as the its-ws-server backend doesn't support
    // anything else currently.
    var rec = new its.AudioRecorder({forceWave: true});
    // Create the GUI audio recorder and connect it to the recording
    // component. Also, instantiate an AudioPlayer that can be used
    // to playback any recorded audio.
    var recorder = document.getElementById('recorder');
    recorderUI = new comps.Recorder({
      element: recorder,
      recorder: rec,
      player: new its.AudioPlayer()
    });
    recorderUI.addEventListener('recorded', function() {
      recorderUI.disableRecorder();
    });

    // For the volume meter to work, we need an input stream. Request it.
    rec.requestUserMedia();

    // When user has provided permission to use the microphone, the 'ready'
    // event is triggered. At that time, create a VolumeMeter that is in
    // turn attached to the recorder GUI component.
    // This brings the GUI volume meter inside the audio recorder to life.
    rec.addEventListener('ready', function(audioContext, inputStream) {
      var volumeMeter = new its.AudioTools.VolumeMeter(
        audioContext, inputStream);
      recorderUI.attachVolumeMeter(volumeMeter);
    });

    function preparedCb(recognitionId) {
      document.getElementById('recognitionId').value = recognitionId;
    }

    function recognisedCb(recognition) {
      document.getElementById(
        'recognitionDownloadUrl').value = recognition.audioUrl;
      if (!recognition.recognised) {
        recognition.recognised = '*** Nothing recognised ***';
      }
      document.getElementById('recognised').value = recognition.recognised;
    }

    function failureCb(recognition, message) {
      document.getElementById(
        'recognitionDownloadUrl').value = recognition.audioUrl;
      document.getElementById('failureMessage').value = message;
    }

    document.getElementById('startStreamingRecognition').onclick = function() {
      recorderUI.enableRecorder();

      // Clear data of last attempts
      document.getElementById('recognitionDownloadUrl').value = '';
      document.getElementById('failureMessage').value = '';
      document.getElementById('recognised').value = '';

      var organisationId = document.getElementsByName(
        'organisationId')[0].value;
      var challengeId = document.getElementById(
        'choiceChallengeId').value;
      var challenge = new its.ChoiceChallenge(
        organisationId, challengeId || null, null, []);
      sdk.startStreamingChoiceRecognition(
        challenge, rec, preparedCb, recognisedCb, failureCb);
    };
  });
}());
