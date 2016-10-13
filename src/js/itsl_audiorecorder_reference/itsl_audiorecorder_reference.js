'use strict';

/* eslint-disable
 no-unused-vars
 */

/* global
 document,
 its
 */

(function() {
  /*
   * This is demo code performing several streaming operations.
   */
  var sdk = null;
  var its = require('itslanguage');
  var uicomps = require('../components/audio-components');
  var creds = require('../settings/settings');

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
  document.addEventListener('DOMContentLoaded', function(event) {
    setDefaultSettings();
    applyCredentials();

    document.getElementById('applyCredentials').onclick = function() {
      applyCredentials();
    };

    document.getElementById('createSpeechChallenge').onclick = function() {
      var organisationId = document.getElementsByName(
        'organisationId')[0].value;
      var topic = document.getElementById('topic').value;
      var challengeId = document.getElementById('speechChallengeId').value;
      var challenge = new its.SpeechChallenge(
        organisationId, challengeId, topic);
      sdk.createSpeechChallenge(challenge, function(challenge) {
        document.getElementById('speechChallengeId').value = challenge.id;
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
    recorderUI = new uicomps.Recorder({
      element: recorder,
      recorder: rec,
      player: new its.AudioPlayer(),
      maxRecordingDuration: 200
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

    function preparedCb(recordingId) {
      document.getElementById('recordingId').value = recordingId;
    }

    function recordedCb(recording) {
      if (recording) {
        document.getElementById('recordingId').value = recording.id;
        document.getElementById(
          'recordingDownloadUrl').value = recording.audioUrl;
      }
    }

    function failureCb(recording) {
      recorderUI.disableRecorder();
      if (recording.audioUrl) {
        document.getElementById(
          'recordingDownloadUrl').value = recording.audioUrl;
      }
      document.getElementById('failureMessage').value = recording.message;
    }

    document.getElementById('startStreamingRecording').onclick = function() {
      recorderUI.enableRecorder();

      // Clear data of last attempts
      document.getElementById('recordingId').value = '';
      document.getElementById('recordingDownloadUrl').value = '';
      document.getElementById('failureMessage').value = '';

      var organisationId = document.getElementsByName(
        'organisationId')[0].value;
      var challengeId = document.getElementById('speechChallengeId').value;
      var challenge = new its.SpeechChallenge(
        organisationId, challengeId, 'dummy');
      sdk.startStreamingSpeechRecording(
        challenge, rec)
        .catch(failureCb)
        .then(recordedCb);
    };

    recorderUI.disableRecorder();
  });
}());
