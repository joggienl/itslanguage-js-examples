'use strict';

/* eslint-disable
 no-unused-vars,
 no-use-before-define
 */

/* global
 document,
 window,
 Blob,
 FileReader
 */

(function() {
  /*
   * This is demo code performing several streaming operations.
   */
  var its = require('itslanguage');
  var comps = require('../components/audio-components');
  var textcomps = require('../components/textual-components');
  var creds = require('../settings/settings');
  var sdk = null;

  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  } else {
    console.error('The File APIs are not fully supported in this browser.');
  }

  var referenceBlob = null;

  function readBlob(files) {
    // files is a FileList of File objects.
    var f = files[0];
    var reader = new FileReader();
    var blob = f.slice(0, f.size - 1);
    reader.readAsBinaryString(blob);
    console.debug('Prepared blob of size: ' + f.size);
    console.debug('Filename: ' + f.name);
    console.debug('Mimetype: ' + f.type);
    return new Blob([blob], {type: f.type});
  }

  function handleFileSelect(evt) {
    var files = evt.target.files;
    referenceBlob = readBlob(files);
  }

  function handleModelFileDrop(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    var files = evt.dataTransfer.files;
    referenceBlob = readBlob(files);
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    return false;
  }

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

    document.getElementsByName('reference')[0].addEventListener(
      'change', handleFileSelect, false);

    var modelDragZone = document.getElementById('referenceDrag');
    modelDragZone.addEventListener('dragover', handleDragOver, false);
    modelDragZone.addEventListener('drop', handleModelFileDrop, false);

    document.getElementById('createAnalysisChallenge').onclick = function() {
      console.log('Clicked button');
      var organisationId = document.getElementsByName(
        'organisationId')[0].value;
      var transcription = document.getElementsByName(
        'transcription')[0].value;
      var challengeId = document.getElementById('analysisChallengeId').value;
      var challenge = new its.PronunciationChallenge(
        organisationId, challengeId, transcription, referenceBlob);
      console.log('Creatin challenge');
      sdk.createPronunciationChallenge(challenge)
        .then(function(challenge) {
          console.log('created challenge ' + challenge);
          document.getElementById('analysisChallengeId').value = challenge.id;
        })
        .catch(function(error) {
          console.log('Caught ' + error + '' + JSON.stringify(error));
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
        recorderUI.disableRecorder();
        document.getElementById('connection').value = 'Error';
      });
      sdk.addEventListener('websocketOpened', function() {
        recorderUI.enableRecorder();
        document.getElementById('connection').value = 'Open';
      });
      sdk.addEventListener('websocketClosed', function() {
        recorderUI.disableRecorder();
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

    function analysedCb(analysis) {
      document.getElementById(
        'analysisDownloadUrl').value = analysis.audioUrl;
      document.getElementById('score').value = analysis.score;
      document.getElementById(
        'confidenceScore').value = analysis.confidenceScore;
      sentenceComponent.show(analysis.words);
    }

    function progressCb(analysis) {
      if (analysis) {
        console.log('progresscb ' + analysis);
        console.log('progresscb ' + JSON.stringify(analysis));
        document.getElementById(
          'confidenceScore').value = analysis.confidenceScore;
        detailedScoresComponent.show(analysis.words);
      }
    }

    function failureCb(analysis) {
      console.log('INTO FAILRUE CB WITH ' + analysis);
      recorderUI.disableRecorder();
      if (analysis.audioUrl) {
        document.getElementById('analysisDownloadUrl').value = analysis.audioUrl;
      }
      document.getElementById('failureMessage').value = analysis.message;
    }

    document.getElementById('startStreamingAnalysis').onclick = function() {
      recorderUI.enableRecorder();

      // Clear data of last attempts
      document.getElementById('analysisId').value = '';
      document.getElementById('analysisDownloadUrl').value = '';
      document.getElementById('failureMessage').value = '';
      document.getElementById('score').value = '';
      document.getElementById('confidenceScore').value = '';
      sentenceComponent.reset();

      var organisationId = document.getElementsByName(
        'organisationId')[0].value;
      var challengeId = document.getElementById('analysisChallengeId').value;
      var trimAudio = document.getElementById('trimAudio').value;
      var challenge = new its.PronunciationChallenge(
        organisationId, challengeId, 'dummy');
      sdk.startStreamingPronunciationAnalysis(
        challenge, rec, trimAudio)
        .then(analysedCb)
        .catch(failureCb)
        .tap(progressCb);
    };

    var colouredSentence = document.getElementById('colouredSentence');
    var sentenceComponent = new textcomps.ColouredSentence({
      element: colouredSentence
    });

    var detailedScores = document.getElementById('detailedScores');
    var detailedScoresComponent = new textcomps.DetailedScores({
      element: detailedScores
    });
    recorderUI.disableRecorder();
  });
}());
