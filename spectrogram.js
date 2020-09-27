(function (root, factory) {
  'use strict';

  if (typeof exports !== 'undefined' && typeof require !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = factory(require('FFT'));
    }
    exports.Spectrogram = factory(require('FFT'));
  } else if (typeof define === 'function' && define.amd) {
    define(['FFT'], factory);
  } else {
    root.Spectrogram = factory(root.FFT);
  }

})(this, function (FFT) {
  'use strict';

  function _isFunction(v) {
    return typeof v === 'function';
  }

  function _result(v) {
    return _isFunction(v) ? v() : v;
  }

  var toString = Object.prototype.toString;

  function Spectrogram(canvas, options) {
    if (!(this instanceof Spectrogram)) {
      return new Spectrogram(canvas, options);
    }

    var baseCanvasOptions = options.canvas || {};
    this._baseCanvas = canvas;
    this._baseCanvasContext = this._baseCanvas.getContext('2d');
    this._baseCanvas.width = _result(baseCanvasOptions.width) || this._baseCanvas.width;
    this._baseCanvas.height = _result(baseCanvasOptions.height) || this._baseCanvas.height;

    var colors;
    if (typeof options.colors === 'function') {
      colors = options.colors(275);
    } else {
      colors = this._generateDefaultColors(275);
    }
    this._colors = colors;

    this._audio = {};
    this._FFT_SIZE = 1024;
  }

  Spectrogram.prototype._draw = function () {
    var fft = new FFT(this._audio.buffer);
    var channelData = this._audio.buffer.getChannelData(0);
    var currentOffset = 0;
    var width = this._baseCanvas.width;
    var height = this._baseCanvas.height;
    while (currentOffset + this._FFT_SIZE < channelData.length) {
      var segment = channelData.slice(
        currentOffset,
        currentOffset + this._FFT_SIZE
      );
      var spectrum = fft.calculateSpectrum(segment);
      var array = new Uint8Array(this._FFT_SIZE / 2);
      for (var j = 0; j < this._FFT_SIZE / 2; j++) {
        array[j] = Math.max(-255, (Math.log(spectrum[j]) * Math.LOG10E) * 45);
      }
      var segmentNumber = (currentOffset + this._FFT_SIZE) / this._FFT_SIZE;
      if (segmentNumber > width) {
        break;
      }
      for (var frequencyNumber = 0; frequencyNumber < array.length; frequencyNumber++) {
        var value = array[frequencyNumber];
        this._audio.spectroLayer.fillStyle = this._getColor(value);
        this._audio.spectroLayer.fillRect(segmentNumber, height - frequencyNumber, 1, 1);
      }
      this._baseCanvasContext.drawImage(this._audio.spectroLayer.canvas, 0, 0, width, height);
      currentOffset += this._FFT_SIZE;
    }
  };

  Spectrogram.prototype.draw = function (audioBuffer) {
    if (toString.call(audioBuffer) !== '[object AudioBuffer]') {
      throw 'audioBuffer is not of type AudioBuffer'
    }

    this._audio.buffer = audioBuffer
    if (!this._audio.spectroLayer) {
      var canvas = document.createElement('canvas');
      canvas.width = this._baseCanvas.width;
      canvas.height = this._baseCanvas.height;
      this._audio.spectroLayer = canvas.getContext('2d');
    }
    this.clear(this._audio.spectroLayer);
    this._audio.spectroLayer.fillStyle = this._getColor(0);
    this._audio.spectroLayer.fillRect(0, 0, this._baseCanvas.width, this._baseCanvas.height);

    this._draw();
  };

  Spectrogram.prototype.clear = function (canvasContext) {
    canvasContext = canvasContext || this._baseCanvasContext;
    canvasContext.clearRect(0, 0, this._baseCanvas.width, this._baseCanvas.height);
  };

  Spectrogram.prototype._generateDefaultColors = function (steps) {
    var frequency = Math.PI / steps;
    var amplitude = 127;
    var center = 128;
    var slice = (Math.PI / 2) * 3.1;
    var colors = [];

    function toRGBString(v) {
      return 'rgba(' + [v, v, v, 1].toString() + ')';
    }

    for (var i = 0; i < steps; i++) {
      var v = (Math.sin((frequency * i) + slice) * amplitude + center) >> 0;

      colors.push(toRGBString(v));
    }

    return colors;
  };

  Spectrogram.prototype._getColor = function (index) {
    var color = this._colors[index >> 0];

    if (typeof color === 'undefined') {
      color = this._colors[0];
    }

    return color;
  };

  return Spectrogram;
});
