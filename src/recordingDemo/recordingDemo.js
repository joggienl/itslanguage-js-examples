/* eslint-disable
 no-unused-vars
 */

/**
 * This is a demo showcasing the recording and playback functionality of the SDK. The recorder and player UI elements
 * are created in dedicated .js files. You too can create your own view of those elements. Read the documentation on
 * the GitHub page on the requirements.
 *
 * For this demo the following Tenant, BasicAuth, Organization, Student and SpeechChallenge have been created in
 * the pilot environment:
 * If you do not know what those are, read the API docs.
 * If you want to see how you add those entities yourself, follow the relevant examples.
 *
 * Tenant:
 * - id:          pilot
 * - name:        pilot
 *
 * BasicAuth:
 * - tenantId:    pilot
 * - principal:   pilot
 * - credentials: secret
 *
 * Organization:
 * - id:          dummy
 * - name:        dummy
 *
 * Student:
 * - id:          dummy
 * - firstName:   dummy
 *
 * SpeechChallenge:
 * - id: recording
 */

require('../css/demo.css');
const its = require('itslanguage');
const settings = require('../demo/settings.json');
const UIComponents = require('../components/audio-components');
const SegmentPlayer = require('../components/audio-components-segmentplayer');
const generateWaveSample = require('itslanguage/audio-tools');

document.addEventListener('DOMContentLoaded', () => {
  // Create the audio players and recorders.
  const player = new its.AudioPlayer();
  const player2 = new its.AudioPlayer();
  const recorder = new its.AudioRecorder({forceWave: true});

  // Load one auto generated wave file.
  player2.load(generateWaveSample.generateWaveSample(2));

  // Once the recorder has finished recording, load the blob file into the player.
  // Loading an audio file can also be done in the result handler of the .StartStreamingSpeechRecording method.
  recorder.addEventListener('recorded', (id, blob) => {
    // Load the audio and use the callback when the audio is loaded in.
    player.load(URL.createObjectURL(blob), null, sound => {
      // Create a SegmentPlayer capable of playing multiple audio files in one player.
      new SegmentPlayer.SegmentPlayer({
        element: document.getElementById('segmentplayer'),
        players: [player, player2],
        origins: [document.getElementById('player'), player2],
        durations: [sound.duration, player2.getDuration()]
      });
    });
  });

  // Create the UI elements linked with the ITSLanguage players and recorders.
  const UIRecorder = new UIComponents.Recorder({
    element: document.getElementById('recorder'),
    recorder
  });

  //Disable the recorder so no audio can be sent before the system is not ready.
  UIRecorder.disableRecorder();

  new UIComponents.Player({
    element: document.getElementById('player'),
    player
  });

  new UIComponents.Player({
    element: document.getElementById('player2'),
    player: player2
  });

  // Setup the SDK.
  const config = {};
  config.apiUrl = settings.API_URL;
  config.wsUrl = settings.API_WS_URL;
  const connection = new its.Connection(config);

  const tenantId = settings.API_TENANT_ID;
  const principal = settings.API_PRINCIPAL;
  const credentials = settings.API_CREDENTIALS;
  const organizationId = 'dummy';
  const organizationName = 'dummy';
  const studentId = 'dummy';
  const studentName = 'dummy';

  // Request microphone access.
  recorder.requestUserMedia();

  // Represent the existing entities in the database for clarity.
  const existingTenant = new its.Tenant(tenantId, tenantId);
  const existingBasicAuth = new its.BasicAuth(existingTenant.id, principal, credentials);
  const existingOrganization = new its.Organisation(organizationId, organizationName);
  const existingStudent = new its.Student(existingOrganization.id, studentId, studentName);
  const existingRecordingChallenge = new its.SpeechChallenge(existingOrganization.id, settings.RECORDING_CHALLENGE_ID,
    'dummy');

  const speechRecordingController = new its.SpeechRecordingController(connection);

  function startRecordingSession() {
    speechRecordingController.startStreamingSpeechRecording(existingRecordingChallenge, recorder)
      .progress(() => {
        // The progress call gets used when the internal setup to receive audio is done. It is advised to enable
        // recording functionality this way.
        UIRecorder.enableRecorder();
      })
      .then(result => {
        // You can load the audio here as well.

        // player.load(result.audioUrl);

        // Start another session when done.
        startRecordingSession();
      })
      .catch(error => {
        console.error('errored', error);
      });
  }

  connection.addEventListener('websocketOpened', () => {
    startRecordingSession();
  });

  connection.getOauth2Token(existingBasicAuth)
    // Obtain an OAuth2 Token, assuming the role of this student.
    .then(() => connection.getOauth2Token(existingBasicAuth, existingOrganization.id, existingStudent.id))
    // Connect to the websocket as this student.
    .then(() => connection.webSocketConnect())
    .catch(error => {
      console.error('errored', error);
    });
});
