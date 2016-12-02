/* global
WaveSurfer
 */

/**
 * This is a demo showcasing the different styles of every homebuilt player.
 */
require('./index.html');
require('../css/demo.css');
const its = require('itslanguage');
const UIComponents = require('../components/audio-components');
const SegmentComponents = require('../components/audio-components-segmentplayer');

// Default audio player with no audio loaded. Shows a disabled state.
const defaultAudioPlayer = new its.AudioPlayer();

document.addEventListener('DOMContentLoaded', () => {
  const container0 = document.getElementById('player0');

  new UIComponents.Player({
    element: container0,
    player: defaultAudioPlayer
  });
});

// Default audio player with a pre-generated Wave file as content.
// By definition, it's preloaded.
const generatedAudioPlayer = new its.AudioPlayer();
const sample = its.generateWaveSample(2);
generatedAudioPlayer.load(sample);

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('player');

  new UIComponents.Player({
    element: container,
    player: generatedAudioPlayer
  });
});

// Default audio player with an invalid URL.
// Shows an error state.
const invalidURLAudioPlayer = new its.AudioPlayer();
let url = 'https:// example.com/non_existing.mp3';
invalidURLAudioPlayer.load(url, true);

document.addEventListener('DOMContentLoaded', () => {
  const container1 = document.getElementById('player1');

  new UIComponents.Player({
    element: container1,
    player: invalidURLAudioPlayer
  });
});

// Default audio player with an external Ogg/Opus file as content.
// This player has a reset button to unload audio.
// This player has a load button to force the loading of the audio from the url.
// Preloading is disabled.
const oggOpusAudioPlayer = new its.AudioPlayer();
// Audio from: http://www.opus-codec.org/examples/
const url2 = 'https://people.xiph.org/~giles/2012/opus/ehren-paper_lights-96.opus';
oggOpusAudioPlayer.addEventListener('canplay', () => {
  console.log('ogg canplay event');
});
oggOpusAudioPlayer.load(url2, false);

document.addEventListener('DOMContentLoaded', () => {
  const container2 = document.getElementById('player2');

  new UIComponents.Player({
    element: container2,
    player: oggOpusAudioPlayer
  });
});
const reset2 = document.getElementById('player2reset');
reset2.addEventListener('click', () => {
  oggOpusAudioPlayer.reset();
});
const load2 = document.getElementById('player2load');
load2.addEventListener('click', () => {
  oggOpusAudioPlayer.load(url2, false);
});

// Mini audio player with an external Wav file as content.
// Preloading is enabled by default.
// This player has a reset button to unload audio.
const miniAudioPlayer = new its.AudioPlayer();
// Audio from: http://www.opus-codec.org/examples/
url = 'http://www.opus-codec.org/examples/samples/speech_orig.wav';
miniAudioPlayer.load(url);
document.addEventListener('DOMContentLoaded', () => {
  const container3 = document.getElementById('player3');

  new UIComponents.MiniPlayer({
    element: container3,
    player: miniAudioPlayer
  });

  // Default audio player that is connected to the same audio
  // source as the above mini audio player.
  // Any amount of players can be synced to one audio source.
  const container4 = document.getElementById('player4');

  new UIComponents.Player({
    element: container4,
    player: miniAudioPlayer
  });
});

const reset3 = document.getElementById('player3reset');
reset3.addEventListener('click', () => {
  miniAudioPlayer.reset();
});

// This in-browser generated segment has duration available from the start.
const audio5Seg2 = new its.AudioPlayer();
audio5Seg2.load(its.generateWaveSample(2));

// This segment has no duration available, as preloading is disabled.
// The duration (in seconds) has been manually defined while instantiating
// the SegmentPlayer later on.
const audio5Seg3 = new its.AudioPlayer();
url = 'https://people.xiph.org/~giles/2012/opus/detodos.opus';
audio5Seg3.load(url, false);

// Wait on the availability of duration metadata before instantiating the
// SegmentPlayer.
const audio5Seg1 = new its.AudioPlayer();
url = 'http://www.opus-codec.org/examples/samples/speech_orig.wav';
audio5Seg1.load(url, true, () => {
  // Duration of the first audio segment is now fetched.
  const container5 = document.getElementById('player5');

  new SegmentComponents.SegmentPlayer({
    element: container5,
    players: [audio5Seg1, audio5Seg2, audio5Seg3],
    durations: [null, null, 2.92],
    origins: ['model', 'user', 'model']
  });
});

const audio6Seg2 = new its.AudioPlayer();
audio6Seg2.load(its.generateWaveSample(2));
const audio6Seg1 = new its.AudioPlayer();
// Wait on the availability of duration metadata before instantiating the
// MiniSegmentPlayer.
audio6Seg1.load(its.generateWaveSample(2),
  true, () => {
    const container6 = document.getElementById('player6');

    new SegmentComponents.MiniSegmentPlayer({
      element: container6,
      players: [audio6Seg1, audio6Seg2],
      durations: [null, null],
      origins: ['model', 'user']
    });
  });

const audio7Seg1Url = 'http://www.opus-codec.org/examples/samples/speech_32kbps_fb.wav';
const audio7Seg2Url = 'http://www.opus-codec.org/examples/samples/speech_8kbps_nb.wav';
// The audio files are set, but specifically not (pre)loaded.
// No metadata is needed when the scrubber doesn't need to be shown.
const audio7Seg1 = new its.AudioPlayer();
audio7Seg1.load(audio7Seg1Url, false);
const audio7Seg2 = new its.AudioPlayer();
audio7Seg2.load(audio7Seg2Url, false);
document.addEventListener('DOMContentLoaded', () => {
  const container7 = document.getElementById('player7');

  new SegmentComponents.MiniSegmentPlayer({
    element: container7,
    players: [audio7Seg1, audio7Seg2]
  });
});

// Create a non-GUI audio recorder object.
const rec = new its.AudioRecorder();
// Create the GUI audio recorder GUI and connect it to the recording
// component. Also, instantiate an AudioPlayer that can be used
// to playback any recorded audio.
// To allow loosely coupled objects, the dependency injection pattern
// is used here.
document.addEventListener('DOMContentLoaded', () => {
  const recorder = document.getElementById('recorder');
  new UIComponents.Recorder({
    element: recorder,
    recorder: rec,
    player: new its.AudioPlayer()
  });
});

// For the volume meter to work, we need an input stream. Request it.
rec.requestUserMedia();

// Whenever the user presses the record button and presses it again to
// stop recording, a recorded Audio Blob is returned.
rec.addEventListener('recorded', (id, blob, forced) => {
  console.info(
    'Recording stop was forced due to maxRecordingDuration: ' + forced);
});

// To keep track of recording sessions, you may start a new session after
// each recording. It also takes your custom ids.
rec.startRecordingSession();

 // Create a second audio recorder.
document.addEventListener('DOMContentLoaded', () => {
  const recorder2 = document.getElementById('recorder2');

  new UIComponents.Recorder({
    element: recorder2,
    recorder: rec,
    player: new its.AudioPlayer()
  });
});

// You can even link the audio and player to a third party audio visualizer!
// Just listen to the stop and start events and it will work!
const generatedAudio = its.generateWaveSample(5);
const waveSurferPlayer = new its.AudioPlayer();

document.addEventListener('DOMContentLoaded', () => {
  const waveSurferPlayerElement = document.getElementById('waveformplayer');
  console.log(waveSurferPlayerElement);
  new UIComponents.MiniPlayer({
    element: waveSurferPlayerElement,
    player: waveSurferPlayer
  });
  const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#D0F6F9',
    progressColor: '#24CBD8',
    hideScrollbar: true
  });

  wavesurfer.toggleMute();

  waveSurferPlayer.addEventListener('playing', () => {
    wavesurfer.play();
  });

  waveSurferPlayer.addEventListener('playbackstopped', () => {
    wavesurfer.pause();
  });

  waveSurferPlayer.load(generatedAudio);
  wavesurfer.load(generatedAudio);
});
