/* eslint-disable
 max-len
 */

const uuid = require('node-uuid');
const Player = require('./audio-components').Player;

class BaseSegmentPlayer {
  /**
   * ITSLanguage BaseSegmentPlayer capable of working with segments.
   *
   * @constructor
   * @param {object} [options] Override any of the default settings.
   *
   */
  constructor(options) {
    this.settings = Object.assign({
      // Start loading the next segment when the current segment has
      // only x seconds or less of play time remaining.
      loadNextSegment: 5,
      // For smoother playback position indication, poll for position updates
      // faster than the browser default (which is often ~250ms).
      pollFreq: 75
    }, options);

    this.players = this.settings.players;
    this.durations = this.settings.durations;
    this.origins = this.settings.origins;

    if (this.players.length === 0) {
      throw new Error(
        'Please define at least one player in list players');
    }

    // No segment selected as active.
    this.currentSegment = null;
  }

  /**
   * Set the next segment active.
   *
   * @param {number} index The segment index to activate.
   */
  _nextSegment(index) {
    if (this.currentSegment === null) {
      // By default, the first segment (0) becomes the selected
      // one to be played.
      this.currentSegment = 0;
    } else if (index === undefined) {
      this.currentSegment++;
    } else {
      this.currentSegment = index;
    }

    if (this.player) {
      // Unbind all attached handlers on the current player.
      this.player.resetEventListeners();
    }

    this.player = this.players[this.currentSegment];
    if (this.player === undefined) {
      throw new Error(
        'There are no more players, index out of bounds');
    }

    this.player.addEventListener('playing', () => {
      this._setPlaying();
    });
    this.player.addEventListener('timeupdate', () => {
      this._getNextSegmentReady();
    });
    this.player.addEventListener('canplay', () => {
      this._setPlayable();
    });
    // The `canplay` event may have been fired already when the audio
    // player was already initialised. Call _setPlayable() in that case.
    if (this.player.canPlay()) {
      this._setPlayable();
    }
    this.player.addEventListener('ended', () => {
      if (this.players.length === this.currentSegment + 1) {
        // This is the last of all segments.
        this._setNotPlaying();
        this.currentSegment = null;
        this._nextSegment();
      } else {
        // Advance into the next segment.
        this._nextSegment();
        this.player.play(0);
      }
    });
    this.player.addEventListener('pause', () => {
      this._setNotPlaying();
    });
    // // In case the event was already fired, try to update audio stats.
    // this._loadingUpdate();
    this.player.addEventListener('error', () => {
      this._setError();
    });
  }

  /**
   * Start pre-loading the next segment when the currently playing segment has
   * only x seconds or less of play time remaining.
   */
  _getNextSegmentReady() {
    const remainingSeconds = this.player.getDuration() -
      this.player.getCurrentTime();
    if (remainingSeconds <= this.settings.loadNextSegment) {
      const nextSegment = this.players[this.currentSegment + 1];
      if (nextSegment !== undefined) {
        nextSegment.preload();
      }
    }
  }

  _setPlaying() {
    console.log('Playbutton set to playing state');
    this.playtoggle.classList.add('playing');
  }

  _setNotPlaying() {
    console.log('Playbutton set to non-playing state');
    this.playtoggle.classList.remove('playing');
  }

  _setPlayable() {
    console.log('Playbutton set to a playable state');
    this.playtoggle.removeAttribute('disabled');
    if (this.dragger) {
      this.dragger.removeAttribute('disabled');
    }
  }

  _setError() {
    this._setNotPlaying();
    this.playtoggle.classList.add('error');
  }
}

class SegmentPlayer extends BaseSegmentPlayer {
  /**
   * ITSLanguage SegmentPlayer capable of working with segments.
   *
   * @constructor
   * @param {object} [options] Override any of the default settings.
   *
   */
  constructor(options) {
    // Call super constructor
    super(options);

    this.settings.players.forEach(player => {
      if (!player.stopwatch) {
        player.bindStopwatch(time => {
          this._getTimeUpdate(time * 2);
        });
      }
    });

    if (this.players.length !== this.durations.length) {
      throw new Error(
        'Lists players and durations need to be of equal length');
    }
    if (this.players.length !== this.origins.length) {
      throw new Error(
        'Lists players and origins need to be of equal length');
    }

    this.players.forEach((player, i) => {
      const duration = player.getDuration();
      if (duration) {
        this.durations[i] = duration;
      }
      if (!player.stopwatch) {
        player.bindStopwatch(this.tickCb.bind(this));
      } else {
        player.stopwatch.registerListener(this.tickCb.bind(this));
      }
    });

    this.totalDuration = 0;
    this.durations.forEach((duration, i) => {
      if (typeof duration !== 'number') {
        throw new Error(
          'All durations need to be known in advance. Segment index ' + i +
          ' has no duration specified. Either specify or make sure at ' +
          'least the metadata of the audio has been loaded already.');
      }
      this.totalDuration += duration;
      console.log('Player ', i, 'duration: ', duration, '. Total so far: ', this.totalDuration);
    });

    this._writeUI(this.settings.element);

    this._nextSegment();
  }

  /**
   * Set the next segment active.
   *
   * @param {number} index The segment index to activate.
   */
  _nextSegment(index) {
    // Call super
    super._nextSegment(index);

    this.player.addEventListener('progress', () => {
      this._loadingUpdate();
    });
    // In case the event was already fired, try to update audio stats.
    this._loadingUpdate();
  }

  /**
   * Get the current playing time for the audio.
   */
  _getTimeUpdate(time) {
    // Don't update time and position from audio when position
    // dragger is being used.
    if (!this.draggerDown) {
      this._timeUpdate(time);
      this._positionUpdate();
    }
  }

  tickCb() {
    this._getTimeUpdate();
  }

  _setPlayable() {
    // Call super
    super._setPlayable();

    this.dragger.removeAttribute('disabled');
  }

  /**
   * Appends the player GUI to the DOM.
   *
   * @param {ui} ui The DOM element to append GUI to.
   */
  _writeUI(ui) {
    ui.appendChild(this._getUI());

    const id = this.playerId;
    this.playtoggle = document.getElementById(id + 'playtoggle');
    this.range = document.getElementById(id + 'range');
    this.loading = document.getElementById(id + 'loading');
    this.dragger = document.getElementById(id + 'dragger');
    this.timeindication = document.getElementById(id + 'timeindication');

    this.playtoggle.onclick = () => {
      this.player.togglePlayback();
    };

    const self = this;
    function onDrag(globalPct) {
      // Update the playing time as it would be playing once the user
      // would release the dragger.
      self._timeUpdate(globalPct);
      self._updatePositionIndication(globalPct);
    }

    function onDragEnd(globalPct) {
      // Start playing audio at the new position now the dragger has
      // been released.
      const object = self._fromGlobalPercentage(globalPct);
      const pct = object[0];
      const segmentIndex = object[1];
      const wasPlaying = self.player.isPlaying();
      if (segmentIndex !== self.currentSegment) {
        // Scrubbed to another segment.
        // Stop playing (if we were).
        self.player.stop();
        // Load new segment.
        self._nextSegment(segmentIndex);
      }
      self.player.scrub(pct);
      // Start playback in the new segment if audio was playing in the
      // previous segment.
      if (wasPlaying) {
        self.player.play();
      }
    }

    this._applyRangeSlider(this.range, this.dragger, onDrag, onDragEnd);
  }

  /**
   * Calculate local Audio completion percentage from global segments percentage.
   *
   * @param {number} pct The completion percentage (1..100) of all audio stream segments combined.
   * @returns {Array} The completion percentage (1..100) in an audio stream segment as first element in the array. When
   *   the position stays within the currently loaded segment, this Audio segment index is provided as second element.
   */
  _fromGlobalPercentage(pct) {
    let secondsInGlobal = this.totalDuration * pct / 100;
    let localPct = null;
    let segmentIndex = null;
    this.durations.some((duration, i) => {
      if (secondsInGlobal > duration) {
        // Not scrubbed in this segment.
        secondsInGlobal -= duration;
      } else {
        // Scrubbing within this segment.
        segmentIndex = i;
        localPct = secondsInGlobal / duration * 100;
        // Exit the loop
        return true;
      }
    });
    console.log('Scrubbing to ' + localPct + '% of segment index: ' +
      segmentIndex);
    return [localPct, segmentIndex];
  }

  /**
   * Update the loading bar to reflect the actual buffer fill.
   */
  _loadingUpdate() {
    const loaded = this.player.getBufferFill();
    this.loading.style.width = loaded + '%';
  }

  /**
   * Defines the player GUI.
   * Hint: ideal for overriding in a subclass.
   *
   */
  _getUI() {
    const id = this.playerId = uuid.v4();

    const self = this;

    const player = document.createElement('p');
    player.className = 'itslanguage-player';

    const playButton = document.createElement('button');
    playButton.id = id + 'playtoggle';
    playButton.className = 'itslanguage-playToggle';
    playButton.disabled = true;

    const playIcon = document.createElement('div');
    playIcon.className = 'itslanguage-icon';

    const range = document.createElement('span');
    range.id = id + 'range';
    range.className = 'itslanguage-gutter';

    const dragger = document.createElement('button');
    dragger.id = id + 'dragger';
    dragger.className = 'itslanguage-handle';
    dragger.disabled = true;

    const timeindication = document.createElement('span');
    timeindication.id = id + 'timeindication';
    timeindication.className = 'itslanguage-timeindication';

    range.appendChild(dragger);

    playButton.appendChild(playIcon);

    player.appendChild(playButton);
    player.appendChild(range);
    player.appendChild(timeindication);

    this.durations.forEach((duration, i) => {
      const pct = duration * 100 / self.totalDuration;
      const segment = document.createElement('span');
      segment.id = id + 'segment';
      segment.className = 'segment ' + this.origins[i];
      segment.style.width = pct + '%';

      const loading = document.createElement('span');
      loading.id = id + 'loading';
      loading.className = 'loading ' + this.origins[i];
      loading.style.width = 0;

      segment.appendChild(loading);
      range.appendChild(segment);
    });

    return player;
  }

  /**
   * Calculate global time position from a segments' position.
   *
   * @param {number} seconds An amount of seconds related to one audio stream segment.
   * @returns {number} The position in seconds on the whole duration of all audio stream segments combined.
   */
  _toGlobalSeconds(seconds) {
    let secondsInGlobal = seconds;
    for (let i = 0; i < this.currentSegment; i++) {
      secondsInGlobal += this.durations[i];
    }
    return secondsInGlobal;
  }

  /**
   * Calculates the new time indication relative to the duration of all segments, based on the current audio position.
   *
   * Also update the GUI with this new time indication.
   *
   * @param {number} [pct] Audio completion percentage to use for time indication, overriding the actual audio playing
   *   time.
   */
  _timeUpdate(pct) {
    let past = null;
    if (pct !== undefined) {
      // Display time while seeking, not currentTime in audio.
      past = this.totalDuration * pct / 100;
    } else {
      past = this._toGlobalSeconds(this.player.getCurrentTime());
    }
    const text = this._timerText(past) + ' / ' + this._timerText(this.totalDuration);
    this._updateTimeIndication(text);
  }

  /**
   * Calculates the new position indication based on the current audio
   * position.
   * Also update the GUI with this new position indication.
   */
  _positionUpdate() {
    const pct = this.player.getCurrentTime() * 100 / this.player.getDuration();

    const globalPct = this._toGlobalPercentage(pct);
    console.debug('Updating positionIndication to: ', globalPct, '% (In segment: ', pct, '%)');

    this._updatePositionIndication(globalPct);
  }

  /**
   * Update the time indication
   *
   * @param {string} text The time to show.
   */
  _updateTimeIndication(text) {
    this.timeindication.innerHTML = text;
  }

  /**
   * Calculate global percentage from a segments percentage.
   *
   * @param {number} pct The completion percentage (1..100) of one audio stream segment.
   * @returns {number} The completion percentage (1..100) of all audio stream segments combined.
   */
  _toGlobalPercentage(pct) {
    let secondsInGlobal = this.player.getDuration() * pct / 100;
    for (let i = 0; i < this.currentSegment; i++) {
      secondsInGlobal += this.durations[i];
    }
    return secondsInGlobal / this.totalDuration * 100;
  }
}

/**
 * Handle user interaction with dragger element.
 *
 * @param {object} range The range element over which the dragger is dragged.
 * @param {object} dragger The dragger element which the user can grab.
 * @param {callback} onDrag Called while dragging.
 * @param {callback} onDragEnd Called when dragging action completed.
 */
SegmentPlayer.prototype._applyRangeSlider = Player.prototype._applyRangeSlider;

/**
 * Return a formatted time given a high precision second count.
 *
 * @param {number} [seconds] Any number of seconds. Use float for high accuracy output.
 * @returns A duration in the form of mm:ss.nn (minutes, seconds, milliseconds).
 */
SegmentPlayer.prototype._timerText = Player._timerText;

/**
 * Update the dragger position.
 *
 * @param {number} pct The completed percentage (1..100) of all audio stream segments combined.
 */
SegmentPlayer.prototype._updatePositionIndication = Player.prototype._updatePositionIndication;

class MiniSegmentPlayer extends BaseSegmentPlayer {
  /**
   * ITSLanguage MiniSegmentPlayer capable of working with segments without showing the scrubber.
   *
   * @constructor
   * @param {object} [options] Override any of the default settings.
   *
   */
  constructor(options) {
    // Call super constructor
    super(options);

    this._writeUI(this.settings.element);
    this._nextSegment();
  }

  /**
   * Defines the miniplayer GUI.
   *
   */
  _getUI() {
    const id = this.playerId = uuid.v4();

    const player = document.createElement('p');
    player.className = 'itslanguage-player';

    const playButton = document.createElement('button');
    playButton.id = id + 'playtoggle';
    playButton.className = 'itslanguage-playToggle';
    playButton.disabled = true;

    const playIcon = document.createElement('div');
    playIcon.className = 'itslanguage-icon';

    playButton.appendChild(playIcon);

    player.appendChild(playButton);

    return player;
  }

  /**
   * Appends the player GUI to the DOM.
   *
   * @param {ui} ui The DOM element to append GUI to.
   */
  _writeUI(ui) {
    ui.appendChild(this._getUI());

    const id = this.playerId;
    this.playtoggle = document.getElementById(id + 'playtoggle');

    this.playtoggle.onclick = () => {
      this.player.togglePlayback();
    };
  }
}

module.exports = {
  BaseSegmentPlayer,
  MiniSegmentPlayer,
  SegmentPlayer
};
