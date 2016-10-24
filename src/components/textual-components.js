require('./textual-components.css');


class ColouredSentence {
  /**
   * ITSLanguage ColouredSentence capable of working with segments.
   *
   * @constructor
   * @param {object} [options] Override any of the default settings.
   *
   */
  constructor(options) {
    this.settings = Object.assign({}, options);
  }

  /**
   * Show a coloured sentence.
   *
   * @param {its.Word[][]} words The spoken sentence, split in graphemes per word.
   */
  show(words) {
    // Empty the element, in case any previous sentences were shown.
    this.settings.element.innerHTML = '';
    for (const word of words) {
      for (const chunk of word.chunks) {
        const newElement = document.createElement('span');
        newElement.innerHTML = chunk.graphemes;
        if (chunk.verdict === 'good') {
          newElement.className = 'good';
        } else if (chunk.verdict === 'moderate') {
          newElement.className = 'moderate';
        } else if (chunk.verdict === 'bad') {
          newElement.className = 'bad';
        } else {
          newElement.className = 'punctuation';
        }
        for (const phoneme of chunk.phonemes) {
          newElement.setAttribute('title', phoneme.confidenceScore);
        }
        this.settings.element.appendChild(newElement);
      }
      const newElement = document.createElement('span');
      newElement.innerHTML = ' ';
      this.settings.element.appendChild(newElement);
    }
  }

  /**
   * Reset a coloured sentence to its neutral state.
   */
  reset() {
    // Get a collection of DOM elements as NodeList.
    const spans = this.settings.element.querySelectorAll('span');
    // Remove all markup classes.
    for (const span of spans) {
      span.classList.remove('good');
      span.classList.remove('moderate');
      span.classList.remove('bad');
      span.classList.remove('punctuation');
    }
  }
}

class DetailedScores {
  /**
   * ITSLanguage DetailedScores capable of working with segments.
   *
   * @constructor
   * @param {object} [options] Override any of the default settings.
   *
   */
  constructor(options) {
    this.settings = Object.assign({}, options);
  }

  /**
   * Set 'good' pronunciation of a phoneme threshold value.
   *
   * @param {Integer} threshold The threshold value.
   */
  setThresholdGood(threshold) {
    this.settings.thresholdGood = threshold;
  }

  /**
   * Set 'bad' pronunciation of a phoneme threshold value.
   *
   * @param {Integer} threshold The threshold value.
   */
  setThresholdBad(threshold) {
    this.settings.thresholdBad = threshold;
  }

  /**
   * Show a detailed score per phoneme.
   *
   * @param {its.Word[][]} words The spoken sentence, split in graphemes per word.
   */
  show(words, refWords) {
    // Empty the element, in case any previous sentences were shown.
    this.settings.element.innerHTML = '';
    const table = document.createElement('table');

    // Assemble header
    let row = document.createElement('tr');
    let column1 = document.createElement('th');
    column1.innerText = 'Grapheme (IPA)';
    row.appendChild(column1);
    let column2 = document.createElement('th');
    column2.innerText = 'Confidence Score';
    row.appendChild(column2);
    let column3 = document.createElement('th');
    column3.innerText = 'Duration';
    row.appendChild(column3);
    table.appendChild(row);

    let lastEnd = 0;
    words.forEach((word, i) => {
      word.chunks.forEach((chunk, j) => {
        chunk.phonemes.forEach((phoneme, k) => {
          const refPhoneme = refWords[i].chunks[j].phonemes[k];
          const refDuration = refPhoneme.end - refPhoneme.start;

          // Insert silence
          if (lastEnd !== phoneme.start) {
            row = document.createElement('tr');
            column1 = document.createElement('td');
            column1.innerHTML = '(sil)';
            row.appendChild(column1);
            column2 = document.createElement('td');
            row.appendChild(column2);
            column3 = document.createElement('td');
            const silDuration = phoneme.start - lastEnd;
            column3.innerHTML = `${silDuration.toFixed(2)}s (ref ${refDuration.toFixed(2)}s)`;
            row.appendChild(column3);
            table.appendChild(row);
          }

          row = document.createElement('tr');
          column1 = document.createElement('td');
          column1.innerHTML = chunk.graphemes + '(' + phoneme.ipa + ')';
          if (this.settings.thresholdGood && this.settings.thresholdBad) {
            if (phoneme.confidenceScore >= this.settings.thresholdGood) {
              column1.classList.add('good');
            } else if (phoneme.confidenceScore <= this.settings.thresholdBad) {
              column1.classList.add('bad');
            } else {
              column1.classList.add('moderate');
            }
          }
          row.appendChild(column1);
          column2 = document.createElement('td');
          column2.innerHTML = phoneme.confidenceScore;
          row.appendChild(column2);
          column3 = document.createElement('td');
          const duration = phoneme.end - phoneme.start;
          column3.innerHTML = `${duration.toFixed(2)}s (ref ${refDuration.toFixed(2)}s)`;
          row.appendChild(column3);
          table.appendChild(row);

          lastEnd = phoneme.end;
        });
      });
    });
    this.settings.element.appendChild(table);
  }

  /**
   * Reset the table to its neutral state.
   */
  reset() {
    this.settings.element.innerHTML = '';
  }
}

module.exports = {
  ColouredSentence,
  DetailedScores
};
