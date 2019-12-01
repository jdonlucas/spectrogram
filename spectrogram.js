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
    this._audioBuffer = null;

    this._baseCanvas = canvas;
    this._baseCanvasContext = this._baseCanvas.getContext('2d');
    this._baseCanvas.width = _result(baseCanvasOptions.width) || this._baseCanvas.width;
    this._baseCanvas.height = _result(baseCanvasOptions.height) || this._baseCanvas.height;

    var colors = [];
    if (typeof options.colors === 'function') {
      colors = options.colors(275);
    } else {
      colors = this._generateDefaultColors(275);
    }
    this._colors = colors;

    this._baseCanvasContext.fillStyle = this._getColor(0);
    this._baseCanvasContext.fillRect(0, 0, this._baseCanvas.width, this._baseCanvas.height);

    this._FFT_SIZE = 1024;
  }

  Spectrogram.prototype._draw = function () {
    var buffer = this._audioBuffer.audioBuffer;
    var fft = new FFT(buffer);
    var channelData = buffer.getChannelData(0);
    var currentOffset = 0;
    while (currentOffset + this._FFT_SIZE < channelData.length) {
      var segment = channelData.slice(
        currentOffset,
        currentOffset + this._FFT_SIZE
      );
      var spectrum = fft.calculateSpectrum(segment);
      var array = new Uint8Array(this._FFT_SIZE / 2);
      var j;
      for (j = 0; j < this._FFT_SIZE / 2; j++) {
        array[j] = Math.max(-255, (Math.log(spectrum[j]) * Math.LOG10E) * 45);
      }
      // this._drawStream(array, this._audioBuffer.canvasContext);
      currentOffset += this._FFT_SIZE;
    }
  };

  Spectrogram.prototype._drawStream = function (array, canvasContext) {
    var canvas = canvasContext.canvas;
    var width = canvas.width;
    var height = canvas.height;
    var tempCanvasContext = canvasContext._tempContext;
    var tempCanvas = tempCanvasContext.canvas;
    tempCanvasContext.drawImage(canvas, 0, 0, width, height);

    for (var i = 0; i < array.length; i++) {
      var value = array[i];
      canvasContext.fillStyle = this._getColor(value);
      canvasContext.fillRect(width - 1, height - i, 1, 1);
    }

    canvasContext.translate(-1, 0);
    // draw prev canvas before translation
    canvasContext.drawImage(tempCanvas, 0, 0, width, height, 0, 0, width, height);
    canvasContext.drawImage(tempCanvas, 0, 0, width, height, 0, 0, width, height);
    // reset transformation matrix
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);

    this._baseCanvasContext.drawImage(canvas, 0, 0, width, height);
  };

  Spectrogram.prototype.draw = function (audioBuffer) {
    var source = this._audioBuffer || {};

    if (toString.call(audioBuffer) !== '[object AudioBuffer]') {
      throw 'audioBuffer is not of type AudioBuffer'
    }

    var canvasContext = source.canvasContext;

    if (!source.canvasContext) {
      var canvas = document.createElement('canvas');
      canvas.width = this._baseCanvas.width;
      canvas.height = this._baseCanvas.height;
      canvasContext = canvas.getContext('2d');

      var tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      canvasContext._tempContext = tempCanvas.getContext('2d');
    }

    source = {
      audioBuffer: audioBuffer,
      canvasContext: canvasContext
    };

    this._audioBuffer = source;
    this._draw();
  };

  Spectrogram.prototype.clear = function (canvasContext) {
    canvasContext = canvasContext || this._audioBuffer.canvasContext;
    var canvas = canvasContext.canvas;
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext._tempContext.clearRect(0, 0, canvas.width, canvas.height);
    this._baseCanvasContext.clearRect(0, 0, canvas.width, canvas.height);
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
