import {FFT} from './FFT.js';

function _isFunction(v) {
  return typeof v === 'function';
}

function _result(v) {
  return _isFunction(v) ? v() : v;
}

export class Spectrogram {
  constructor(canvas, audioContext, options) {
    const baseCanvasOptions = options.canvas || {};
    this._baseCanvas = canvas;
    this._baseCanvasContext = this._baseCanvas.getContext('2d');
    this._baseCanvas.width = _result(baseCanvasOptions.width) || this._baseCanvas.width;
    this._baseCanvas.height = _result(baseCanvasOptions.height) || this._baseCanvas.height;
    this._layers = {
      drawOrder: []
    };

    let colors;
    if (typeof options.colors === 'function') {
      colors = options.colors(275);
    } else {
      colors = this._generateDefaultColors(275);
    }
    this._colors = colors;

    this._audio = {
      context: audioContext
    };
    this._FFT_SIZE = 1024;
  }

  draw(audioBuffer) {
    if (Object.prototype.toString.call(audioBuffer) !== '[object AudioBuffer]') {
      throw 'audioBuffer is not of type AudioBuffer'
    }

    this._audio.buffer = audioBuffer
    this._layers.spectro = this._layers.spectro || this._initializeLayer();
    this._layers.drawOrder[0] = this._layers.spectro;
    this.clear(this._layers.spectro);
    this._layers.spectro.fillStyle = this._getColor(0);
    this._layers.spectro.fillRect(0, 0, this._baseCanvas.width, this._baseCanvas.height);

    this._draw();
  };

  drawPlayhead() {
    this._layers.playhead = this._initializeLayer();
    this._layers.drawOrder[1] = this._layers.playhead;
    this._layers.playhead.requestId = requestAnimationFrame(this._drawPayhead.bind(this));
  };

  stopDrawingPlayhead() {
    cancelAnimationFrame(this._layers.playhead.requestId);
    delete this._layers.playhead;
    this._layers.drawOrder.splice(1, 1);
    this._drawLayers();
  };

  clear(canvasContext) {
    canvasContext = canvasContext || this._baseCanvasContext;
    canvasContext.clearRect(0, 0, this._baseCanvas.width, this._baseCanvas.height);
  };

  _draw() {
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
        this._layers.spectro.fillStyle = this._getColor(value);
        this._layers.spectro.fillRect(segmentNumber, height - frequencyNumber, 1, 1);
      }
      currentOffset += this._FFT_SIZE;
    }
    this._drawLayers();
  };

  _drawPayhead() {
    this.clear(this._layers.playhead);
    this._layers.playhead.fillStyle = "yellow";
    this._layers.playhead.fillRect(this._getXPositionOfPlayhead(), 0, 1, this._baseCanvas.height);
    this._drawLayers();
    this._layers.playhead.requestId = requestAnimationFrame(this._drawPayhead.bind(this));
  }

  _getXPositionOfPlayhead() {
    var channelDataIndex = this._audio.context.currentTime * this._audio.buffer.sampleRate;
    return Math.floor(channelDataIndex / this._FFT_SIZE);
  }

  _initializeLayer() {
    var canvas = document.createElement('canvas');
    canvas.width = this._baseCanvas.width;
    canvas.height = this._baseCanvas.height;
    return canvas.getContext('2d');
  };

  _drawLayers() {
    var baseCanvasContext = this._baseCanvasContext;
    var baseCanvas = this._baseCanvas;
    this._layers.drawOrder.forEach(function (layer) {
      baseCanvasContext.drawImage(layer.canvas, 0, 0, baseCanvas.width, baseCanvas.height);
    })
  };

  _generateDefaultColors(steps) {
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

  _getColor(index) {
    var color = this._colors[index >> 0];

    if (typeof color === 'undefined') {
      color = this._colors[0];
    }

    return color;
  };
}
