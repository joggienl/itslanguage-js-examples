'use strict';

/* eslint-disable
 no-unused-vars
 */

/* global
 document,
 */

(function() {
  var its = require('itslanguage');
  var components = require('./../components/audio-components');
  var segmentcomponents = require('./../components/audio-components-segmentplayer');

  /*
   * This is demo code performing several audio SDK operations.
   */

  // Default audio player with no audio loaded. Shows a disabled state.
  var audio0 = new its.AudioPlayer();

  document.addEventListener('DOMContentLoaded', function() {
    var container0 = document.getElementById('player0');

    new components.Player({
      element: container0,
      player: audio0
    });
  });

  // Default audio player with a pre-generated Wave file as content.
  // By definition, it's preloaded.
  var audio = new its.AudioPlayer();
  var sample = its.AudioTools.generateWaveSample(2);
  audio.load(sample);

  document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('player');

    new components.Player({
      element: container,
      player: audio
    });
  });

  // Default audio player with an invalid URL.
  var audio1 = new its.AudioPlayer();
  var url = 'https:// example.com/non_existing.mp3';
  audio1.load(url, true);

  document.addEventListener('DOMContentLoaded', function() {
    var container1 = document.getElementById('player1');

    new components.Player({
      element: container1,
      player: audio1
    });
  });

  // Default audio player with an external Ogg/Opus file as content.
  // Preloading is disabled.
  var audio2 = new its.AudioPlayer();
  // Audio from: http://www.opus-codec.org/examples/
  var url2 = 'https://people.xiph.org/~giles/2012/opus/ehren-paper_lights-96.opus';
  audio2.load(url2, false);

  document.addEventListener('DOMContentLoaded', function() {
    var container2 = document.getElementById('player2');

    new components.Player({
      element: container2,
      player: audio2
    });
  });

  var reset2 = document.getElementById('player2reset');
  reset2.addEventListener('click', function() {
    audio2.reset();
  });

  var load2 = document.getElementById('player2load');
  load2.addEventListener('click', function() {
    audio2.load(url2, false);
  });

  // Mini audio player with an external Wav file as content.
  // Preloading is enabled by default.
  var audio3 = new its.AudioPlayer();
  // Audio from: http://www.opus-codec.org/examples/
  url = 'http://www.opus-codec.org/examples/samples/speech_orig.wav';
  audio3.load(url);

  document.addEventListener('DOMContentLoaded', function() {
    var container3 = document.getElementById('player3');

    new components.MiniPlayer({
      element: container3,
      player: audio3
    });

    // Default audio player that is connected to the same audio
    // source as the above mini audio player.
    // Any amount of GUIs are synced to one audio source.
    var container4 = document.getElementById('player4');

    new components.Player({
      element: container4,
      player: audio3
    });
  });

  var reset3 = document.getElementById('player3reset');
  reset3.addEventListener('click', function() {
    audio3.reset();
  });

  // This in-browser generated segment has duration available from the start.
  var audio5Seg2 = new its.AudioPlayer();
  audio5Seg2.load(its.AudioTools.generateWaveSample(2));

  // This segment has no duration available, as preloading is disabled.
  // The duration (in seconds) has been manually defined while instantiating
  // the SegmentPlayer later on.
  var audio5Seg3 = new its.AudioPlayer();
  url = 'https://people.xiph.org/~giles/2012/opus/detodos.opus';
  audio5Seg3.load(url, false);

  // Wait on the availability of duration metadata before instantiating the
  // SegmentPlayer.
  var audio5Seg1 = new its.AudioPlayer();
  url = 'http://www.opus-codec.org/examples/samples/speech_orig.wav';
  audio5Seg1.load(url, true, function() {
    // Duration of the first audio segment is now fetched.
    var container5 = document.getElementById('player5');

    var segPlayer = new segmentcomponents.SegmentPlayer({
      element: container5,
      players: [audio5Seg1, audio5Seg2, audio5Seg3],
      durations: [null, null, 2.92],
      origins: ['model', 'user', 'model']
    });

    segPlayer.addEventListener('pause', function() {
      console.log('Paused');
    });
    segPlayer.addEventListener('ended', function() {
      console.log('Last segment ended');
    });
  });

  var audio6Seg2 = new its.AudioPlayer();
  audio6Seg2.load(its.AudioTools.generateWaveSample(2));
  var audio6Seg1 = new its.AudioPlayer();
  // Wait on the availability of duration metadata before instantiating the
  // MiniSegmentPlayer.
  audio6Seg1.load(its.AudioTools.generateWaveSample(2),
    true, function() {
      var container6 = document.getElementById('player6');

      new segmentcomponents.MiniSegmentPlayer({
        element: container6,
        players: [audio6Seg1, audio6Seg2],
        durations: [null, null],
        origins: ['model', 'user']
      });
    });

  var audio7Seg1Url = 'http://www.opus-codec.org/examples/samples/speech_32kbps_fb.wav';

  var audio7Seg2Url = 'http://www.opus-codec.org/examples/samples/speech_8kbps_nb.wav';

  // The audio files are set, but specifically not (pre)loaded.
  // No metadata is needed when the scrubber doesn't need to be shown.
  var audio7Seg1 = new its.AudioPlayer();
  audio7Seg1.load(audio7Seg1Url, false);
  var audio7Seg2 = new its.AudioPlayer();
  audio7Seg2.load(audio7Seg2Url, false);
  document.addEventListener('DOMContentLoaded', function() {
    var container7 = document.getElementById('player7');

    new segmentcomponents.MiniSegmentPlayer({
      element: container7,
      players: [audio7Seg1, audio7Seg2]
    });
  });

  // Default audio recorder.
  var recorderUI = null;

  // Create a non-GUI audio recorder object.
  var rec = new its.AudioRecorder();
  // Create the GUI audio recorder GUI and connect it to the recording
  // component. Also, instantiate an AudioPlayer that can be used
  // to playback any recorded audio.
  // To allow loosely coupled objects, the dependency injection pattern
  // is used here.
  document.addEventListener('DOMContentLoaded', function() {
    var recorder = document.getElementById('recorder');
    recorderUI = new components.Recorder({
      element: recorder,
      recorder: rec,
      player: new its.AudioPlayer()
    });
  });

  // For the volume meter to work, we need an input stream. Request it.
  rec.requestUserMedia();

  // When user has provided permission to use the microphone, the 'ready'
  // event is triggered. At that time, create a VolumeMeter that is in
  // turn attached to the recorder GUI component.
  // This brings the GUI volume meter inside the audio recorder to life.
  var volumeMeter = null;
  rec.addEventListener('ready', function(audioContext, inputStream) {
    volumeMeter = new its.AudioTools.VolumeMeter(
      audioContext, inputStream);
    recorderUI.attachVolumeMeter(volumeMeter);
  });

  // Whenever the user presses the record button and presses it again to
  // stop recording, a recorded Audio Blob is returned.
  rec.addEventListener('recorded', function(id, blob, forced) {
    console.info(
      'Recording stop was forced due to maxRecordingDuration: ' + forced);
  });

  // To keep track of recording sessions, you may start a new session after
  // each recording. It also takes your custom ids.
  rec.startRecordingSession();

  /*
   // Create a second audio recorder.
   document.addEventListener('DOMContentLoaded', function(event) {
   var recorder2 = document.getElementById('recorder2');

   var recorderUI2 = new its.UIComponents.Recorder({
   element: recorder2,
   recorder: rec,
   player: new its.AudioPlayer()
   });


   // Share the volumeMeter.
   rec.addEventListener('ready', function(audioContext, inputStream) {
   recorderUI2.attachVolumeMeter(volumeMeter);
   });
   });
   */
}());
