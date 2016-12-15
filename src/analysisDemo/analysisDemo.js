/* eslint-disable
 no-unused-vars
 */

/**
 * This is a demo showcasing the speech analysis functionality of the SDK. The recorder and player UI elements
 * are created in dedicated .js files as well as the tables showing the alignment and analysis results.
 * You too can create your own view of those elements. Read the documentation on
 * the GitHub page on the requirements.
 *
 * For this demo the following Tenant, BasicAuth, Organization, Student and PronunciationChallenge have been created in
 * the pilot environment:
 * If you do not know what those are, read the API docs on //TODO
 * If you want to see how you add those entities yourself, follow the relevant examples.
 *
 * Tenant:
 * - id:            pilot
 * - name:          pilot
 *
 * BasicAuth:
 * - tenantId:      pilot
 * - principal:     pilot
 * - credentials:   secret
 *
 * Organization:
 * - id:            dummy
 * - name:          dummy
 *
 * Student:
 * - id:            dummy
 * - firstName:     dummy
 *
 * PronunciationChallenge:
 * - id:            analysis_bird_watching
 * - transcription: Bird watching
 */
require('./index.html');
require('../css/demo.css');
const its = require('itslanguage');
const settings = require('../settings/settings.json');
const UIComponents = require('../components/audio-components');
const TextComponents = require('../components/textual-components');
let referenceAlignment;

document.addEventListener('DOMContentLoaded', () => {
  // Set the prompt on the .html page.
  const analysisPrompt = 'Bird watching';
  document.getElementById('analysisPrompt').innerText = analysisPrompt;

  // Create the audio player and recorder.
  const player = new its.AudioPlayer();
  const recorder = new its.AudioRecorder({forceWave: true});

  // Once the recorder has finished recording, load the blob file into the player.
  // Loading an audio file can also be done in the result handler of the .StartStreamingSpeechRecording method.
  recorder.addEventListener('recorded', (id, blob) => {
    // Load the audio.
    player.load(URL.createObjectURL(blob));
  });

  // Create the UI elements linked with the ITSLanguage players and recorders.
  const UIRecorder = new UIComponents.Recorder({
    element: document.getElementById('recorder'),
    recorder
  });

  new UIComponents.Player({
    element: document.getElementById('player'),
    player
  });

  // Disable the recorder so no audio can be sent before the system is not ready.
  UIRecorder.disableRecorder();

  // Create the UI elements that display scores and results.
  const detailedReferenceScores = document.getElementById('detailedReferenceScores');
  const detailedReferenceScoresComponent = new TextComponents.DetailedScores({
    element: detailedReferenceScores
  });

  const detailedScores = document.getElementById('detailedScores');
  const detailedScoresComponent = new TextComponents.DetailedScores({
    element: detailedScores
  });

  // Setup the SDK.
  const config = {};
  config.apiUrl = settings.API_URL;
  config.wsUrl = settings.API_WS_URL;
  const connection = new its.Connection(config);
  const sdk = new its.AdministrativeSDK(connection);
  const organizationId = 'dummy';
  const organizationName = 'dummy';
  const studentId = 'dummy';
  const studentName = 'dummy';

  const tenantId = settings.API_TENANT_ID;
  const principal = settings.API_PRINCIPAL;
  const credentials = settings.API_CREDENTIALS;

  // Request microphone access.
  recorder.requestUserMedia();

  // Represent the existing entities in the database for clarity.
  const existingBasicAuth = new its.BasicAuth(tenantId, principal, credentials);
  const existingOrganization = new its.Organisation(organizationId, organizationName);
  const existingStudent = new its.Student(existingOrganization.id, studentId, studentName);
  const existingPronunciationChallenge = new its.PronunciationChallenge(existingOrganization.id,
    settings.ANALYSIS_CHALLENGE_ID, analysisPrompt);

  function startAnalysisSession() {
    const downloadUrl = document.getElementById('downloadUrl');
    downloadUrl.setAttribute('disabled', 'disabled');

    sdk.startStreamingPronunciationAnalysis(existingPronunciationChallenge, recorder)
      .progress(result => {
        // The progress call gets used when the internal setup to receive audio is done AND when receiving the audio
        // alignment. It is advised to enable recording functionality this way.
        // Be sure to check which event you are getting; .startStreamingPronunciationAnalysis uses progress twice.
        if (result === 'ReadyToReceive') {
          UIRecorder.enableRecorder();
        } else {
          // Progress event is then called with the alignment results.
          // alignment, reference,Alignment, sessionId
          referenceAlignment = result.referenceAlignment;
          detailedReferenceScoresComponent.reset();
          detailedScoresComponent.reset();

          // Setup reference results table
          const range1 = document.getElementById('range1');
          const range2 = document.getElementById('range2');
          detailedReferenceScoresComponent.setThresholdBad(parseInt(range1.value));
          detailedReferenceScoresComponent.setThresholdGood(parseInt(range2.value));
          detailedScoresComponent.setThresholdBad(parseInt(range1.value));
          detailedScoresComponent.setThresholdGood(parseInt(range2.value));
          document.getElementById('confidenceScore').value = result.progress.confidenceScore;
          detailedReferenceScoresComponent.show(result.progress.words, result.referenceAlignment.words);

          // Apply bootstrap style table
          const table = detailedReferenceScores.children[0];
          table.classList.add('table');
          table.classList.add('table-striped');
          table.classList.add('table-bordered');
        }
      })
      .then(result => {
        // Disable error message. Analysis succeeded after all.
        document.getElementById('errorMsg').innerText = '';
        document.getElementById('errorMsg').classList.remove('alert');
        document.getElementById('errorMsg').classList.remove('alert-warning');

        UIRecorder.disableRecorder();
        // You can load the audio here as well.
        // player.load(result.audioUrl);

        // Display results.
        detailedScoresComponent.showResults(result.analysis.words);
        const table = detailedScores.children[0];
        table.classList.add('table');
        table.classList.add('table-striped');
        table.classList.add('table-bordered');

        // Set download url.
        downloadUrl.value = result.analysis.audioUrl;
        downloadUrl.removeAttribute('disabled');

        // Start another session when done.
        startAnalysisSession();
      })
      .catch(error => {
        UIRecorder.disableRecorder();
        console.log('error', error);
        document.getElementById('errorMsg').innerText = 'Analysis Failed. Please try Again';
        document.getElementById('errorMsg').classList.add('alert');
        document.getElementById('errorMsg').classList.add('alert-warning');
        // Retry another session.
        setTimeout(startAnalysisSession, 500);
      });
  }

  connection.addEventListener('websocketOpened', () => {
    startAnalysisSession();
  });

  // Obtain a new token, assuming the role of this student.
  connection.getOauth2Token(existingBasicAuth, existingOrganization.id, existingStudent.id)
      // Connect to the websocket as this student.
      .then(() => connection.webSocketConnect())
      .catch(error => {
        console.error('errored', error);
      });

  const range1 = document.getElementById('range1');
  const range2 = document.getElementById('range2');
  const range1out = document.getElementById('range1out');
  const range2out = document.getElementById('range2out');
  range1.oninput = range1.onchange = () => {
    range1out.innerText = range1.value;
    // Make sure range2 is adjusted to not overlap.
    range2.value = Math.max(range2.value, range1.value);
    range2out.innerText = range2.value;
  };
  range2.oninput = range2.onchange = () => {
    range2out.innerText = range2.value;
    // Make sure range1 is adjusted to not overlap.
    range1.value = Math.min(range1.value, range2.value);
    range1out.innerText = range1.value;
  };
});
