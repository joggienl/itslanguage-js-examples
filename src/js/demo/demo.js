'use strict';

/* eslint-disable
 no-alert,
 no-unused-vars
 */

/* global
 alert,
 document,
 escape,
 window,
 Raven
 */

/* On bowser, there is no console available, log to an element. */
console.orgLog = console.log;
console.log = function(l) {
  console.orgLog(l);
  var log = document.getElementById('log');
  if (log) {
    log.innerHTML += escape(Array.prototype.join.call(l, ' ')) + '<br/>';
  }
};

var its = require('itslanguage');
var textcomps = require('../components/textual-components');
var uicomps = require('../components/audio-components');

(function() {
  /*
   * This is demo code performing several streaming operations.
   */
  var sdk = null;
  var rec = null;
  // Start tab is recording.
  var active = 'recording';
  // Default audio recorder.
  var recorderUI = null;
  var analysisRecorderUI = null;
  var recognitionRecorderUI = null;

  var detailedScores = document.getElementById('detailedScores');
  var detailedScoresComponent = new textcomps.DetailedScores({
    element: detailedScores
  });

  /* Setup JS crash reporting */
  var dsn = 'https://dd6dbc74e1a141d39c28c9bad0042a7a@app.getsentry.com/59178';
  Raven.config(dsn)
    .install();

  function setDefaultSettings() {
    // Setup default configuration
    document.getElementById('apiUrl').value = its.API_URL;
    document.getElementById('principal').value = its.API_PRINCIPAL;
    document.getElementById('tenantId').value = its.API_TENANT_ID;
    document.getElementById('credentials').value = its.API_CREDENTIALS;
    document.getElementById('wsUrl').value = its.API_WS_URL;
  }

  function setRecordingSettings() {
    document.getElementById('challengeId').value = its.RECORDING_CHALLENGE_ID;
  }

  function setAnalysisSettings() {
    // Bird watching
    document.getElementById('challengeId').value = its.ANALYSIS_CHALLENGE_ID;
  }

  function setRecognitionSettings() {
    // car;bike;bus
    document.getElementById(
      'challengeId').value = its.RECOGNITION_CHALLENGE_ID;
  }

  function connect() {
    var config = {};
    config.apiUrl = document.getElementById('apiUrl').value;
    config.wsUrl = document.getElementById('wsUrl').value || null;
    config.wsToken = document.getElementById('tokenId').value;
    config.authPrincipal = document.getElementById('principal').value;
    config.authCredentials = document.getElementById('credentials').value;
    // Setup the SDK.
    sdk = new its.Sdk(config);

    document.getElementById('connection').value = 'Connecting to ITSLanguage';
    sdk.addEventListener('websocketError', function() {
      document.getElementById(
        'connection').value = 'Error connecting ITSLanguage';
    });
    sdk.addEventListener('websocketOpened', function() {
      document.getElementById(
        'connection').value = 'Connection to ITSLanguage established';
      startSession();
    });
    sdk.addEventListener('websocketClosed', function() {
      document.getElementById(
        'connection').value = 'No ITSLanguage connection';
    });
  }

  function startSession() {
    switch (active) {
      case 'recording':
        recordingStartSession();
        break;
      case 'analysis':
        analysisStartSession();
        break;
      case 'recognition':
        recognitionStartSession();
        break;
    }
  }

  function recordingStartSession() {
    recorderUI.enableRecorder();

    var organisationId = document.getElementById('organisationId').value;
    var challengeId = document.getElementById('challengeId').value;
    var challenge = new its.SpeechChallenge(
      organisationId, challengeId, 'dummy');
    sdk.startStreamingSpeechRecording(
      challenge, rec)
      .catch(failureCb)
      .then(recordedCb);
  }

  function resetRecordingResults() {
    // Clear data of last attempts
    document.getElementById('sessionId').value = '';
    document.getElementById('failureMessage').value = '';
    setDownloadLink();
  }

  function analysisStartSession() {
    analysisRecorderUI.enableRecorder();

    var range1 = document.getElementById('range1');
    var range2 = document.getElementById('range2');
    detailedScoresComponent.setThresholdBad(parseInt(range1.value));
    detailedScoresComponent.setThresholdGood(parseInt(range2.value));

    var organisationId = document.getElementById('organisationId').value;
    var challengeId = document.getElementById('challengeId').value;
    var challenge = new its.PronunciationChallenge(
      organisationId, challengeId, 'dummy');
    sdk.startStreamingPronunciationAnalysis(
      challenge, rec, preparedCb, analysedCb, failureCb, analysisProgressCb);
  }

  function resetAnalysisResults() {
    // Clear data of last attempts
    document.getElementById('sessionId').value = '';
    document.getElementById('failureMessage').value = '';
    document.getElementById('confidenceScore').value = '';
    setDownloadLink();
    detailedScoresComponent.reset();
  }

  function recognitionStartSession() {
    recognitionRecorderUI.enableRecorder();

    var organisationId = document.getElementById('organisationId').value;
    var challengeId = document.getElementById('challengeId').value;
    var challenge = new its.ChoiceChallenge(
      organisationId, challengeId, 'dummy', []);
    sdk.startStreamingChoiceRecognition(
      challenge, rec, preparedCb, recognisedCb, failureCb);
  }

  function resetRecognitionResults() {
    // Clear data of last attempts
    document.getElementById('sessionId').value = '';
    document.getElementById('failureMessage').value = '';
    document.getElementById('recognised').value = '';
    setDownloadLink();
  }

  function setDownloadLink(url) {
    var downloadUrl = document.getElementById('downloadUrl');
    if (url) {
      downloadUrl.value = url;
      downloadUrl.removeAttribute('disabled');
    } else {
      downloadUrl.value = '';
      downloadUrl.setAttribute('disabled', 'disabled');
    }
  }

  function preparedCb(sessionId) {
    document.getElementById('sessionId').value = sessionId;
  }

  function recordedCb(recording, forcedStop) {
    console.log('in recorded cb with ' + recording);
    document.getElementById('sessionId').value = recording.id;
    setDownloadLink(recording.audioUrl);

    startSession();
  }

  function analysedCb(analysis) {
    // Skip analysis results for now.
  }

  function analysisProgressCb(alignment, referenceAlignment) {
    document.getElementById(
      'confidenceScore').value = alignment.confidenceScore;
    detailedScoresComponent.show(
      alignment.words, referenceAlignment.words);

    // Apply bootstrap style table
    var table = detailedScores.children[0];
    table.classList.add('table');
    table.classList.add('table-striped');
    table.classList.add('table-bordered');

    startSession();
  }

  function recognisedCb(recognition) {
    var recognised = recognition.recognised;
    if (!recognised) {
      recognised = 'Sorry, nothing recognised';
    }
    document.getElementById('recognised').value = recognised;
    setDownloadLink(recognition.audioUrl);
    startSession();
  }

  function failureCb(result, message) {
    console.log('In failureCB');
    setDownloadLink(result.audioUrl);
    document.getElementById('failureMessage').value = (
    message || result.message);
    startSession();
  }

  // Attach handlers
  document.addEventListener('DOMContentLoaded', function(event) {
    setDefaultSettings();
    setRecordingSettings();
    connect();

    var recordingButton = document.getElementById('recordingButton');
    var analysisButton = document.getElementById('analysisButton');
    var recognitionButton = document.getElementById('recognitionButton');

    function unbindRecorder() {
      if (rec.isRecording()) {
        alert('Please stop recording first');
        return false;
      }

      // Cancel current session (if any) and unbind events from recorder.
      console.debug('Canceling current streaming recording');
      sdk.cancelStreaming(rec);

      return true;
    }

    function bindRecorder() {
      if (recordingButton.parentElement.classList.contains('active')) {
        bindRecordingRecorder();
      } else if (analysisButton.parentElement.classList.contains('active')) {
        bindAnalysisRecorder();
      } else if (
        recognitionButton.parentElement.classList.contains('active')) {
        bindRecognitionRecorder();
      }
    }

    function bindRecordingRecorder() {
      resetRecordingResults();
      setRecordingSettings();
      initRecordingRecorder();
      startSession();
    }

    function bindAnalysisRecorder() {
      resetAnalysisResults();
      setAnalysisSettings();
      initAnalysisRecorder();
      startSession();
    }

    function bindRecognitionRecorder() {
      resetRecognitionResults();
      setRecognitionSettings();
      initRecognitionRecorder();
      startSession();
    }

    recordingButton.onclick = function() {
      if (!unbindRecorder()) {
        return;
      }

      if (!recordingButton.parentElement.classList.contains('active')) {
        active = 'recording';
        toggleOn('recording');
        toggleOff('analysis');
        toggleOff('recognition');

        bindRecordingRecorder();
      }
    };

    analysisButton.onclick = function() {
      if (!unbindRecorder()) {
        return;
      }

      if (!analysisButton.parentElement.classList.contains('active')) {
        active = 'analysis';
        toggleOff('recording');
        toggleOn('analysis');
        toggleOff('recognition');

        bindAnalysisRecorder();
      }
    };

    recognitionButton.onclick = function() {
      if (!unbindRecorder()) {
        return;
      }

      if (!recognitionButton.parentElement.classList.contains('active')) {
        active = 'recognition';
        toggleOff('recording');
        toggleOff('analysis');
        toggleOn('recognition');

        bindRecognitionRecorder();
      }
    };

    // Hide all functionality unless 'all' is appended to the url.
    if (window.location.search.indexOf('all') !== -1) {
      recognitionButton.parentElement.classList.remove('hidden');
      analysisButton.parentElement.classList.remove('hidden');
    }

    function toggleOn(kind) {
      var button = document.getElementById(kind + 'Button');
      button.parentElement.classList.add('active');

      var control = document.getElementById(kind + 'Control');
      var form = document.getElementById(kind + 'Form');
      control.classList.remove('hidden');
      form.classList.remove('hidden');
      form.style.display = 'block';
    }

    function toggleOff(kind) {
      var button = document.getElementById(kind + 'Button');
      button.parentElement.classList.remove('active');

      var control = document.getElementById(kind + 'Control');
      var form = document.getElementById(kind + 'Form');
      control.classList.add('hidden');
      form.classList.add('hidden');
    }

    document.getElementById('recordingDetailToggle').onclick = function() {
      var details = document.getElementById('recordingDetails');
      details.classList.toggle('hidden');
      return false;
    };

    document.getElementById('configDetailToggle').onclick = function() {
      var details = document.getElementById('configDetails');
      details.classList.toggle('hidden');
      return false;
    };

    document.getElementById('logToggle').onclick = function() {
      var log = document.getElementById('log');
      log.classList.toggle('hidden');
      return false;
    };

    document.getElementById('applyChallenge').onclick = function() {
      // Challenge type need to be of currently loaded challenge type.
      unbindRecorder();
      bindRecorder();
      return false;
    };

    document.getElementById('connection').value = 'Closed';
    document.getElementById('applyToken').onclick = function() {
      connect();
    };

    // Only record in WAVE format as the its-ws-server backend doesn't support
    // anything else currently.
    rec = new its.AudioRecorder({forceWave: true});

    function initRecordingRecorder() {
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
      recorderUI.addEventListener('recording', function() {
        resetRecordingResults();
      });
      recorderUI.addEventListener('recorded', function() {
        recorderUI.disableRecorder();
      });
      bindVolumeMeter(recorderUI);
    }

    initRecordingRecorder();

    function initAnalysisRecorder() {
      var analysisRecorder = document.getElementById('analysisRecorder');
      analysisRecorderUI = new uicomps.Recorder({
        element: analysisRecorder,
        recorder: rec,
        player: new its.AudioPlayer(),
        maxRecordingDuration: 200
      });
      analysisRecorderUI.addEventListener('recording', function() {
        resetAnalysisResults();
      });
      analysisRecorderUI.addEventListener('recorded', function() {
        analysisRecorderUI.disableRecorder();
      });
      bindVolumeMeter(analysisRecorderUI);
    }

    function initRecognitionRecorder() {
      var recognitionRecorder = document.getElementById('recognitionRecorder');
      recognitionRecorderUI = new uicomps.Recorder({
        element: recognitionRecorder,
        recorder: rec,
        player: new its.AudioPlayer(),
        maxRecordingDuration: 200
      });
      recognitionRecorderUI.addEventListener('recording', function() {
        resetRecognitionResults();
      });
      recognitionRecorderUI.addEventListener('recorded', function() {
        recognitionRecorderUI.disableRecorder();
      });
      bindVolumeMeter(recognitionRecorderUI);
    }

    function bindVolumeMeter(recorderUi) {
      // For the volume meter to work, we need an input stream. Request it.
      if (!rec.hasUserMediaApproval()) {
        rec.requestUserMedia();
      }

      // When user has provided permission to use the microphone, the 'ready'
      // event is triggered. At that time, create a VolumeMeter that is in
      // turn attached to the recorder GUI component.
      // This brings the GUI volume meter inside the audio recorder to life.
      rec.addEventListener('ready', function(audioContext, inputStream) {
        var volumeMeter = new its.AudioTools.VolumeMeter(
          audioContext, inputStream);
        recorderUi.attachVolumeMeter(volumeMeter);
      });
    }

    var range1 = document.getElementById('range1');
    var range2 = document.getElementById('range2');
    var range1out = document.getElementById('range1out');
    var range2out = document.getElementById('range2out');
    range1.oninput = range1.onchange = function() {
      range1out.innerText = this.value;
      // Make sure range2 is adjusted to not overlap.
      range2.value = Math.max(range2.value, this.value);
      range2out.innerText = range2.value;
    };
    range2.oninput = range2.onchange = function() {
      range2out.innerText = this.value;
      // Make sure range1 is adjusted to not overlap.
      range1.value = Math.min(range1.value, this.value);
      range1out.innerText = range1.value;
    };
  });
}());
