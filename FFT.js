
onmessage = function analyzeFrequenciesOverTime({data: {channelDataBuffer, fftSize}}) {
  const channelData = new Float32Array(channelDataBuffer);
  const fft = new FFT(fftSize);
  const freqData = []
  let currentOffset = 0;
  while (currentOffset + fftSize < channelData.length) {
    const segment = channelData.slice(
      currentOffset,
      currentOffset + fftSize
    );
    const spectrum = fft.calculateSpectrum(segment);
    const array = new Uint8Array(fftSize / 2);
    for (let j = 0; j < fftSize / 2; j++) {
      array[j] = Math.max(-255, (Math.log(spectrum[j]) * Math.LOG10E) * 45);
    }
    const segmentNumber = ((currentOffset + fftSize) / fftSize) - 1;
    freqData[segmentNumber] = array;

    currentOffset += fftSize;
  }
  postMessage(freqData);
}

/**
 * Calculate FFT - Based on https://github.com/katspaugh/wavesurfer.js/blob/5.2.0/src/plugin/spectrogram/fft.js
 *                 but whittled down to just use Hann window function, which is the default for wavesurfer:
 *                 https://github.com/katspaugh/wavesurfer.js/blob/d6d4638eba7a2c08c3415d24f22259893519d604/src/plugin/spectrogram.js#L228
 */
class FFT {
  constructor(fftSize) {
    let i;
    this.bufferSize = fftSize;

    this.sinTable = new Float32Array(this.bufferSize);
    this.cosTable = new Float32Array(this.bufferSize);
    this.windowValues = new Float32Array(this.bufferSize);
    this.reverseTable = new Uint32Array(this.bufferSize);

    this.peak = 0;

    // Hann window function
    for (i = 0; i < this.bufferSize; i++) {
      this.windowValues[i] =
        0.5 * (1 - Math.cos((Math.PI * 2 * i) / (this.bufferSize - 1)));
    }

    let limit = 1;
    let bit = this.bufferSize >> 1;

    while (limit < this.bufferSize) {
      for (i = 0; i < limit; i++) {
        this.reverseTable[i + limit] = this.reverseTable[i] + bit;
      }

      limit = limit << 1;
      bit = bit >> 1;
    }

    for (i = 0; i < this.bufferSize; i++) {
      this.sinTable[i] = Math.sin(-Math.PI / i);
      this.cosTable[i] = Math.cos(-Math.PI / i);
    }

  }

  calculateSpectrum(segment) {
    let i;

    // Locally scope variables for speed up
    let bufferSize = this.bufferSize,
      cosTable = this.cosTable,
      sinTable = this.sinTable,
      reverseTable = this.reverseTable,
      real = new Float32Array(bufferSize),
      imag = new Float32Array(bufferSize),
      bSi = 2 / this.bufferSize,
      sqrt = Math.sqrt,
      rval,
      ival,
      mag,
      spectrum = new Float32Array(bufferSize / 2);

    const k = Math.floor(Math.log(bufferSize) / Math.LN2);

    if (Math.pow(2, k) !== bufferSize) {
      throw 'Invalid buffer size, must be a power of 2.';
    }
    if (bufferSize !== segment.length) {
      throw 'Supplied segment is not the same size as defined FFT. FFT Size: ' + bufferSize;
    }

    let halfSize = 1,
      phaseShiftStepReal,
      phaseShiftStepImag,
      currentPhaseShiftReal,
      currentPhaseShiftImag,
      off,
      tr,
      ti,
      tmpReal;

    for (i = 0; i < bufferSize; i++) {
      real[i] =
        segment[reverseTable[i]] * this.windowValues[reverseTable[i]];
      imag[i] = 0;
    }

    while (halfSize < bufferSize) {
      phaseShiftStepReal = cosTable[halfSize];
      phaseShiftStepImag = sinTable[halfSize];

      currentPhaseShiftReal = 1;
      currentPhaseShiftImag = 0;

      for (let fftStep = 0; fftStep < halfSize; fftStep++) {
        i = fftStep;

        while (i < bufferSize) {
          off = i + halfSize;
          tr =
            currentPhaseShiftReal * real[off] -
            currentPhaseShiftImag * imag[off];
          ti =
            currentPhaseShiftReal * imag[off] +
            currentPhaseShiftImag * real[off];

          real[off] = real[i] - tr;
          imag[off] = imag[i] - ti;
          real[i] += tr;
          imag[i] += ti;

          i += halfSize << 1;
        }

        tmpReal = currentPhaseShiftReal;
        currentPhaseShiftReal =
          tmpReal * phaseShiftStepReal -
          currentPhaseShiftImag * phaseShiftStepImag;
        currentPhaseShiftImag =
          tmpReal * phaseShiftStepImag +
          currentPhaseShiftImag * phaseShiftStepReal;
      }

      halfSize = halfSize << 1;
    }

    i = 0;
    const N = bufferSize / 2;
    for (; i < N; i++) {
      rval = real[i];
      ival = imag[i];
      mag = bSi * sqrt(rval * rval + ival * ival);

      if (mag > this.peak) {
        this.peak = mag;
      }
      spectrum[i] = mag;
    }
    return spectrum;
  }
}

