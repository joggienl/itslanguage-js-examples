require('./demo.css');
const Raven = require('raven-js');
const its = require('itslanguage');


/* On bowser, there is no console available, log to an element. */
console.orgLog = console.log;
console.log = function(...args) {
  console.orgLog(...args);
  const log = document.getElementById('log');
  if (log) {
    log.innerHTML += escape(args.join(' ')) + '<br/>';
  }
};

const textcomps = require('../components/textual-components');
const uicomps = require('../components/audio-components');

const settings = require('./settings.json');

/*
 * This is demo code performing several streaming operations.
 */
let sdk = null;
let rec = null;
// Start tab is recording.
let active = 'recording';
// Default audio recorder.
let recorderUI = null;
let analysisRecorderUI = null;
let recognitionRecorderUI = null;

const detailedScores = document.getElementById('detailedScores');
const detailedScoresComponent = new textcomps.DetailedScores({
  element: detailedScores
});

/* Setup JS crash reporting */
const dsn = 'https://dd6dbc74e1a141d39c28c9bad0042a7a@app.getsentry.com/59178';
Raven.config(dsn).install();

function setDefaultSettings() {
  // Setup default configuration
  document.getElementById('apiUrl').value = settings.API_URL;
  document.getElementById('principal').value = settings.API_PRINCIPAL;
  document.getElementById('tenantId').value = settings.API_TENANT_ID;
  document.getElementById('credentials').value = settings.API_CREDENTIALS;
  document.getElementById('wsUrl').value = settings.API_WS_URL;
}

function setRecordingSettings() {
  document.getElementById('challengeId').value = settings.RECORDING_CHALLENGE_ID;
}

function setAnalysisSettings() {
  // Bird watching
  document.getElementById('challengeId').value = settings.ANALYSIS_CHALLENGE_ID;
}

function setRecognitionSettings() {
  // car;bike;bus
  document.getElementById('challengeId').value = settings.RECOGNITION_CHALLENGE_ID;
}

function connect() {
  const config = {};
  config.apiUrl = document.getElementById('apiUrl').value;
  config.wsUrl = document.getElementById('wsUrl').value || null;
  config.wsToken = document.getElementById('tokenId').value;
  config.authPrincipal = document.getElementById('principal').value;
  config.authCredentials = document.getElementById('credentials').value;
  // Setup the SDK.
  sdk = new its.Connection(config);

  document.getElementById('connection').value = 'Connecting to ITSLanguage';
  sdk.addEventListener('websocketError', () => {
    document.getElementById(
      'connection').value = 'Error connecting ITSLanguage';
  });
  sdk.addEventListener('websocketOpened', () => {
    document.getElementById(
      'connection').value = 'Connection to ITSLanguage established';
    startSession();
  });
  sdk.addEventListener('websocketClosed', () => {
    document.getElementById(
      'connection').value = 'No ITSLanguage connection';
  });

  //Create a BasicAuth with your credentials.
  const basicAuth = new its.BasicAuth(config.authPrincipal, config.authPrincipal, config.authCredentials);
  //For demo purposes, organisation and student are set to dummy.
  sdk.getOauth2Token(basicAuth, 'dummy', 'dummy')
    .then(result => {
      //Set the token.
      sdk.settings.oAuth2Token = result.access_token;
      sdk.webSocketConnect(sdk.settings.oAuth2Token);
    })
    .catch(error => {
      console.log('err' + JSON.stringify(error));
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

  const organisationId = document.getElementById('organisationId').value;
  const challengeId = document.getElementById('challengeId').value;
  const challenge = new its.SpeechChallenge(organisationId, challengeId, 'dummy');
  sdk.startStreamingSpeechRecording(challenge, rec, preparedCb, recordedCb, failureCb);
}

function resetRecordingResults() {
  // Clear data of last attempts
  document.getElementById('sessionId').value = '';
  document.getElementById('failureMessage').value = '';
  setDownloadLink();
}

function analysisStartSession() {
  analysisRecorderUI.enableRecorder();

  const range1 = document.getElementById('range1');
  const range2 = document.getElementById('range2');
  detailedScoresComponent.setThresholdBad(parseInt(range1.value));
  detailedScoresComponent.setThresholdGood(parseInt(range2.value));

  const organisationId = document.getElementById('organisationId').value;
  const challengeId = document.getElementById('challengeId').value;
  const challenge = new its.PronunciationChallenge(organisationId, challengeId, 'dummy');
  sdk.startStreamingPronunciationAnalysis(challenge, rec, preparedCb, analysedCb, failureCb, analysisProgressCb);
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

  const organisationId = document.getElementById('organisationId').value;
  const challengeId = document.getElementById('challengeId').value;
  const challenge = new its.ChoiceChallenge(organisationId, challengeId, 'dummy', []);
  sdk.startStreamingChoiceRecognition(challenge, rec, preparedCb, recognisedCb, failureCb);
}

function resetRecognitionResults() {
  // Clear data of last attempts
  document.getElementById('sessionId').value = '';
  document.getElementById('failureMessage').value = '';
  document.getElementById('recognised').value = '';
  setDownloadLink();
}

function setDownloadLink(url) {
  const downloadUrl = document.getElementById('downloadUrl');
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

function recordedCb(recording) {
  document.getElementById('sessionId').value = recording.id;
  setDownloadLink(recording.audioUrl);

  startSession();
}

function analysedCb() {
  // Skip analysis results for now.
}

function analysisProgressCb(alignment, referenceAlignment) {
  document.getElementById('confidenceScore').value = alignment.confidenceScore;
  detailedScoresComponent.show(alignment.words, referenceAlignment.words);

  // Apply bootstrap style table
  const table = detailedScores.children[0];
  table.classList.add('table');
  table.classList.add('table-striped');
  table.classList.add('table-bordered');

  startSession();
}

function recognisedCb(recognition) {
  let recognised = recognition.recognised;
  if (!recognised) {
    recognised = 'Sorry, nothing recognised';
  }
  document.getElementById('recognised').value = recognised;
  setDownloadLink(recognition.audioUrl);
  startSession();
}

function failureCb(result, message) {
  setDownloadLink(result.audioUrl);
  document.getElementById('failureMessage').value = message || result.message;
  startSession();
}

// Attach handlers
document.addEventListener('DOMContentLoaded', () => {
  setDefaultSettings();
  setRecordingSettings();
  connect();

  const recordingButton = document.getElementById('recordingButton');
  const analysisButton = document.getElementById('analysisButton');
  const recognitionButton = document.getElementById('recognitionButton');

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

  recordingButton.onclick = () => {
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

  analysisButton.onclick = () => {
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

  recognitionButton.onclick = () => {
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

  function toggleOn(kind) {
    const button = document.getElementById(kind + 'Button');
    button.parentElement.classList.add('active');

    const control = document.getElementById(kind + 'Control');
    const form = document.getElementById(kind + 'Form');
    control.classList.remove('hidden');
    form.classList.remove('hidden');
    form.style.display = 'block';
  }

  function toggleOff(kind) {
    const button = document.getElementById(kind + 'Button');
    button.parentElement.classList.remove('active');

    const control = document.getElementById(kind + 'Control');
    const form = document.getElementById(kind + 'Form');
    control.classList.add('hidden');
    form.classList.add('hidden');
  }

  document.getElementById('recordingDetailToggle').onclick = () => {
    const details = document.getElementById('recordingDetails');
    details.classList.toggle('hidden');
    return false;
  };

  document.getElementById('configDetailToggle').onclick = () => {
    const details = document.getElementById('configDetails');
    details.classList.toggle('hidden');
    return false;
  };

  document.getElementById('logToggle').onclick = () => {
    const log = document.getElementById('log');
    log.classList.toggle('hidden');
    return false;
  };

  document.getElementById('applyChallenge').onclick = () => {
    // Challenge type need to be of currently loaded challenge type.
    unbindRecorder();
    bindRecorder();
    return false;
  };

  document.getElementById('connection').value = 'Closed';
  document.getElementById('applyToken').onclick = () => {
    connect();
  };

  // Only record in WAVE format as the its-ws-server backend doesn't support
  // anything else currently.
  rec = new its.AudioRecorder({forceWave: true});

  function initRecordingRecorder() {
    // Create the GUI audio recorder and connect it to the recording
    // component. Also, instantiate an AudioPlayer that can be used
    // to playback any recorded audio.
    const recorder = document.getElementById('recorder');

    recorderUI = new uicomps.Recorder({
      element: recorder,
      recorder: rec,
      player: new its.AudioPlayer(),
      maxRecordingDuration: 200
    });
    recorderUI.addEventListener('recording', () => {
      resetRecordingResults();
    });
    recorderUI.addEventListener('recorded', () => {
      recorderUI.disableRecorder();
    });
    bindVolumeMeter(recorderUI);
  }

  initRecordingRecorder();

  function initAnalysisRecorder() {
    const analysisRecorder = document.getElementById('analysisRecorder');
    analysisRecorderUI = new uicomps.Recorder({
      element: analysisRecorder,
      recorder: rec,
      player: new its.AudioPlayer(),
      maxRecordingDuration: 200
    });
    analysisRecorderUI.addEventListener('recording', () => {
      resetAnalysisResults();
    });
    analysisRecorderUI.addEventListener('recorded', () => {
      analysisRecorderUI.disableRecorder();
    });
    bindVolumeMeter(analysisRecorderUI);
  }

  function initRecognitionRecorder() {
    const recognitionRecorder = document.getElementById('recognitionRecorder');
    recognitionRecorderUI = new uicomps.Recorder({
      element: recognitionRecorder,
      recorder: rec,
      player: new its.AudioPlayer(),
      maxRecordingDuration: 200
    });
    recognitionRecorderUI.addEventListener('recording', () => {
      resetRecognitionResults();
    });
    recognitionRecorderUI.addEventListener('recorded', () => {
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
    rec.addEventListener('ready', (audioContext, inputStream) => {
      const volumeMeter = new its.AudioTools.VolumeMeter(audioContext, inputStream);
      recorderUi.attachVolumeMeter(volumeMeter);
    });
  }

  const range1 = document.getElementById('range1');
  const range2 = document.getElementById('range2');
  const range1out = document.getElementById('range1out');
  const range2out = document.getElementById('range2out');
  range1.oninput = range1.onchange = () => {
    range1out.innerText = this.value;
    // Make sure range2 is adjusted to not overlap.
    range2.value = Math.max(range2.value, this.value);
    range2out.innerText = range2.value;
  };
  range2.oninput = range2.onchange = () => {
    range2out.innerText = this.value;
    // Make sure range1 is adjusted to not overlap.
    range1.value = Math.min(range1.value, this.value);
    range1out.innerText = range1.value;
  };
});
