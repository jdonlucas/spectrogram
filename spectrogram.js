function _isFunction(v) {
  return typeof v === 'function';
}

function _result(v) {
  return _isFunction(v) ? v() : v;
}

export class Spectrogram {
  constructor(canvas, options) {
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

    this._audio = {};
    this._FFT_SIZE = 1024;
    this._analyzerWorker = new Worker('../FFT.js');
  }

  draw(audioBuffer) {
    if (Object.prototype.toString.call(audioBuffer) !== '[object AudioBuffer]') {
      throw 'audioBuffer is not of type AudioBuffer'
    }

    this._sampleRate = audioBuffer.sampleRate;
    this._layers.spectro = this._layers.spectro || this._initializeLayer();
    this._layers.drawOrder[0] = this._layers.spectro;
    this.clear(this._layers.spectro);
    this._layers.spectro.fillStyle = this._getColor(0);
    this._layers.spectro.fillRect(0, 0, this._baseCanvas.width, this._baseCanvas.height);

    const channelDataBuffer = audioBuffer.getChannelData(0).buffer;
    this._analyzerWorker.postMessage({
      width:  this._baseCanvas.width,
      channelDataBuffer,
      fftSize: this._FFT_SIZE
    }, [channelDataBuffer])
    this._analyzerWorker.onmessage = this._draw.bind(this);
  };

  drawPlayhead(audioElement) {
    this._layers.playhead = this._initializeLayer();
    this._layers.drawOrder[1] = this._layers.playhead;
    this._audio.element = audioElement;
    this._layers.playhead.requestId = requestAnimationFrame(this._drawPlayhead.bind(this));
  };

  stopDrawingPlayhead() {
    cancelAnimationFrame(this._layers.playhead.requestId);
    delete this._layers.playhead;
    this._layers.drawOrder.splice(1, 1);
    delete this._audio.element;
    this._drawLayers();
  };

  clear(canvasContext) {
    canvasContext = canvasContext || this._baseCanvasContext;
    canvasContext.clearRect(0, 0, this._baseCanvas.width, this._baseCanvas.height);
  };

  _draw({data: freqData}) {
    freqData.forEach((frequencyEnergies, time) => {
      const height = this._baseCanvas.height;
      frequencyEnergies.forEach((frequencyEnergy, frequencyNumber) => {
        this._layers.spectro.fillStyle = this._getColor(frequencyEnergy);
        this._layers.spectro.fillRect(time, height - frequencyNumber, 1, 1);
      })
    })
    this._drawLayers();
  };

  _drawPlayhead() {
    this.clear(this._layers.playhead);
    this._layers.playhead.fillStyle = "white";
    this._layers.playhead.fillRect(this._getXPositionOfPlayhead(), 0, 1, this._baseCanvas.height);
    this._drawLayers();
    this._layers.playhead.requestId = requestAnimationFrame(this._drawPlayhead.bind(this));
  }

  _getXPositionOfPlayhead() {
    var channelDataIndex = this._audio.element.currentTime * this._sampleRate;
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
