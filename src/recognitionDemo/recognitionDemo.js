/**
 * This is a demo showcasing the speech recognition functionality of the SDK. The recorder and player UI elements
 * are created in dedicated .js files.
 * You too can create your own view of those elements. Read the documentation on
 * the GitHub page on the requirements.
 *
 * For this demo the following Tenant, BasicAuth, Organization, Student and RecognitionChallenge have been created in
 * the pilot environment:
 * If you do not know what those are, read the API docs.
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
 * RecognitionChallenge:
 * - id:            recognition_transportation
 * - choices:      ['bike', 'bus', 'car']
 */

require('./index.html');
require('../css/demo.css');
const its = require('itslanguage');
const settings = require('../demo/settings.json');
const UIComponents = require('../components/audio-components');

document.addEventListener('DOMContentLoaded', () => {
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

  // Setup the SDK.
  const config = {};
  config.apiUrl = settings.API_URL;
  config.wsUrl = settings.API_WS_URL;
  const connection = new its.Connection(config);
  const organizationId = 'dummy';
  const organizationName = 'dummy';
  const studentId = 'dummy';
  const studentName = 'dummy';
  const recognitionHint = 'Transportation on four wheels for many people.';
  const recognitionChoices = ['bike', 'bus', 'car'];

  const tenantId = settings.API_TENANT_ID;
  const principal = settings.API_PRINCIPAL;
  const credentials = settings.API_CREDENTIALS;

  // Set the prompt on the .html page.
  document.getElementById('recognitionPrompt').innerText = recognitionHint;

  //Set the choices on the HTML page.
  recognitionChoices.forEach(choice => {
    const node = document.createElement('li');
    node.innerText = choice;
    document.getElementById('recognitionChoices').appendChild(node);
  });

  // Request microphone access.
  recorder.requestUserMedia();

  // Represent the existing entities in the database for clarity.
  const existingBasicAuth = new its.BasicAuth(tenantId, principal, credentials);
  const existingOrganization = new its.Organisation(organizationId, organizationName);
  const existingStudent = new its.Student(existingOrganization.id, studentId, studentName);
  const existingRecognitionChallenge = new its.ChoiceChallenge(existingOrganization.id,
    settings.RECOGNITION_CHALLENGE_ID, recognitionHint, recognitionChoices);

  const facade = new its.AdministrativeSDK(connection);

  function startRecognitionSession() {
    const downloadUrl = document.getElementById('downloadUrl');
    downloadUrl.setAttribute('disabled', 'disabled');

    facade.startStreamingChoiceRecognition(existingRecognitionChallenge, recorder)
      .progress(() => {
        // The progress call gets used when the internal setup to receive audio is done AND when receiving the audio
        // alignment. It is advised to enable recording functionality this way.
          UIRecorder.enableRecorder();
      })
      .then(result => {
        // Disable error message. Recognition succeeded after all.
        document.getElementById('errorMsg').innerText = '';
        document.getElementById('errorMsg').classList.remove('alert');
        document.getElementById('errorMsg').classList.remove('alert-warning');

        UIRecorder.disableRecorder();
        // You can load the audio here as well.
        // player.load(result.audioUrl);

        //See if anything got recognized.
        const recognised = result.recognised;
        if (!recognised) {
          throw new Error('Nothing recognized');
        }
        document.getElementById('recognitionResult').innerHTML = 'Recognized:' + recognised;

        // Set download url.
        downloadUrl.value = result.audioUrl;
        downloadUrl.removeAttribute('disabled');

        // Start another session when done.
        startRecognitionSession();
      })
      .catch(error => {
        UIRecorder.disableRecorder();
        console.log('error', error);
        document.getElementById('errorMsg').innerText = 'Recognition Failed. Please try Again';
        document.getElementById('errorMsg').classList.add('alert');
        document.getElementById('errorMsg').classList.add('alert-warning');
        // Retry another session.
        //startRecognitionSession();
      });
  }

  connection.addEventListener('websocketOpened', () => {
    startRecognitionSession();
  });

  // Obtain a new token, assuming the role of this student.
  connection.getOauth2Token(existingBasicAuth, existingOrganization.id, existingStudent.id)
    // Connect to the websocket as this student.
    .then(() => connection.webSocketConnect())
    .catch(error => {
      console.error('errored', error);
    });
});